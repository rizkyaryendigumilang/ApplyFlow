# Language Consistency & Bilingual Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyamakan dan menstandardisasi seluruh bahasa di aplikasi ApplyFlow (Bahasa Indonesia baku sesuai KBBI sebagai bahasa utama dan English yang konsisten saat sakelar bahasa diaktifkan), memperbaiki inkonsistensi kata, serta memperluas kamus i18n.

**Architecture:** Kamus sentral i18n (`frontend/src/lib/i18n.ts`) diperluas untuk mencakup seluruh komponen navigasi, topbar, modal peluang baru, dan bento analitik. Komponen antarmuka yang sebelumnya menggunakan teks bahasa Inggris campuran dialihkan ke hook `useI18n()` agar konsisten 100% pada mode ID maupun EN. Semua kata non-baku (seperti "respon" dan "otentikasi") diperbaiki ke standar KBBI ("respons" dan "autentikasi").

**Tech Stack:** React 18, TypeScript 5.5, Tailwind CSS, Lucide Icons, Node Test Runner.

**Spec:** Pedoman Bahasa Indonesia Baku (KBBI) dan Arsitektur Dwibahasa ApplyFlow.

## Global Constraints

- Dilarang keras menggunakan karakter em-dash maupun en-dash di seluruh kode, komentar, dan antarmuka.
- Menggunakan bahasa Indonesia baku (KBBI) untuk teks antarmuka Bahasa Indonesia.
- Seluruh pengujian `npm test`, `npm run typecheck`, dan `npm run audit:modern-web` harus lulus tanpa galat.

## Review Focus

1. Menghilangkan kata tidak baku ("respon" -> "respons", "otentikasi" -> "autentikasi").
2. Memastikan tidak ada teks campuran yang tertinggal saat pengguna memilih mode Bahasa Indonesia (ID) maupun English (EN).
3. Penanganan tombol dan label penting seperti "Peluang Baru / Create New Work", "Papan / Board", "Tabel / Table".
4. Verifikasi kamus terjemahan bebas tanda pisang em-dash / en-dash.

---

### Task 1: KBBI Standardization across Existing Files

- [x] Perbaiki kata "otentikasi" menjadi "autentikasi" di `frontend/src/components/AuthScreen.tsx`.
- [x] Perbaiki kata "respon" menjadi "respons" di `AnalyticsView.tsx`, `FollowUpModal.tsx`, `CansaasAnalyticsBento.tsx`, `HelpSupportView.tsx`, dan `SettingsView.tsx`.
- [x] Perbaiki tes yang merujuk pada kata "respon" jika ada di unit test suite.
- [x] Jalankan `npm test` untuk memverifikasi.

### Task 2: Expand i18n Central Dictionary

- [x] Tambahkan kunci terjemahan untuk kelompok sidebar (`sidebar.workspace`, `sidebar.tools`, `sidebar.admin`, `sidebar.createNewWork`, `sidebar.searchShortcut`).
- [x] Tambahkan kunci terjemahan untuk topbar (`topbar.viewBoard`, `topbar.viewTable`, `topbar.newOpportunity`, `topbar.shortcutsTitle`).
- [x] Tambahkan kunci terjemahan untuk modal peluang baru `AddOpportunityModal` (judul, placeholder, label prioritas, tombol simpan/batal).
- [x] Tambahkan kunci terjemahan untuk Bento Analitik Cansaas (sebaran prioritas, status kerja, aktivitas terkini, fokus selanjutnya).
- [x] Perbarui pengujian `frontend/src/lib/__tests__/i18n.test.ts`.
- [x] Jalankan `npm test` untuk memverifikasi kamus baru.

### Task 3: Localize TwentySidebar & TwentyTopBar

- [x] Perbarui `frontend/src/components/layout/TwentySidebar.tsx` untuk membaca judul grup dan tombol "Peluang Baru" dari `t(...)`.
- [x] Perbarui `frontend/src/components/layout/TwentyTopBar.tsx` untuk membaca tombol "Board/Table" dan "Peluang Baru" dari `t(...)`.
- [x] Jalankan `npm run typecheck` untuk memverifikasi tipe data.

### Task 4: Localize AddOpportunityModal & CansaasAnalyticsBento

- [x] Integrasikan `useI18n()` ke dalam `frontend/src/components/layout/AddOpportunityModal.tsx`.
- [x] Ganti seluruh teks berbahasa Inggris yang kaku dengan pemanggilan `t(...)` yang bilingual.
- [x] Integrasikan `useI18n()` ke dalam `frontend/src/features/cockpit/CansaasAnalyticsBento.tsx` untuk label chart, aktivitas, dan kartu insight.

### Task 5: Final Quality Verification & Git Synchronization

- [x] Jalankan `npm run audit:modern-web` untuk memastikan 0 temuan standar modern web.
- [x] Jalankan `npm run typecheck` dan `npm test` untuk memastikan 100% lulus.
- [x] Periksa tidak ada karakter em-dash maupun en-dash di seluruh perubahan.
- [x] Komit dan push perubahan ke GitHub.
