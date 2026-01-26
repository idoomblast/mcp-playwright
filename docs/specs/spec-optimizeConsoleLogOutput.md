# 🤖 TECHNICAL BLUEPRINT: Optimasi Output Console Log

## 1. 🌍 Konteks & Tumpukan Teknologi
- **Framework**: Node.js dengan TypeScript & Express
- **Sumber Dokumentasi**: [Zod Docs](https://zod.dev/)
- **Panduan Gaya**: Mengikuti pola yang sudah ada di `src/tools/browser/base.ts` dan `src/tools.ts`.
- **Batasan Utama**: Perubahan harus tetap kompatibel dengan struktur `BrowserToolBase` yang ada.

## 2. 🧱 Operasi File (Berurutan)

### Langkah 1: Perbarui Skema Definisi Tool
*   **File Target**: `src/tools.ts`
*   **Aksi**: UPDATE
*   **Spesifikasi Teknis**:
    - Cari objek definisi untuk `playwright_console_logs`.
    - Di dalam `inputSchema`, tambahkan properti-properti berikut:
        1.  `maxLength: z.number().describe("Maximum length for each log message before truncation").optional()`
        2.  `group: z.boolean().describe("Group identical log messages and show a count (default: false)").optional().default(false)`
    - Modifikasi properti `limit` yang sudah ada untuk menyertakan nilai default:
        - Ubah `limit: z.number().describe("Maximum number of logs to return").optional()`
        - Menjadi `limit: z.number().describe("Maximum number of logs to return (default: 50)").optional().default(50)`

### Langkah 2: Terapkan Logika Pemrosesan Log
*   **File Target**: `src/tools/browser/console.ts`
*   **Aksi**: UPDATE
*   **Impor yang Dibutuhkan**: Tidak ada impor baru yang diperlukan.
*   **Logika/Pseudocode untuk metode `execute`**:
    1.  Ambil salinan log yang ada: `let logs = [...this.consoleLogs];`
    2.  Terapkan filter `type` dan `search` yang sudah ada.
    3.  **TERAPKAN LOGIKA PENGELOMPOKAN (JIKA `args.group` TRUE):**
        - Buat sebuah `Map` untuk melacak hitungan setiap pesan log unik.
        - Iterasi melalui `logs` yang sudah difilter dan isi `Map`-nya.
        - Ubah `Map` tersebut kembali menjadi array `logs` yang baru, dengan format: `"[TYPE] Pesan log (xN)"` jika hitungannya lebih dari 1.
    4.  **TERAPKAN LOGIKA LIMIT (SETELAH PENGELOMPOKAN):**
        - Terapkan `slice` untuk mengambil log terakhir berdasarkan `args.limit` (yang sekarang memiliki default 50).
        - `logs = logs.slice(-args.limit);`
    5.  **TERAPKAN LOGIKA PEMOTONGAN (SETELAH LIMIT):**
        - Gunakan `map` pada array `logs`.
        - Jika `args.maxLength` ada dan panjang sebuah log melebihi batas, potong log tersebut dan tambahkan `...` di akhir.
        - Pastikan logika ini bekerja dengan benar untuk log yang dikelompokkan (misalnya, hanya potong bagian pesannya, bukan bagian `(xN)`).
    6.  Terapkan logika `clear` yang sudah ada.
    7.  Kembalikan `createSuccessResponse` dengan log yang sudah diproses.

## 3. 🛡️ Verifikasi & Keamanan
- **Validasi**: Zod akan menangani validasi tipe input. Logika di dalam `execute` harus menangani kasus di mana `maxLength` dan `group` tidak didefinisikan (opsional).
- **Penanganan Kesalahan**: Tidak ada perubahan signifikan yang diperlukan; struktur yang ada sudah cukup.
- **Keamanan**: Perubahan ini tidak memiliki implikasi keamanan langsung.
