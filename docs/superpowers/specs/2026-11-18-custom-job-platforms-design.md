# Desain Teknis: Multi-Platform Action Grid & Kustom Platform Mandiri (Auto Job Scout)

## 1. Maksud & Tujuan (Intent & Why)
Pengguna ingin mencari dan melamar pekerjaan di berbagai portal karier (Jobstreet, LinkedIn, Glints, Indeed, Kalibrr, Dealls, dan situs karier kustom) secara efisien dari satu layar aplikasi tanpa harus berganti-ganti filter manual, serta memiliki fleksibilitas untuk menambahkan portal karier kustom mereka sendiri.

## 2. Sasaran & Batasan
- **Goals:**
  - Menghadirkan **Multi-Platform Action Grid** pada layar Auto Job Scout sehingga semua platform terpampang rapi di satu layar.
  - Memperluas platform bawaan siap pakai: Jobstreet, LinkedIn, Glints, Indeed, Kalibrr, dan Dealls.
  - Menyediakan fitur **+ Tambah Platform Kustom** (Nama Platform + Format URL dengan placeholder `{query}` dan `{location}`).
  - Menyediakan tombol peluncur instan per platform dan opsi **Buka Semua Platform Sekaligus**.
  - Menyimpan preferensi platform kustom secara persisten di `localStorage`.
- **Non-Goals:**
  - Memuat website eksternal ke dalam `<iframe>` di dalam aplikasi, karena kebijakan keamanan peramban (`X-Frame-Options: DENY` dan CSP) pada Indeed, LinkedIn, dan Jobstreet akan memblokir tampilan tersebut.
- **Anti-Goals:**
  - Mengharuskan pengguna menulis skrip pengurai (*parser*) rumit untuk menambah platform baru.

## 3. Pendekatan Desain (Approaches)
- **Pendekatan A (Terpilih): Multi-Platform Action Grid & Preset Kustom Mandiri**
  - Mengubah pemilih platform menjadi kisi kartu aksi interaktif di satu layar. Pengguna bisa langsung mengeklik platform yang diinginkan untuk meluncurkan pencarian terarah.
- **Pendekatan B (Ditolak): Dropdown Dinamis + Modal**
  - Tetap menggunakan dropdown tunggal. Ditolak karena pengguna tetap harus memilih dan berpindah platform satu per satu.

## 4. Rincian Teknis & Arsitektur
1. **Model Data Platform Preset (`JobPlatformPreset`):**
   - `id`: string identifikasi unik.
   - `name`: nama label platform (misal: "Indeed Indonesia", "Kalibrr", "Karier BCA").
   - `urlTemplate`: template URL pencarian (contoh: `https://id.indeed.com/jobs?q={query}&l={location}`).
   - `isCustom`: boolean penanda apakah platform ditambahkan manual oleh pengguna.
2. **Mesin Pembangun URL:**
   - Menggantikan token `{query}` dengan kata kunci kustom / peran aktif.
   - Menggantikan token `{location}` dengan domisili pilihan pengguna.
   - Jika pengguna memasukkan URL langsung tanpa token, sistem otomatis menyematkan parameter pencarian standar atau membuka URL tersebut.
3. **Penyimpanan:**
   - Disimpan di `localStorage` dengan kunci `applyflow_custom_job_platforms`.
4. **Antarmuka Pengguna (UI Sketch):**
   ```text
   +--------------------------------------------------------------------------+
   | Radar Peluncur Multi-Platform (6 Platform Aktif)        [+ Tambah Platform]|
   | [Jobstreet]   [LinkedIn]   [Glints]   [Indeed]   [Kalibrr]   [Dealls]    |
   | [Buka Live]   [Buka Live]  [Buka Live][Buka Live][Buka Live] [Buka Live] |
   +--------------------------------------------------------------------------+
   | Opsi Cepat: [Buka Semua Platform Terpilih Sekaligus (Multi-Tab)]         |
   +--------------------------------------------------------------------------+
   ```

## 5. Kepatuhan Penulisan
- Nol penggunaan em-dash (`—`) dan nol penggunaan en-dash (`–`).
- Penggunaan istilah baku KBBI (*analisis*, *respons*, *kustom*, *peluncur*).
