# Desain Spesifikasi: Loker Scraper & Direct Job Hub

## 1. Ringkasan Fitur

Fitur **Loker Scraper & Direct Job Hub** adalah modul pengumpul tautan lowongan kerja yang diintegrasikan ke dalam **Auto Job Scout**. Fitur ini memungkinkan pengguna untuk menempelkan tautan lowongan kerja baik secara tunggal (1 link cepat) maupun massal (banyak link sekaligus dalam bentuk teks/daftar tautan) dari berbagai sumber (LinkedIn, Jobstreet, Glints, Kalibrr, Dealls, maupun situs karier resmi perusahaan seperti Greenhouse, Lever, dan Workday).

Semua tautan yang ditempel akan diurai (*parsed*), disimpan secara persisten di penyimpanan peramban (*LocalStorage*), dan disajikan dalam bentuk kartu lowongan siap aksi dengan fungsi:
1. **Buka & Lamar (1-Klik):** Membuka halaman resmi lowongan langsung di tab baru.
2. **Salin Link:** Menyalin tautan bersih ke papan klip (*clipboard*) dengan umpan balik visual instan.
3. **+ Simpan ke Pipeline:** Memasukkan lowongan ke pelacak status lamaran (*Wishlist Pipeline*) dalam sekali klik.
4. **Hapus:** Membersihkan tautan dari daftar jika sudah tidak diperlukan.

---

## 2. Arsitektur Komponen & Alur Data

### A. Parser Heuristik Tautan (`job-scout-engine.ts`)
- Fungsi `parseBatchJobUrls(rawText: string): ExtractedJobLink[]`:
  - Mengekstrak semua URL berbasis pola protokol `https?://[^\s]+`.
  - Melakukan sanitasi tautan (menghapus tanda baca di ujung URL, spasi berlebih, dan parameter pelacakan iklan jika memungkinkan).
  - Mengabaikan URL duplikat dalam satu kali proses input.
  - Menghubungkan setiap URL dengan fungsi heuristik `parseJobUrlHeuristics` untuk mendeteksi platform asal (LinkedIn, Jobstreet, Glints, Kalibrr, Dealls, Indeed, Greenhouse, Lever, atau Situs Karier Mandiri) serta perkiraan perusahaan dan posisi.

### B. Hook Penyimpanan Persisten (`useScrapedJobs.ts`)
- Mengelola status persisten di `localStorage` dengan kunci `applyflow_scraped_jobs_v1`.
- Menyediakan struktur data:
  ```ts
  export interface ScrapedJobItem {
    id: string;
    url: string;
    title: string;
    company: string;
    platform: string;
    domain: string;
    createdAt: string;
    savedToPipeline?: boolean;
  }
  ```
- Menyediakan metode:
  - `addSingleJob(url: string, title?: string, company?: string)`
  - `addBatchJobs(rawText: string)`
  - `removeJob(id: string)`
  - `markAsSaved(id: string)`
  - `clearAllJobs()`

### C. Komponen Antarmuka (`DirectJobScraperPanel.tsx`)
- Tab pemilih mode input:
  - Mode A: **Tempel Cepat (1 Link)**: Input teks ringkas satu baris dengan tombol pemicu *Enter* atau klik "Ekstrak & Tambah".
  - Mode B: **Tempel Massal (Batch Links)**: Area teks multilapis (*textarea*) dengan tombol "Proses Semua Tautan" yang menampilkan hitungan tautan valid yang terdeteksi secara langsung (*live counter*).
- Panel daftar kartu tautan (*Link Hub Grid*):
  - Badge platform dan ikon identifikasi.
  - Judul posisi dan nama perusahaan.
  - Domain asal tautan.
  - Tombol aksi: Buka & Lamar (1-klik), Salin Link (dengan indikator status berhasil disalin), Simpan ke Pipeline, dan Hapus.

---

## 3. Batasan Teknis & Kepatuhan Proyek

- **Bebas Tanda Pisang (Zero Em-Dash / En-Dash):** Seluruh kode, komentar, teks antarmuka, dan dokumentasi dilarang menggunakan karakter em-dash maupun en-dash.
- **Kepatuhan KBBI:** Semua istilah bahasa Indonesia pada antarmuka mengikuti pedoman baku.
- **Dukungan Offline & Persistensi:** Semua link yang disimpan tidak hilang saat halaman disegarkan (*browser refresh*).
