# Konfigurasi SSL/TLS untuk mcp-playwright

## Gambaran Umum

mcp-playwright sekarang mendukung konfigurasi SSL/TLS untuk menangani sertifikat yang tidak valid, self-signed certificates, dan error HTTPS. Fitur ini sangat berguna untuk:

- Testing environment dengan self-signed certificates
- Development server dengan sertifikat yang tidak valid
- Aplikasi internal dengan certificate authority custom
- Debugging masalah SSL/TLS

## Opsi yang Tersedia

### 1. acceptInsecureCerts

Opsi ini memungkinkan browser untuk menerima sertifikat yang tidak valid atau self-signed.

**Level**: Browser Launch Option  
**Default**: `true`  
**Mendukung**: Chromium, Firefox, WebKit

### 2. ignoreHTTPSErrors

Opsi ini mengabaikan semua error HTTPS selama navigasi dan request.

**Level**: Browser Context Option  
**Default**: `true`  
**Mendukung**: Chromium, Firefox, WebKit

## Cara Menggunakan

### 1. Menerima Self-Signed Certificates

```javascript
await client.callTool('playwright_navigate', {
  url: 'https://self-signed.localhost:3000',
  acceptInsecureCerts: true,
  headless: true
});
```

### 2. Mengabaikan HTTPS Errors

```javascript
await client.callTool('playwright_navigate', {
  url: 'https://expired.example.com',
  ignoreHTTPSErrors: true,
  headless: true
});
```

### 3. Kombinasi Kedua Opsi

```javascript
await client.callTool('playwright_navigate', {
  url: 'https://localhost:8443',
  acceptInsecureCerts: true,
  ignoreHTTPSErrors: true,
  headless: true
});
```

### 4. Dengan Proxy Configuration

```javascript
await client.callTool('playwright_navigate', {
  url: 'https://internal.company.com',
  acceptInsecureCerts: true,
  ignoreHTTPSErrors: true,
  proxy: {
    server: 'http://proxy.company.com:8080',
    username: 'user',
    password: 'pass'
  },
  headless: true
});
```

## Contoh Skenario Penggunaan

### Skenario 1: Development Environment

```javascript
// Untuk aplikasi React/Vue yang berjalan di localhost dengan HTTPS
await client.callTool('playwright_navigate', {
  url: 'https://localhost:3000',
  acceptInsecureCerts: true,
  ignoreHTTPSErrors: true,
  browserType: 'chromium',
  headless: false
});
```

### Skenario 2: Internal Testing Server

```javascript
// Untuk server testing internal dengan certificate custom
await client.callTool('playwright_navigate', {
  url: 'https://test.internal.company.com',
  acceptInsecureCerts: true,
  browserType: 'firefox',
  headless: true
});
```

### Skenario 3: Expired Certificate Testing

```javascript
// Untuk testing bagaimana aplikasi menangani expired certificates
await client.callTool('playwright_navigate', {
  url: 'https://expired.badssl.com',
  ignoreHTTPSErrors: true,
  browserType: 'webkit',
  headless: true
});
```

### Skenario 4: Mixed Content Testing

```javascript
// Untuk testing mixed content (HTTPS dengan HTTP resources)
await client.callTool('playwright_navigate', {
  url: 'https://mixed-script.badssl.com',
  ignoreHTTPSErrors: true,
  headless: true
});
```

## Format JSON untuk Tools

### Tool Definition dengan SSL Options

```javascript
{
  "name": "playwright_navigate",
  "arguments": {
    "url": "https://self-signed.localhost",
    "acceptInsecureCerts": true,
    "ignoreHTTPSErrors": true,
    "browserType": "chromium",
    "headless": true,
    "width": 1920,
    "height": 1080
  }
}
```

## Kompatibilitas Browser

| Browser | acceptInsecureCerts | ignoreHTTPSErrors |
|---------|-------------------|------------------|
| Chromium | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| WebKit | ✅ | ✅ |

## Troubleshooting

### Masalah Umum

1. **SSL Error masih muncul**
   ```
   Error: net::ERR_CERT_AUTHORITY_INVALID
   ```
   **Solusi**: Pastikan menggunakan kedua opsi `acceptInsecureCerts: true` dan `ignoreHTTPSErrors: true`

