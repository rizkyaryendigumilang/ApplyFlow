# Plan 003: Pemulihan Mode Kerja In-situ & Dukungan Portal Web

- **ID:** 003
- **Fase:** Fase 2 (Perbaikan Fungsional & Sinergi ApplyFlow)
- **Status:** Selesai
- **Area:** Pengalaman Pengguna (UX) / Validasi Alur

## Konteks & Masalah

1. Jika pengguna menempelkan iklan lowongan yang tidak mencantumkan mode kerja spesifik, nilai `job.mode` berstatus `'Unknown'`. Ketika pengguna tiba di Langkah 5 (Tinjau & Siapkan) dan mengeklik tombol simpan posisi, fungsi `saveApplication` melemparkan galat (*exception*) yang memaksa pengguna mundur ke Langkah 2 untuk menentukan mode kerja.
2. Banyak lowongan kerja modern pada LinkedIn, Glints, atau portal karier perusahaan tidak menyediakan alamat surel perekrut langsung, melainkan mengharuskan pelamar mengisi formulir pada tautan web. Pada Langkah 5, tombol pembuka klien email dinonaktifkan tanpa adanya jalan keluar untuk membuka portal eksternal sekaligus mencatat lamaran ke pipeline.

## Solusi & Perubahan

1. **Pemulihan Mode Kerja Langsung di Langkah 5:**
   - Menambahkan banner peringatan interaktif pada Langkah 5 jika `job.mode === 'Unknown'`.
   - Menyediakan tombol pemilih cepat langsung: `[Remote]`, `[Hybrid]`, `[On-site]`. Mengeklik salah satu opsi langsung memperbarui `job.mode` tanpa perlu berpindah langkah.
2. **Dukungan Pelamaran Portal Web Resmi:**
   - Menambahkan tombol aksi `Buka Portal Web & Catat` jika `job.recruiterEmail` tidak tersedia namun `job.sourceUrl` terisi.
   - Fungsi `openWebPortal` membuka tautan lowongan kerja di tab baru peramban dengan atribut keamanan (`noopener,noreferrer`), lalu otomatis mencatat posisi ke database pipeline pengguna dengan status `Applied` (atau `Wishlist` jika belum dikonfirmasi).

## Verifikasi & Hasil

- Pemeriksaan kompilasi TypeScript `npm run typecheck` sukses tanpa galat.
- Alur pelamaran terverifikasi menangani lowongan berbasis surel maupun tautan portal web eksternal secara mulus.
