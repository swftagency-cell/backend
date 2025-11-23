process.env.NODE_ENV = 'test';
const { run } = require('./deepseek.test');
const { run: runLarge } = require('./deepseek.large.test');
const { run: runPerf } = require('./deepseek.perf.test');

(async () => {
  try {
    const result = await run();
    console.log('✅ DeepSeek integration tests passed');
    const resultLarge = await runLarge();
    console.log('✅ DeepSeek large prompt tests passed');
    const resultPerf = await runPerf();
    console.log('✅ DeepSeek performance tests passed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Tests failed:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
