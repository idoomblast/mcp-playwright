/**
 * Contoh penggunaan proxy configuration dengan mcp-playwright
 * 
 * File ini menunjukkan cara menggunakan proxy dalam berbagai skenario
 */

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function main() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['../build/index.js'],
  });

  const client = new Client({
    name: 'proxy-example',
    version: '1.0.0',
  }, {
    capabilities: {}
  });

  await client.connect(transport);

  try {
    // Contoh 1: Menggunakan proxy HTTP tanpa autentikasi
    console.log('=== Contoh 1: Proxy HTTP tanpa autentikasi ===');
    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org/ip',
      proxy: {
        server: 'http://proxy.example.com:8080'
      },
      headless: true
    });

    // Ambil screenshot untuk verifikasi
    await client.callTool('playwright_screenshot', {
      name: 'proxy-test-1'
    });

    // Contoh 2: Menggunakan proxy dengan autentikasi
    console.log('\n=== Contoh 2: Proxy dengan autentikasi ===');
    await client.callTool('playwright_close', {});

    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org/ip',
      proxy: {
        server: 'http://proxy.example.com:8080',
        username: 'myusername',
        password: 'mypassword'
      },
      headless: true
    });

    await client.callTool('playwright_screenshot', {
      name: 'proxy-test-2'
    });

    // Contoh 3: Menggunakan SOCKS proxy
    console.log('\n=== Contoh 3: SOCKS proxy ===');
    await client.callTool('playwright_close', {});

    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org/ip',
      proxy: {
        server: 'socks5://socks.example.com:1080'
      },
      headless: true
    });

    await client.callTool('playwright_screenshot', {
      name: 'proxy-test-3'
    });

    // Contoh 4: Menggunakan proxy dengan browser yang berbeda
    console.log('\n=== Contoh 4: Proxy dengan Firefox ===');
    await client.callTool('playwright_close', {});

    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org/ip',
      browserType: 'firefox',
      proxy: {
        server: 'http://proxy.example.com:8080'
      },
      headless: true
    });

    await client.callTool('playwright_screenshot', {
      name: 'proxy-test-firefox'
    });

    // Contoh 5: Menggunakan proxy dengan viewport custom
    console.log('\n=== Contoh 5: Proxy dengan viewport custom ===');
    await client.callTool('playwright_close', {});

    await client.callTool('playwright_navigate', {
      url: 'https://httpbin.org/ip',
      proxy: {
        server: 'http://proxy.example.com:8080'
      },
      width: 1920,
      height: 1080,
      headless: true
    });

    await client.callTool('playwright_screenshot', {
      name: 'proxy-test-custom-viewport'
    });

    console.log('\n=== Semua contoh selesai ===');
    console.log('Screenshot tersimpan untuk setiap contoh');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Tutup browser
    await client.callTool('playwright_close', {});
    await client.close();
  }
}

// Jalankan contoh
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main }; 