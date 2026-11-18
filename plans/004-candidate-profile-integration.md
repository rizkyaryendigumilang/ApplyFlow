# Plan 004: Integrasi Profil Kandidat & Deteksi Otomatis URL

- **ID:** 004
- **Fase:** Fase 2 (Perbaikan Fungsional & Sinergi ApplyFlow)
- **Status:** Selesai
- **Area:** Sinergi Data / Integrasi Modul

## Konteks & Masalah

Sebelumnya, modul `ApplyFlowView` berjalan terisolasi dari data master `CandidateProfile`. Pengguna harus mengetik ulang nama lengkap dan daftar bukti pengalaman terverifikasi secara manual setiap kali menyusun draf lamaran baru. Selain itu, pemilihan platform asal lowongan (LinkedIn, Jobstreet, Glints) pada Langkah 1 dilakukan secara manual meskipun pengguna sudah menempelkan tautan URL yang valid.

## Solusi & Perubahan

1. **Sinkronisasi Otomatis Profil Kandidat:**
   - Menghubungkan *hook* `useCandidateProfile` ke dalam `ApplyFlowView`.
   - Mengisi nama pelamar secara otomatis dari `profile.fullName` saat komponen dimuat.
   - Menambahkan tombol aksi 1-klik pada Langkah 3 (Bukti Kualifikasi): `Terapkan Data Profil Saya`. Tombol ini otomatis merangkum `experienceSummary`, daftar `skills`, dan `certifications` ke dalam kotak bukti kualifikasi.
2. **Pendeteksian Platform Asal Berbasis Heuristik URL:**
   - Mengintegrasikan fungsi `parseJobUrlHeuristics` pada perubahan masukan tautan URL di Langkah 1.
   - Ketika pengguna menempelkan tautan dari domain Jobstreet, LinkedIn, atau Glints, menu pilihan platform otomatis terpilih secara akurat tanpa perlu tindakan tambahan.

## Verifikasi & Hasil

- Pengujian unit dan kompilasi tipe data lulus 100%. Data kandidat terisi mulus dan mempercepat alur penyusunan draf.