2. **Mixed Content Error**
   ```
   Error: Mixed Content: The page was loaded over HTTPS
   ```
   **Solusi**: Gunakan `ignoreHTTPSErrors: true`

3. **Self-signed Certificate Error**
   ```
   Error: net::ERR_CERT_COMMON_NAME_INVALID
   ```
   **Solusi**: Gunakan `acceptInsecureCerts: true`

### Tips Debugging

1. **Test koneksi SSL manual**
   ```bash
   curl -k https://your-server.com
   openssl s_client -connect your-server.com:443
   ```

2. **Debug dengan browser non-headless**
   ```javascript
   await client.callTool('playwright_navigate', {
     url: 'https://problematic-site.com',
     acceptInsecureCerts: true,
     ignoreHTTPSErrors: true,
     headless: false  // Untuk melihat error di browser
   });
   ```

3. **Check console logs**
   ```javascript
   await client.callTool('playwright_console_logs', {
     type: 'error',
     limit: 20
   });
   ```

## Keamanan

### ⚠️ **Peringatan Keamanan**

- **JANGAN** gunakan opsi ini di production environment
- **HANYA** gunakan untuk development, testing, atau debugging
- Opsi ini menurunkan keamanan dengan menonaktifkan validasi SSL/TLS
- Selalu dokumentasikan penggunaan opsi ini dalam tim

### Best Practices

1. **Environment-specific Configuration**
   ```javascript
   const isProduction = process.env.NODE_ENV === 'production';
   
   await client.callTool('playwright_navigate', {
     url: targetUrl,
     acceptInsecureCerts: !isProduction,
     ignoreHTTPSErrors: !isProduction,
     headless: true
   });
   ```

2. **Conditional SSL Settings**
   ```javascript
   // Hanya gunakan SSL bypass untuk domain tertentu
   const isDevelopmentDomain = url.includes('localhost') || url.includes('.local');
   
   await client.callTool('playwright_navigate', {
     url: url,
     acceptInsecureCerts: isDevelopmentDomain,
     ignoreHTTPSErrors: isDevelopmentDomain,
     headless: true
   });
   ```

## Testing SSL Configuration

Jalankan test untuk memastikan SSL configuration berfungsi:

```bash
# Test SSL configuration
npm test ssl.test.ts

# Test semua functionality
npm test

# Test dengan coverage
npm run test:coverage
```

## Contoh Complete Setup

```javascript
// Complete example untuk development environment
const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');

async function testSSLSites() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['dist/index.js'],
  });

  const client = new Client({
    name: 'ssl-test',
    version: '1.0.0',
  }, {
    capabilities: {}
  });

  await client.connect(transport);

  try {
    // Test 1: Self-signed certificate
    await client.callTool('playwright_navigate', {
      url: 'https://self-signed.badssl.com',
      acceptInsecureCerts: true,
      headless: true
    });
    
    await client.callTool('playwright_screenshot', {
      name: 'self-signed-test'
    });

    // Test 2: Expired certificate
    await client.callTool('playwright_close', {});
    
    await client.callTool('playwright_navigate', {
      url: 'https://expired.badssl.com',
      ignoreHTTPSErrors: true,
      headless: true
    });
    
    await client.callTool('playwright_screenshot', {
      name: 'expired-cert-test'
    });

    // Test 3: Local development server
    await client.callTool('playwright_close', {});
    
    await client.callTool('playwright_navigate', {
      url: 'https://localhost:3000',
      acceptInsecureCerts: true,
      ignoreHTTPSErrors: true,
      headless: true
    });

    console.log('✅ Semua SSL tests berhasil');

  } catch (error) {
    console.error('❌ SSL test error:', error);
  } finally {
    await client.callTool('playwright_close', {});
    await client.close();
  }
}

module.exports = { testSSLSites };
```

## Dukungan

Jika mengalami masalah dengan SSL/TLS configuration:

1. Periksa dokumentasi troubleshooting di atas
2. Jalankan test dengan `npm test ssl.test.ts`
3. Periksa console logs untuk error detail
4. Buat issue di GitHub repository dengan:
   - URL yang bermasalah
   - Browser type yang digunakan
   - Error message lengkap
   - Konfigurasi SSL yang digunakan 