const { exec, execSync } = require('child_process');
const path = require('path');

// Start the server
const server = exec('node dist/index.js', {
  env: { ...process.env, MCP_SERVER_PORT: '8080' },
});

server.stdout.on('data', (data) => {
  console.log(`Server: ${data}`);
  // Wait for a specific message indicating the server is ready
  if (data.includes('Server is running on port 8080')) {
    runTests();
  }
});

server.stderr.on('data', (data) => {
  console.error(`Server Error: ${data}`);
});

function runTests() {
  try {
    console.log("Running tests with coverage...");
    execSync('npx jest --no-cache --coverage --testMatch="<rootDir>/src/__tests__/**/*.test.ts"', { stdio: 'inherit' });
    console.log("Tests completed successfully!");
  } catch (error) {
    console.error("Error running tests:", error.message);
  } finally {
    // Stop the server
    server.kill();
  }
}