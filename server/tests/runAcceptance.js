import './../server.js';

setTimeout(async () => {
  try {
    console.log('--- RUNNING SUITE 2: COMPLETE ACCEPTANCE CRITERIA ---');
    await import('./verifyAcceptanceCriteria.js');
  } catch (err) {
    console.error('Acceptance test runner failure:', err);
    process.exit(1);
  }
}, 1500);

