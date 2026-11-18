# Plan 002: Rangkaian Pengujian Unit Komprehensif applyflow.ts

- **ID:** 002
- **Fase:** Fase 1 (Keamanan & Landasan Pengujian)
- **Status:** Selesai
- **Area:** Pengujian Unit Otomatis / Node.js Test Runner

## Konteks & Masalah

Modul `frontend/src/lib/applyflow.ts` merupakan inti dari fitur studio lamaran kerja ApplyFlow, yang bertanggung jawab membedah teks iklan lowongan kerja, mencocokkan kualifikasi dengan bukti profil, menyusun subjek dan surel lamaran, serta memvalidasi kelayakan draf. Meskipun fungsinya sangat kritikal, modul ini sebelumnya belum memiliki berkas pengujian unit sama sekali.

## Solusi & Perubahan

1. Membuat berkas pengujian baru pada `frontend/src/lib/__tests__/applyflow.test.ts`.
2. Menguji seluruh fungsi inti mesin:
   - `parseJobPosting`: Memastikan ekstraksi nama perusahaan, lokasi, mode kerja (Remote, Hybrid, On-site, Unknown), nama perekrut, email perekrut, instruksi subjek surel, daftar lampiran wajib, serta posisi dan keahlian yang terdeteksi.
   - `matchAgainstEvidence`: Memastikan kategorisasi status kualifikasi berjalan akurat menjadi `Supported`, `Partial`, atau `Not documented`.
   - `buildSubject`: Menguji penggantian variabel instruksi subjek khusus serta pembentukan subjek default berbahasa Indonesia dan Inggris.
   - `buildEmail`: Menguji penyusunan isi draf surel pengantar bilingual (Bahasa Indonesia dan Bahasa Inggris) dengan verifikasi ketat tanpa tanda baca em-dash dan en-dash.
   - `validateDraft`: Menguji pendeteksian kekosongan judul posisi, subjek, isi surel, penanda tempat yang belum diganti, serta format alamat email perekrut yang tidak valid.
3. Memperbaiki logika deteksi mode kerja `detectMode` pada `applyflow.ts` agar memeriksa kata kunci `Hybrid` sebelum `Remote/WFH` atau `On-site/WFO`, mencegah iklan berstatus hybrid salah terdeteksi sebagai remote.
4. Memperluas pembersihan awalan posisi agar mengenali istilah dalam Bahasa Indonesia seperti `Posisi:`, `Jabatan:`, dan `Lowongan:`.

## Verifikasi & Hasil

- Menjalankan `npm test`: seluruh 58 pengujian unit lulus 100% tanpa kegagalan.
