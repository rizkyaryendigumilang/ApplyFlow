# Loker Scraper & Direct Job Hub Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun modul pengumpul dan pengurai link lowongan cerdas (Loker Scraper) di dalam Auto Job Scout yang mendukung tempel tunggal dan massal (batch) dengan penyimpanan persisten serta aksi 1-klik buka, salin, dan simpan ke pipeline.

**Architecture:** Parser deterministik mengekstrak tautan dan metadata platform dari teks masukan (tunggal atau multilapis). Hook kustom mengelola persistensi di LocalStorage. Komponen antarmuka modular menyajikan panel input cerdas bertab ganda dan kartu aksi berdesain Cansaas/HorizonX.

**Tech Stack:** React 18, TypeScript 5.5, Tailwind CSS, Lucide Icons, Node Test Runner.

**Spec:** `docs/superpowers/specs/2026-11-23-loker-scraper-direct-jobs-design.md`

## Global Constraints

- Dilarang menggunakan karakter em-dash maupun en-dash di seluruh kode, komentar, dan antarmuka.
- Menggunakan bahasa Indonesia baku (KBBI) untuk teks antarmuka.
- Kode harus lolos pengujian `npm test`, `npm run typecheck`, dan `npm run audit:modern-web`.

## Review Focus

1. Penanganan teks tak terstruktur yang mengandung campuran URL dan kata-kata bebas pada mode tempel massal.
2. Pencegahan duplikasi tautan saat menempelkan link yang sama berulang kali.
3. Kepatuhan atribut keamanan `rel="noreferrer noopener"` dan `target="_blank"` pada tautan eksternal.
4. Umpan balik visual saat menyalin tautan ke papan klip (*clipboard*).
5. Sinkronisasi status penyimpanan ke Pipeline pelacak lamaran.

---

### Task 1: Batch URL Parsing Engine & Heuristics Enhancement

- [x] Tambahkan tipe data `ExtractedJobLink` dan fungsi `parseBatchJobUrls` di `frontend/src/lib/job-scout-engine.ts`.
- [x] Perluas pengenalan platform di `parseJobUrlHeuristics` untuk mendukung portal ATS populer (Greenhouse, Lever, Workday) dan portal regional (Kalibrr, Glints, Dealls).
- [x] Buat unit test di `frontend/src/lib/__tests__/job-scout-engine.test.ts` untuk memverifikasi ekstraksi teks tunggal, multi-line, sanitasi URL, dan deduplikasi.
- [x] Jalankan `npm test` untuk memastikan pengujian Task 1 lolos.

### Task 2: Persistent State Hook for Scraped Jobs

- [x] Buat hook `frontend/src/hooks/useScrapedJobs.ts` dengan kunci penyimpanan `applyflow_scraped_jobs_v1`.
- [x] Implementasikan fungsi `addSingleJob`, `addBatchJobs`, `removeJob`, `markAsSaved`, dan `clearAllJobs`.
- [x] Tulis unit test untuk `useScrapedJobs` yang menguji operasi penambahan, penghapusan, dan ketahanan data.
- [x] Jalankan `npm test` untuk memverifikasi logika persistensi.

### Task 3: Universal Ingestion & Direct Job Hub Component

- [x] Buat komponen `frontend/src/features/job-scout/DirectJobScraperPanel.tsx` dengan tab pemilih mode (Satu Link vs Banyak Link).
- [x] Tambahkan live counter jumlah URL valid yang terdeteksi saat pengguna mengetik di textarea mode massal.
- [x] Buat daftar kartu tautan (*Direct Job Cards*) dengan tombol 1-klik "Buka & Lamar", "Salin Link", "+ Simpan ke Pipeline", dan tombol hapus.
- [x] Tambahkan efek visual umpan balik saat tautan berhasil disalin ke papan klip.

### Task 4: Integration in AutoJobScoutView & Quality Verification

- [x] Integrasikan `DirectJobScraperPanel` ke dalam `frontend/src/features/job-scout/AutoJobScoutView.tsx`.
- [x] Hubungkan aksi simpan ke pipeline dengan `onAddApplication` dan notifikasi aplikasi.
- [x] Jalankan `npm run audit:modern-web` untuk memastikan 0 temuan standar modern web.
- [x] Jalankan `npm run typecheck` dan `npm test` untuk memastikan seluruh suite lulus tanpa galat.
- [x] Buat komit git untuk fitur yang telah selesai.
