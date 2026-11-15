import './../server.js';

setTimeout(async () => {
  try {
    console.log('--- RUNNING SUITE 1: VERIFY ALL CORE CAPABILITIES ---');
    await import('./verifyAll.js');
  } catch (err) {
    console.error('Test suite 1 error:', err);
    process.exit(1);
  }
}, 1500);
