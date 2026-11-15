import './../server.js';

setTimeout(async () => {
  try {
    await import('./verifyAll.js');
  } catch (err) {
    console.error('Test runner failure:', err);
    process.exit(1);
  }
}, 1500);

