# Plan 001: Resolusi Kerentanan Kritis node-tar pada @capacitor/cli

- **ID:** 001
- **Fase:** Fase 1 (Keamanan & Landasan Pengujian)
- **Status:** Selesai
- **Area:** Keamanan Ketergantungan / npm overrides

## Konteks & Masalah

Pada berkas `package.json` akar, pustaka `@capacitor/cli` menarik dependensi transitif `tar` dengan versi di bawah 7.5.21. Versi tersebut rentan terhadap beberapa eksploitasi keamanan kritis dan tinggi:
1. `GHSA-83g3-92jg-28cx`: Pembacaan dan penulisan berkas arbitrer melalui pelarian target hardlink (*symlink chain*).
2. `GHSA-23hp-3jrh-7fpw`: Serangan Denial of Service (DoS) dekompresi melalui masukan arsip tanpa batas.
3. Kerentanan penulisan berkas arbitrer lainnya pada `tar <= 7.5.20`.

Sebelumnya konfigurasi `overrides` hanya menargetkan `tar: ">=7.5.3"`, sehingga pemeriksaan `npm audit` melaporkan 1 kerentanan kritis dan 1 kerentanan tinggi.

## Solusi & Perubahan

1. Memperbarui blok `overrides` pada berkas `package.json`:
   ```json
   "overrides": {
     "tar": ">=7.5.21"
   }
   ```
2. Menjalankan sinkronisasi ketergantungan `npm install` untuk memperbarui pohon dependensi pada `package-lock.json`.

## Verifikasi & Hasil

- Perintah `npm audit` memverifikasi bahwa kerentanan kritis dan tinggi pada paket `tar` telah tereliminasi sepenuhnya (0 kerentanan kritis, 0 kerentanan tinggi).
