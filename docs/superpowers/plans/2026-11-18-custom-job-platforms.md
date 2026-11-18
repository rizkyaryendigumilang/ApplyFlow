# Multi-Platform Action Grid & Kustom Platform Mandiri Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghadirkan Multi-Platform Action Grid pada Auto Job Scout dengan 6 platform bawaan (Jobstreet, LinkedIn, Glints, Indeed, Kalibrr, Dealls), dukungan tambah platform kustom mandiri, dan peluncur multi-tab di 1 layar.

**Architecture:** Engine `job-scout-engine.ts` diperluas dengan generator template URL kustom. Hook `useJobPlatforms.ts` mengelola status persisten di `localStorage`. Antarmuka `AutoJobScoutView.tsx` dirombak menampilkan grid kartu peluncur interaktif dengan tombol per platform dan tombol aksi massal.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide Icons, Node.js native test runner (`node:test`).

**Spec:** [docs/superpowers/specs/2026-11-18-custom-job-platforms-design.md](file:///c:/Users/rizky/Documents/Dev/job-tracker-app/docs/superpowers/specs/2026-11-18-custom-job-platforms-design.md)

## Global Constraints

- Strictly zero em-dash (`—`) and zero en-dash (`–`) in any code, labels, or test descriptions.
- Strict KBBI spelling for Indonesian text (*analisis*, *respons*, *kustom*, *peluncur*).
- Preserves all 60 existing unit tests without regressions.
- Multi-tenant safety: local storage keys isolated under `applyflow_custom_job_platforms`.

## Review Focus

1. URL template without `{query}` or `{location}` tokens: system must gracefully append query or launch base URL without breaking.
2. Duplicate platform IDs or empty names: validation must prevent empty entries.
3. Multi-tab pop-up blocker: browser must open links cleanly via `window.open` with `noopener,noreferrer`.
4. Dark mode and light mode contrast: platform cards must follow HorizonX hairline border and DM Sans / DM Mono hierarchy.
5. Deletion safety: built-in platforms cannot be accidentally deleted, only user-created custom platforms have delete actions.

---

### Task 1: Extend Engine with Custom Platform Model & URL Generator

**Files:**
- Modify: `frontend/src/lib/job-scout-engine.ts`
- Test: `frontend/src/lib/__tests__/job-scout-engine.test.ts`

- [ ] **Step 1:** Write unit tests for `buildCustomPlatformSearchUrl` and default presets in `frontend/src/lib/__tests__/job-scout-engine.test.ts`.
- [ ] **Step 2:** Run `npm test` to verify the tests fail as expected.
- [ ] **Step 3:** Implement `JobPlatformPreset` interface, `DEFAULT_PLATFORM_PRESETS` (Jobstreet, LinkedIn, Glints, Indeed, Kalibrr, Dealls), and `buildCustomPlatformSearchUrl` in `frontend/src/lib/job-scout-engine.ts`.
- [ ] **Step 4:** Run `npm test` to verify all tests pass.
- [ ] **Step 5:** Commit changes to git.

---

### Task 2: Create `useJobPlatforms` Hook with Local Storage Persistence

**Files:**
- Create: `frontend/src/hooks/useJobPlatforms.ts`
- Test: `frontend/src/lib/__tests__/job-platforms.test.ts`

- [ ] **Step 1:** Write unit tests in `frontend/src/lib/__tests__/job-platforms.test.ts` testing preset loading, adding custom platform, deleting custom platform, and template parsing.
- [ ] **Step 2:** Run `npm test` to confirm tests fail.
- [ ] **Step 3:** Implement `useJobPlatforms` hook with `localStorage` persistence, addPlatform, removePlatform, and reset to defaults.
- [ ] **Step 4:** Run `npm test` to verify all tests pass.
- [ ] **Step 5:** Commit changes to git.

---

### Task 3: Refactor `AutoJobScoutView.tsx` with Multi-Platform Action Grid

**Files:**
- Modify: `frontend/src/features/job-scout/AutoJobScoutView.tsx`

- [ ] **Step 1:** Replace the single platform dropdown with the **Radar Peluncur Multi-Platform** Bento Grid.
- [ ] **Step 2:** Implement each platform card with icon, badge, live URL launcher (`target="_blank"`), and delete action for custom platforms.
- [ ] **Step 3:** Implement inline collapsible form for `+ Tambah Platform Kustom` (Nama Platform + Format URL dengan placeholder `{query}` & `{location}`).
- [ ] **Step 4:** Implement button `Buka Semua Platform Pilihan Sekaligus` for multi-tab launch.
- [ ] **Step 5:** Verify styling matches HorizonX hairline highlights, Arc UI micro-pills, and Bencho status tags.

---

### Task 4: End-to-End Verification & Visual Inspection

**Files:**
- Verify: Full test suite, TypeScript types, and live UI.

- [ ] **Step 1:** Run `npm run typecheck` to verify zero TypeScript errors.
- [ ] **Step 2:** Run `npm test` to verify all unit tests pass.
- [ ] **Step 3:** Run `npm run frontend:build` to confirm production bundle builds cleanly.
- [ ] **Step 4:** Verify with browser subagent on `http://localhost:5173/` that custom platforms can be added, launched, and displayed in both Light and Dark modes.
- [ ] **Step 5:** Confirm zero em-dash and zero en-dash across all modified files.
- [ ] **Step 6:** Commit all changes to git.
