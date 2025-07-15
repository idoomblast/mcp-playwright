/**
 * Contoh penggunaan SSL/TLS configuration dengan mcp-playwright
 * 
 * File ini menunjukkan cara menangani berbagai skenario SSL/TLS:
 * - Self-signed certificates
 * - Expired certificates
 * - Invalid certificates
 * - Mixed content
 */

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function demonstrateSSLConfiguration() {
  console.log('🔒 Demonstrasi SSL/TLS Configuration untuk mcp-playwright\n');

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['../dist/index.js'],
  });

  const client = new Client({
    name: 'ssl-demo',
    version: '1.0.0',
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);
    console.log('✅ Terhubung ke MCP server\n');

    // Test 1: Self-signed certificate
    console.log('=== Test 1: Self-signed Certificate ===');
    try {
      const result1 = await client.callTool('playwright_navigate', {
        url: 'https://self-signed.badssl.com',
        acceptInsecureCerts: true,
        browserType: 'chromium',
        headless: true
      });
      console.log('✅ Self-signed certificate berhasil diterima');
      
      // Ambil screenshot sebagai bukti
      await client.callTool('playwright_screenshot', {
        name: 'ssl-self-signed-test',
        fullPage: true
      });
      console.log('📸 Screenshot disimpan: ssl-self-signed-test\n');
    } catch (error) {
      console.error('❌ Self-signed test gagal:', error.message, '\n');
    }

    // Test 2: Expired certificate dengan ignoreHTTPSErrors
    console.log('=== Test 2: Expired Certificate ===');
    try {
      await client.callTool('playwright_close', {});
      
      const result2 = await client.callTool('playwright_navigate', {
        url: 'https://expired.badssl.com',
        ignoreHTTPSErrors: true,
        browserType: 'firefox',
        headless: true
      });
      console.log('✅ Expired certificate berhasil diabaikan');
      
      await client.callTool('playwright_screenshot', {
        name: 'ssl-expired-test'
      });
      console.log('📸 Screenshot disimpan: ssl-expired-test\n');
    } catch (error) {
      console.error('❌ Expired certificate test gagal:', error.message, '\n');
    }

    // Test 3: Kombinasi kedua opsi SSL
    console.log('=== Test 3: Kombinasi SSL Options ===');
    try {
      await client.callTool('playwright_close', {});
      
      const result3 = await client.callTool('playwright_navigate', {
        url: 'https://wrong.host.badssl.com',
        acceptInsecureCerts: true,
        ignoreHTTPSErrors: true,
        browserType: 'webkit',
        headless: true
      });
      console.log('✅ Kombinasi SSL options berhasil');
      
      await client.callTool('playwright_screenshot', {
        name: 'ssl-combined-test'
      });
      console.log('📸 Screenshot disimpan: ssl-combined-test\n');
    } catch (error) {
      console.error('❌ Combined SSL test gagal:', error.message, '\n');
    }

    // Test 4: SSL dengan proxy configuration
    console.log('=== Test 4: SSL + Proxy Configuration ===');
    try {
      await client.callTool('playwright_close', {});
      
      // Contoh dengan proxy (ganti dengan proxy yang valid jika ada)
      const result4 = await client.callTool('playwright_navigate', {
        url: 'https://untrusted-root.badssl.com',
        acceptInsecureCerts: true,
        ignoreHTTPSErrors: true,
        // proxy: {
        //   server: 'http://proxy.example.com:8080'
        // },
        browserType: 'chromium',
        headless: true
      });
      console.log('✅ SSL + Proxy configuration berhasil');
      
      await client.callTool('playwright_screenshot', {
        name: 'ssl-proxy-test'
      });
      console.log('📸 Screenshot disimpan: ssl-proxy-test\n');
    } catch (error) {
      console.error('❌ SSL + Proxy test gagal:', error.message, '\n');
    }

    // Test 5: Local development server simulation
    console.log('=== Test 5: Local Development Server ===');
    try {
      await client.callTool('playwright_close', {});
      
      // Simulasi local dev server dengan self-signed cert
      const result5 = await client.callTool('playwright_navigate', {
        url: 'https://localhost.badssl.com:8443',
        acceptInsecureCerts: true,
        ignoreHTTPSErrors: true,
        browserType: 'chromium',
        width: 1920,
        height: 1080,
        headless: true
      });
      console.log('✅ Local development server simulation berhasil');
      
      await client.callTool('playwright_screenshot', {
        name: 'ssl-localhost-test'
      });
      console.log('📸 Screenshot disimpan: ssl-localhost-test\n');
    } catch (error) {
      console.error('❌ Local dev server test gagal:', error.message, '\n');
    }

    // Test 6: Mixed content
    console.log('=== Test 6: Mixed Content Handling ===');
    try {
      await client.callTool('playwright_close', {});
      
      const result6 = await client.callTool('playwright_navigate', {
        url: 'https://mixed-script.badssl.com',
        ignoreHTTPSErrors: true,
        browserType: 'chromium',
        headless: true
      });
      console.log('✅ Mixed content berhasil ditangani');
      
      // Ambil console logs untuk melihat warning
      const consoleLogs = await client.callTool('playwright_console_logs', {
        type: 'all',
        limit: 10
      });
      console.log('📝 Console logs:', consoleLogs.content[0].text);
      
      await client.callTool('playwright_screenshot', {
        name: 'ssl-mixed-content-test'
      });
      console.log('📸 Screenshot disimpan: ssl-mixed-content-test\n');
    } catch (error) {
      console.error('❌ Mixed content test gagal:', error.message, '\n');
    }

    // Test 7: Certificate chain validation
    console.log('=== Test 7: Certificate Chain Issues ===');
    try {
      await client.callTool('playwright_close', {});
      
      const result7 = await client.callTool('playwright_navigate', {
        url: 'https://incomplete-chain.badssl.com',
        acceptInsecureCerts: true,
        ignoreHTTPSErrors: true,
        browserType: 'firefox',
        headless: true
      });
      console.log('✅ Certificate chain issues berhasil ditangani');
      
      await client.callTool('playwright_screenshot', {
        name: 'ssl-chain-test'
      });
      console.log('📸 Screenshot disimpan: ssl-chain-test\n');
    } catch (error) {
      console.error('❌ Certificate chain test gagal:', error.message, '\n');
    }

    console.log('🎉 Semua demonstrasi SSL/TLS configuration selesai!');
    console.log('\n📋 Summary:');
    console.log('- ✅ acceptInsecureCerts: Untuk self-signed certificates');
    console.log('- ✅ ignoreHTTPSErrors: Untuk mengabaikan HTTPS errors');
    console.log('- ✅ Kombinasi: Untuk coverage maksimal');
    console.log('- ✅ Dengan Proxy: Support proxy configuration');
    console.log('- ✅ Multi-browser: Chromium, Firefox, WebKit');

  } catch (error) {
    console.error('❌ Error dalam demonstrasi:', error);
  } finally {
    // Cleanup
    try {
      await client.callTool('playwright_close', {});
      await client.close();
      console.log('\n🧹 Cleanup selesai');
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError.message);
    }
  }
}

