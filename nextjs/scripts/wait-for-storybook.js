/* eslint-disable @typescript-eslint/no-require-imports */
const http = require('http');

const checkStorybook = () => {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:6006', () => {
      resolve(true);
    });
    
    req.on('error', () => {
      reject(false);
    });
    
    req.setTimeout(1000, () => {
      req.destroy();
      reject(false);
    });
  });
};

const waitForStorybook = async (maxAttempts = 60) => {
  console.log('Waiting for Storybook to start on port 6006...');
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await checkStorybook();
      console.log('✓ Storybook is ready!');
      return true;
    } catch {
      if (i % 5 === 0) {
        process.stdout.write('.');
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log('\n✗ Storybook did not start within 60 seconds');
  console.log('Starting Next.js server anyway - Storybook may not be available yet');
  return false;
};

waitForStorybook().then(() => {
  process.exit(0);
}).catch(() => {
  process.exit(0);
});

