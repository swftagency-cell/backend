const fetch = require('node-fetch');

async function main() {
  const base = process.env.BASE_URL || 'http://localhost:3000';

  try {
    const statusRes = await fetch(`${base}/api/deepseek/status`);
    const statusJson = await statusRes.json();
    console.log('DeepSeek configured:', !!statusJson.configured);
    if (!statusJson.configured) {
      console.error('DEEPSEEK_API_KEY not configured. Set the environment variable and retry.');
      process.exit(1);
    }

    const genRes = await fetch(`${base}/api/deepseek/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'deepseek-chat', prompt: 'Say hello' })
    });

    const genText = await genRes.text();
    let genJson = {};
    try { genJson = JSON.parse(genText); } catch (_) {}

    console.log('Response status:', genRes.status);
    console.log('Response:', genJson);

    if (genRes.ok && genJson && genJson.success) {
      console.log('✅ DeepSeek connectivity verified');
      process.exit(0);
    } else {
      console.error('❌ DeepSeek connectivity failed');
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Connectivity error:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();