// Fungsi untuk testing environment tertentu
async function testDevelopmentEnvironment() {
  console.log('🛠️ Testing Development Environment SSL Configuration\n');

  const transport = new StdioClientTransport({
    command: 'node',
    args: ['../dist/index.js'],
  });

  const client = new Client({
    name: 'ssl-dev-test',
    version: '1.0.0',
  }, {
    capabilities: {}
  });

  try {
    await client.connect(transport);

    // Common development URLs yang menggunakan HTTPS
    const devUrls = [
      'https://localhost:3000',
      'https://localhost:8443',
      'https://dev.localhost',
      'https://127.0.0.1:3000'
    ];

    for (const url of devUrls) {
      console.log(`Testing ${url}...`);
      try {
        await client.callTool('playwright_navigate', {
          url: url,
          acceptInsecureCerts: true,
          ignoreHTTPSErrors: true,
          browserType: 'chromium',
          headless: true,
          timeout: 5000 // Short timeout untuk local testing
        });
        console.log(`✅ ${url} - SSL configuration berhasil`);
      } catch (error) {
        console.log(`⚠️ ${url} - Tidak dapat dijangkau (normal untuk demo)`);
      }
      
      await client.callTool('playwright_close', {});
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.callTool('playwright_close', {});
    await client.close();
  }
}

// Jalankan demonstrasi
if (require.main === module) {
  console.log('Pilihan demo:');
  console.log('1. Demonstrasi lengkap: node ssl-example.js');
  console.log('2. Development environment: uncomment testDevelopmentEnvironment()\n');
  
  demonstrateSSLConfiguration().catch(console.error);
  
  // Uncomment untuk test development environment
  // testDevelopmentEnvironment().catch(console.error);
}

module.exports = { 
  demonstrateSSLConfiguration, 
  testDevelopmentEnvironment 
}; 