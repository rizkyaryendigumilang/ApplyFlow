# Plan 006: Optimalisasi Ukuran Berkas Bundel & Skrip Typecheck

- **ID:** 006
- **Fase:** Fase 3 (Optimalisasi Performa & Pengalaman Pengembang)
- **Status:** Selesai
- **Area:** Kinerja Bundel Web / Vite / Skrip Pengembang

## Konteks & Masalah

1. Seluruh modul dan tampilan sekunder pada `frontend/src/App.tsx` diimpor secara statis (*eager loading*). Akibatnya, berkas JavaScript utama (`index-*.js`) membengkak hingga mencapai 661.61 kB saat proses kompilasi produksi, memicu peringatan Vite bahwa ukuran bundel melebihi batas 600 kB.
2. Pengembang tidak memiliki skrip akar langsung untuk memeriksa validitas tipe TypeScript di seluruh proyek frontend (`npm run typecheck`).

## Solusi & Perubahan

1. **Penerapan Route-Based Code-Splitting dengan React.lazy() & Suspense:**
   - Mengubah impor 13 modul sekunder (`ApplyFlowView`, `JobHunterView`, `AutoJobScoutView`, `RecruitmentInboxView`, `NetworkingView`, `LinkedInAssistantView`, `SettingsView`, `OfferComparatorView`, `AiAgentStudioView`, `UserManagementView`, `AnalyticsView`, `HelpSupportView`, `SystemPagesView`) dan modal interaktif menjadi pemanggilan dinamis `lazy(() => import(...))`.
   - Menambahkan komponen `ViewLoadingFallback` dengan animasi pemuatan minimalis bergaya netral.
   - Membungkus router tampilan utama dan dialog modal dalam blok `<Suspense fallback={...}>`.
2. **Penambahan Skrip Typecheck:**
   - Menambahkan skrip `"typecheck": "npm --prefix frontend exec tsc -- -p frontend/tsconfig.json --noEmit"` pada berkas `package.json` akar.

## Verifikasi & Hasil

1. **Hasil Pengecekan Tipe (`npm run typecheck`):**
   - Lulus 100% tanpa galat tipe.
2. **Hasil Kompilasi Produksi (`npm run frontend:build`):**
   - Ukuran bundel utama menyusut drastis dari **661.61 kB** menjadi **336.49 kB** (penurunan sebesar 49.2%, ukuran terkompresi gzip hanya 89.97 kB).
   - Peringatan batas 600 kB Vite hilang sepenuhnya.
   - Setiap modul sekunder kini terpecah menjadi *chunk* terisolasi berukuran kecil (5 kB hingga 51 kB) yang hanya diunduh saat modul dibuka oleh pengguna.
