const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { getDeepseekApiKey } = require('../utils/secrets');
const MAX_PROMPT_CHARS = parseInt(process.env.DEEPSEEK_MAX_PROMPT_CHARS || '20000', 10);
const CHUNK_SIZE = parseInt(process.env.DEEPSEEK_CHUNK_SIZE || '12000', 10);
const TIMEOUT_MS = parseInt(process.env.DEEPSEEK_TIMEOUT_MS || '60000', 10);
const RL_WINDOW_MS = parseInt(process.env.DEEPSEEK_RATE_LIMIT_WINDOW_MS || '60000', 10);
const RL_MAX = parseInt(process.env.DEEPSEEK_RATE_LIMIT_MAX || '60', 10);
const CACHE_ENABLED = (process.env.NODE_ENV === 'test') ? false : /^(1|true|yes)$/i.test(process.env.DEEPSEEK_CACHE_ENABLED || 'true');
const CACHE_TTL_MS = parseInt(process.env.DEEPSEEK_CACHE_TTL_MS || '120000', 10);
const CACHE_MAX = parseInt(process.env.DEEPSEEK_CACHE_MAX || '100', 10);
const MAX_CONCURRENT = parseInt(process.env.DEEPSEEK_MAX_CONCURRENT || '10', 10);
const MAX_RETRIES = parseInt(process.env.DEEPSEEK_MAX_RETRIES || '2', 10);

const cache = new Map();
let activeRequests = 0;

function getApiKey() {
  return getDeepseekApiKey();
}
const BASE_URL = 'https://api.deepseek.com';

function normalizeModel(model) {
  const aliases = {
    'deepseek-chat': 'deepseek-chat',
    'deepseek-reasoner': 'deepseek-reasoner'
  };
  return aliases[model] || 'deepseek-chat';
}

function chunkText(text, size) {
  const chunks = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

async function requestDeepseek(modelId, messages) {
  activeRequests++;
  if (activeRequests > MAX_CONCURRENT) {
    activeRequests--;
    return { ok: false, status: 429, error: 'Server busy, please retry later' };
  }
  const API_KEY = getApiKey();
  if (!API_KEY) {
    return { ok: false, status: 500, error: 'DEEPSEEK_API_KEY is not configured' };
  }

  const url = `${BASE_URL}/chat/completions`;
  const payload = { model: modelId, messages, stream: false };

  const AbortController = global.AbortController || require('abort-controller');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    let attempt = 0;
    let response;
    let raw = '';
    while (true) {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      raw = await response.text();
      if (response.ok) break;
      const retryAfterHdr = response.headers.get('Retry-After');
      const retryAfter = retryAfterHdr ? parseInt(retryAfterHdr, 10) * 1000 : 1000 * (attempt + 1);
      if (response.status === 429 && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, isNaN(retryAfter) ? 1000 : retryAfter));
        attempt++;
        continue;
      }
      break;
    }

    if (!response.ok) {
      let message = raw || `HTTP ${response.status}`;
      try {
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed) message = parsed?.error?.message || parsed?.message || message;
      } catch (_) {}

      const retryAfter = response.headers.get('Retry-After');
      return { ok: false, status: response.status, error: message, rate_limited: response.status === 429, retry_after: retryAfter };
    }

    let data = {};
    try { data = raw ? JSON.parse(raw) : {}; } catch (_) { data = {}; }
    const text = data?.choices?.[0]?.message?.content?.trim?.() || '';
    return { ok: true, text };
  } catch (err) {
    const isAbort = err && (err.name === 'AbortError' || /aborted/i.test(err.message || ''));
    const message = isAbort ? 'Request timed out' : (err?.message || 'Network error');
    return { ok: false, status: 504, error: message };
  } finally {
    clearTimeout(timer);
    activeRequests = Math.max(0, activeRequests - 1);
  }
}

async function callDeepseek(modelId, prompt) {
  const trimmed = (prompt || '').trim();
  if (!trimmed) {
    return { ok: false, status: 400, error: 'Prompt is required' };
  }

  const cacheKey = `${modelId}:${crypto.createHash('sha256').update(trimmed).digest('hex')}`;
  if (CACHE_ENABLED && cache.has(cacheKey)) {
    const entry = cache.get(cacheKey);
    if (entry.expiresAt > Date.now()) {
      return { ok: true, text: entry.text, cache: 'hit' };
    }
    cache.delete(cacheKey);
  }

  // Normal path when under limit
  if (trimmed.length <= MAX_PROMPT_CHARS) {
    const r = await requestDeepseek(modelId, [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: trimmed }
    ]);
    if (r.ok && CACHE_ENABLED) {
      cache.set(cacheKey, { text: r.text, expiresAt: Date.now() + CACHE_TTL_MS });
      if (cache.size > CACHE_MAX) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
    }
    return r;
  }

  // Over limit: chunk and summarize
  const parts = chunkText(trimmed, CHUNK_SIZE);

  // Summarize each chunk
  const summaries = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const r = await requestDeepseek(modelId, [
      { role: 'system', content: 'You are a concise summarization assistant. Summarize the following text faithfully retaining key facts and context.' },
      { role: 'user', content: p }
    ]);
    if (!r.ok) {
      return { ok: false, status: r.status || 500, error: r.error || 'Failed to summarize chunk', limit_info: { max_chars: MAX_PROMPT_CHARS, chunk_size: CHUNK_SIZE } };
    }
    summaries.push(r.text || '');
  }

  const combined = summaries.join('\n\n');
  // Final answer using summarized content
  const final = await requestDeepseek(modelId, [
    { role: 'system', content: 'You are a helpful assistant. Use the provided summarized content to answer the user’s request accurately.' },
    { role: 'user', content: combined }
  ]);

  if (!final.ok) {
    return { ok: false, status: final.status || 500, error: final.error || 'Failed to generate from summary', limit_info: { max_chars: MAX_PROMPT_CHARS, chunk_size: CHUNK_SIZE } };
  }
  if (CACHE_ENABLED) {
    cache.set(cacheKey, { text: final.text, expiresAt: Date.now() + CACHE_TTL_MS });
    if (cache.size > CACHE_MAX) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
  }
  return final;
}

router.post('/generate', async (req, res) => {
  try {
    const { model = 'deepseek-chat', prompt } = req.body || {};

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    const modelId = normalizeModel(model);
    const t0 = Date.now();
    const result = await callDeepseek(modelId, prompt);
    const elapsed = Date.now() - t0;

    if (!result.ok) {
      res.set('X-DS-Elapsed', String(elapsed));
      return res.status(result.status || 500).json({ success: false, error: result.error || 'Unknown error', rate_limited: !!result.rate_limited, retry_after: result.retry_after, limit_info: result.limit_info });
    }

    res.set('X-DS-Elapsed', String(elapsed));
    if (result.cache === 'hit') res.set('X-DS-Cache', 'hit'); else res.set('X-DS-Cache', 'miss');
    return res.json({ success: true, model: modelId, text: result.text });
  } catch (error) {
    const message = error?.message || 'Unknown error';
    return res.status(500).json({ success: false, error: message });
  }
});

router.get('/status', (req, res) => {
  const hasKey = !!getApiKey();
  res.json({ configured: hasKey });
});

const deepseekLimiter = rateLimit({ windowMs: RL_WINDOW_MS, max: RL_MAX, standardHeaders: true, legacyHeaders: false });
router.use(deepseekLimiter);

module.exports = { router, callDeepseek };
