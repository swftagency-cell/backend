const assert = require('assert');
const { callDeepseek } = require('../routes/deepseek');

async function run() {
  const originalFetch = global.fetch;

  // Mock successful response
  global.fetch = async () => ({
    ok: true,
    status: 200,
    headers: new Map(),
    text: async () => JSON.stringify({
      choices: [ { message: { content: 'Hello from DeepSeek' } } ]
    })
  });

  process.env.DEEPSEEK_API_KEY = 'test_key';
  const okResult = await callDeepseek('deepseek-chat', 'Say hello');
  assert.strictEqual(okResult.ok, true, 'Expected ok for success');
  assert.strictEqual(okResult.text, 'Hello from DeepSeek', 'Expected parsed text');

  // Mock rate limited response
  global.fetch = async () => ({
    ok: false,
    status: 429,
    headers: { get: (k) => (k === 'Retry-After' ? '2' : null) },
    text: async () => JSON.stringify({ error: { message: 'Rate limit exceeded' } })
  });

  const rlResult = await callDeepseek('deepseek-chat', 'Say hello');
  assert.strictEqual(rlResult.ok, false, 'Expected not ok for rate limit');
  assert.strictEqual(rlResult.status, 429, 'Expected 429 status');
  assert.strictEqual(rlResult.rate_limited, true, 'Expected rate_limited true');

  // Mock missing API key
  delete process.env.DEEPSEEK_API_KEY;
  global.fetch = originalFetch;

  const noKey = await callDeepseek('deepseek-chat', 'Test');
  assert.strictEqual(noKey.ok, false, 'Expected not ok when API key missing');

  return { passed: true };
}

module.exports = { run };