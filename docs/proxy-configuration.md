# Konfigurasi Proxy untuk mcp-playwright

## Gambaran Umum

mcp-playwright mendukung konfigurasi proxy untuk semua jenis browser (Chromium, Firefox, dan WebKit). Fitur ini memungkinkan Anda untuk:

- Mengakses website melalui proxy server
- Menggunakan autentikasi proxy
- Mengatasi pembatasan jaringan
- Menggunakan berbagai protokol proxy (HTTP, HTTPS, SOCKS)

## Cara Menggunakan

### 1. Konfigurasi Proxy Dasar

```javascript
await client.callTool('playwright_navigate', {
  url: 'https://example.com',
  proxy: {
    server: 'http://proxy.server.com:8080'
  }
});
```

### 2. Proxy dengan Autentikasi

```javascript
await client.callTool('playwright_navigate', {
  url: 'https://example.com',
  proxy: {
    server: 'http://proxy.server.com:8080',
    username: 'your-username',
    password: 'your-password'
  }
});
```

### 3. SOCKS Proxy

```javascript
await client.callTool('playwright_navigate', {
  url: 'https://example.com',
  proxy: {
    server: 'socks5://socks.server.com:1080'
  }
});
```

## Format Server Proxy

### HTTP/HTTPS Proxy
```
http://proxy.server.com:8080
https://secure.proxy.com:8080
```

### SOCKS Proxy
```
socks5://socks.server.com:1080
socks4://socks.server.com:1080
```

## Parameter Proxy

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `server` | string | Ya | URL server proxy |
| `username` | string | Tidak | Username untuk autentikasi |
| `password` | string | Tidak | Password untuk autentikasi |

## Contoh Penggunaan

### Contoh 1: Proxy HTTP Sederhana
```javascript
{
  "name": "playwright_navigate",
  "arguments": {
    "url": "https://httpbin.org/ip",
    "proxy": {
      "server": "http://proxy.example.com:8080"
    }
  }
}
```

### Contoh 2: Proxy dengan Autentikasi
```javascript
{
  "name": "playwright_navigate",
  "arguments": {
    "url": "https://httpbin.org/ip",
    "proxy": {
      "server": "http://proxy.example.com:8080",
      "username": "myuser",
      "password": "mypassword"
    }
  }
}
```

### Contoh 3: SOCKS5 Proxy
```javascript
{
  "name": "playwright_navigate",
  "arguments": {
    "url": "https://httpbin.org/ip",
    "proxy": {
      "server": "socks5://socks.example.com:1080"
    }
  }
}
```

## Kompatibilitas Browser

| Browser | HTTP/HTTPS | SOCKS4 | SOCKS5 |
|---------|------------|--------|--------|
| Chromium | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ |
| WebKit | ✅ | ✅ | ✅ |

## Troubleshooting

### Kesalahan Umum

1. **Proxy server tidak dapat diakses**
   ```
   Error: Failed to initialize browser: net::ERR_PROXY_CONNECTION_FAILED
   ```
   - Pastikan server proxy aktif dan dapat diakses
   - Periksa firewall dan pengaturan jaringan

2. **Autentikasi proxy gagal**
   ```
   Error: net::ERR_PROXY_AUTH_REQUESTED
   ```
   - Verifikasi username dan password
   - Pastikan proxy server mengizinkan autentikasi

3. **Format proxy tidak valid**
   ```
   Error: Invalid proxy configuration
   ```
   - Periksa format URL proxy
   - Pastikan menggunakan protokol yang didukung (http/https/socks4/socks5)

### Tips Debugging

1. **Verifikasi koneksi proxy**
   ```bash
   curl -x http://proxy.server.com:8080 https://httpbin.org/ip
   ```

2. **Test dengan browser headless**
   ```javascript
   await client.callTool('playwright_navigate', {
     url: 'https://httpbin.org/ip',
     proxy: { server: 'http://proxy.server.com:8080' },
     headless: false  // Untuk debugging visual
   });
   ```

3. **Lihat logs console**
   ```javascript
   await client.callTool('playwright_console_logs', {});
   ```

## Catatan Penting

- Konfigurasi proxy hanya berlaku untuk browser yang diluncurkan dengan tool `playwright_navigate`
- Setelah browser diluncurkan dengan proxy, semua tool lainnya akan menggunakan proxy yang sama
- Untuk mengubah proxy, tutup browser dengan `playwright_close` terlebih dahulu
- Proxy settings tidak mempengaruhi API tools (requests HTTP langsung)

## Contoh Lengkap

Lihat file `examples/proxy-example.js` untuk contoh implementasi lengkap yang menunjukkan berbagai skenario penggunaan proxy.

## Keamanan

- Hindari menyimpan kredensial proxy dalam kode
- Gunakan environment variables untuk informasi sensitif
- Pertimbangkan menggunakan proxy dengan enkripsi (HTTPS/SOCKS5)
- Audit log proxy untuk memantau aktivitas

## Dukungan

Jika Anda mengalami masalah dengan konfigurasi proxy, silakan:
1. Periksa dokumentasi troubleshooting di atas
2. Jalankan test dengan `npm test proxy.test.ts`
3. Buat issue di GitHub repository dengan detail konfigurasi proxy (tanpa kredensial) 