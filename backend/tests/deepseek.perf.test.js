const assert = require('assert');

async function run() {
  const originalFetch = global.fetch;
  let callCount = 0;

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  global.fetch = async () => {
    callCount++;
    await delay(200);
    return {
      ok: true,
      status: 200,
      headers: new Map(),
      text: async () => JSON.stringify({
        choices: [{ message: { content: 'ok' } }]
      })
    };
  };

  process.env.DEEPSEEK_API_KEY = 'test_key';
  process.env.DEEPSEEK_MAX_PROMPT_CHARS = '1000';
  process.env.DEEPSEEK_CHUNK_SIZE = '700';
  process.env.DEEPSEEK_TIMEOUT_MS = '3000';

  try { delete require.cache[require.resolve('../routes/deepseek')]; } catch (_) {}
  const { callDeepseek } = require('../routes/deepseek');

  const large = 'y'.repeat(1800);
  const start = Date.now();
  const result = await callDeepseek('deepseek-chat', large);
  const elapsed = Date.now() - start;

  assert.strictEqual(result.ok, true, 'Expected success');
  assert.ok(callCount >= 3, 'Expected multiple calls for chunking');
  assert.ok(elapsed < 3000, 'Expected completion under timeout threshold');

  global.fetch = originalFetch;
  return { passed: true };
}

module.exports = { run };
