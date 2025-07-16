/**
 * Example demonstrating browser profile functionality with mcp-playwright
 * 
 * This file shows various scenarios for using persistent browser profiles
 * to maintain session data, cookies, and other browser state between runs.
 */

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const path = require('path');
const os = require('os');

async function main() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['../dist/index.js'],
  });

  const client = new Client({
    name: 'profile-example',
    version: '1.0.0',
  }, {
    capabilities: {}
  });

  await client.connect(transport);

  try {
    // Example 1: Basic persistent profile
    console.log('=== Example 1: Basic Profile Usage ===');
    const profileDir = path.join(os.tmpdir(), 'playwright-profile-demo');
    
    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org/cookies/set/test-cookie/test-value',
      userDataDir: profileDir,
      headless: true
    });

    // Take screenshot to verify
    await client.callTool('playwright_screenshot', {
      name: 'profile-with-cookie'
    });

    // Close browser - profile is saved
    await client.callTool('playwright_close', {});

    // Reopen with same profile - cookie should persist
    console.log('\n=== Reopening with same profile - cookie should persist ===');
    
    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org/cookies',
      userDataDir: profileDir, // Same profile directory
      headless: true
    });

    await client.callTool('playwright_screenshot', {
      name: 'profile-cookie-persisted'
    });

    await client.callTool('playwright_close', {});

    // Example 2: Multi-browser profiles
    console.log('\n=== Example 2: Different Browser Types with Profiles ===');
    
    const chromiumProfile = path.join(os.tmpdir(), 'chromium-profile');
    const firefoxProfile = path.join(os.tmpdir(), 'firefox-profile');

    // Chromium profile
    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org/user-agent',
      userDataDir: chromiumProfile,
      browserType: 'chromium',
      headless: true
    });

    await client.callTool('playwright_screenshot', {
      name: 'chromium-profile-test'
    });

    await client.callTool('playwright_close', {});

    // Firefox profile
    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org/user-agent',
      userDataDir: firefoxProfile,
      browserType: 'firefox',
      headless: true
    });

    await client.callTool('playwright_screenshot', {
      name: 'firefox-profile-test'
    });

    await client.callTool('playwright_close', {});

    // Example 3: Profile with proxy configuration
    console.log('\n=== Example 3: Profile with Proxy ===');
    
    const proxyProfile = path.join(os.tmpdir(), 'proxy-profile');
    
    // Note: This is a demo proxy config - replace with actual proxy
    try {
      await client.callTool('playwright_navigate', {
        url: 'https://httpbin.org/ip',
        userDataDir: proxyProfile,
        proxy: {
          server: 'http://demo-proxy.example.com:8080' // Demo proxy
        },
        headless: true
      });

      await client.callTool('playwright_screenshot', {
        name: 'proxy-profile-test'
      });
    } catch (error) {
      console.log('Proxy example failed (expected with demo proxy):', error.message);
    }

    await client.callTool('playwright_close', {});

    // Example 4: Custom viewport with profile
    console.log('\n=== Example 4: Custom Viewport with Profile ===');
    
    const customProfile = path.join(os.tmpdir(), 'custom-viewport-profile');
    
    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org/base64/SFRUUEJJTiBpcyBhd2Vzb21l',
      userDataDir: customProfile,
      width: 1920,
      height: 1080,
      headless: true
    });

    await client.callTool('playwright_screenshot', {
      name: 'custom-viewport-profile',
      fullPage: true
    });

    await client.callTool('playwright_close', {});

    // Example 5: Simulating login session persistence
    console.log('\n=== Example 5: Login Session Simulation ===');
    
    const loginProfile = path.join(os.tmpdir(), 'login-session-profile');
    
    // Simulate login by setting session cookie
    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org/cookies/set/session_id/abc123def456',
      userDataDir: loginProfile,
      headless: true
    });

    // Navigate to protected area (simulated)
    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org/cookies',
      userDataDir: loginProfile, // Same profile - session persists
      headless: true
    });

    await client.callTool('playwright_screenshot', {
      name: 'persistent-login-session'
    });

    await client.callTool('playwright_close', {});

    // Example 6: Multiple profile comparison
    console.log('\n=== Example 6: Multiple Profile Comparison ===');
    
    const profile1 = path.join(os.tmpdir(), 'user1-profile');
    const profile2 = path.join(os.tmpdir(), 'user2-profile');

    // User 1 profile
    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org/cookies/set/user/user1',
      userDataDir: profile1,
      headless: true
    });

    await client.callTool('playwright_screenshot', {
      name: 'user1-profile-state'
    });

    await client.callTool('playwright_close', {});

    // User 2 profile
    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org/cookies/set/user/user2',
      userDataDir: profile2,
      headless: true
    });

    await client.callTool('playwright_screenshot', {
      name: 'user2-profile-state'
    });

    await client.callTool('playwright_close', {});

    // Verify profiles are independent
    console.log('\n=== Verifying profile independence ===');
    
    // Check User 1 profile
    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org/cookies',
      userDataDir: profile1, // User 1's profile
      headless: true
    });

    await client.callTool('playwright_screenshot', {
      name: 'user1-profile-verification'
    });

    await client.callTool('playwright_close', {});

    // Check User 2 profile
    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org/cookies',
      userDataDir: profile2, // User 2's profile
      headless: true
    });

    await client.callTool('playwright_screenshot', {
      name: 'user2-profile-verification'
    });

    console.log('\n=== Profile Examples Completed ===');
    console.log('Screenshots saved for each example');
    console.log(`Profile directories created in: ${os.tmpdir()}`);
    console.log('\nProfile directories:');
    console.log(`- Basic profile: ${profileDir}`);
    console.log(`- Chromium profile: ${chromiumProfile}`);
    console.log(`- Firefox profile: ${firefoxProfile}`);
    console.log(`- Proxy profile: ${proxyProfile}`);
    console.log(`- Custom viewport profile: ${customProfile}`);
    console.log(`- Login session profile: ${loginProfile}`);
    console.log(`- User 1 profile: ${profile1}`);
    console.log(`- User 2 profile: ${profile2}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Ensure browser is closed
    try {
      await client.callTool('playwright_close', {});
    } catch (e) {
      // Browser might already be closed
    }
    await client.close();
  }
}

// Usage instructions
console.log('=== Browser Profile Examples ===');
console.log('This example demonstrates various browser profile scenarios:');
console.log('1. Basic persistent profile with cookies');
console.log('2. Multi-browser type profiles');
console.log('3. Profile with proxy configuration');
console.log('4. Custom viewport with profile');
console.log('5. Login session persistence simulation');
console.log('6. Multiple independent profiles');
console.log('\nRunning examples...\n');

// Run the examples
main().catch(console.error); 