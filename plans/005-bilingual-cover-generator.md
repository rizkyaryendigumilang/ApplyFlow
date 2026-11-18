# Plan 005: Generator Surel Pengantar Bilingual (ID & EN)

- **ID:** 005
- **Fase:** Fase 2 (Perbaikan Fungsional & Sinergi ApplyFlow)
- **Status:** Selesai
- **Area:** Fungsionalitas / Bahasa Alami

## Konteks & Masalah

Sebelumnya generator surel pengantar pada ApplyFlow hanya menyediakan templat berbahasa Inggris. Untuk pasar tenaga kerja Indonesia, melamar ke Badan Usaha Milik Negara (BUMN), korporasi nasional, atau instansi lokal membutuhkan surat pengantar dalam Bahasa Indonesia yang formal, santun, dan sesuai kaidah baku KBBI tanpa gaya bahasa kaku hasil terjemahan mesin.

## Solusi & Perubahan

1. **Templat Bahasa Indonesia Baku & Humanis pada applyflow.ts:**
   - Memperluas fungsi `buildSubject` dan `buildEmail` dengan parameter bahasa `lang: 'id' | 'en'`.
   - Mengembangkan templat Bahasa Indonesia yang memenuhi kaidah `humanizer-indonesia` dan `technical-writer`:
     - Salam pembuka terpersonalisasi (*Yth. [Nama Perekrut]* atau *Yth. Tim Rekrutmen [Nama Perusahaan]*).
     - Kalimat pembuka aktif yang sopan dan percaya diri.
     - Penjabaran bukti kualifikasi terstruktur dalam poin-poin singkat.
     - Penyebutan berkas lampiran CV dan portofolio kerja.
     - Penutup dan salam hormat formal.
     - Verifikasi ketat: tidak mengandung tanda baca em-dash atau en-dash.
2. **Pemilih Bahasa Draf pada Tampilan Antarmuka:**
   - Menambahkan kendali pemilih bahasa `[Bahasa Indonesia | English]` pada bilah navigasi Langkah 4 (Draf Email).
   - Pengguna dapat beralih bahasa draf dengan 1-klik untuk memperbarui subjek dan isi surel secara instan.

## Verifikasi & Hasil

- Pengujian unit pada `frontend/src/lib/__tests__/applyflow.test.ts` memverifikasi struktur surel Bahasa Indonesia dan Bahasa Inggris, termasuk validasi ketidakhadiran karakter em-dash dan en-dash.
