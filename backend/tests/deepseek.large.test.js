const assert = require('assert');

async function run() {
  const originalFetch = global.fetch;

  let callCount = 0;
  global.fetch = async () => {
    callCount++;
    return {
      ok: true,
      status: 200,
      headers: new Map(),
      text: async () => JSON.stringify({
        choices: [{ message: { content: callCount === 1 ? 'summary-1' : (callCount === 2 ? 'summary-2' : 'final-answer') } }]
      })
    };
  };

  process.env.DEEPSEEK_API_KEY = 'test_key';
  process.env.DEEPSEEK_MAX_PROMPT_CHARS = '1000';
  process.env.DEEPSEEK_CHUNK_SIZE = '600';
  process.env.DEEPSEEK_TIMEOUT_MS = '5000';

  // Load module after env is set to ensure new values are picked up
  try { delete require.cache[require.resolve('../routes/deepseek')]; } catch (_) {}
  const { callDeepseek } = require('../routes/deepseek');

  const large = 'x'.repeat(1600);
  const result = await callDeepseek('deepseek-chat', large);
  assert.strictEqual(result.ok, true, 'Expected success for chunked prompt');

  // Expect at least 3 calls: two summaries + one final
  assert.ok(callCount >= 3, 'Expected multiple API calls for chunking');

  global.fetch = originalFetch;
  return { passed: true };
}

module.exports = { run };
