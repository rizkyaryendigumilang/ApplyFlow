# Auto Job Scout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated, high-velocity "Auto Job Scout" workspace enabling active candidates to discover, filter, and track multi-platform job postings (Jobstreet, LinkedIn, Glints) without rigid mandatory form fields.

**Architecture:** A standalone modular React view (`AutoJobScoutView.tsx`) powered by a query generation and lead parsing engine (`job-scout-engine.ts`), connecting candidate profile targets with live platform URLs and 1-click pipeline ingestion into PocketBase.

**Tech Stack:** React, TypeScript, Tailwind CSS (Twenty CRM Zinc tokens), Lucide Icons, PocketBase Client, Node test runner.

**Spec:** `docs/superpowers/specs/2026-11-16-auto-job-scout-design.md`

## Global Constraints

- **Strict Zero Em-Dashes:** No em-dash or en-dash characters anywhere in code, comments, or UI copy.
- **Indonesian Currency Standard:** All salary numbers formatted in IDR (`Rp`) with dot separators (`toLocaleString('id-ID')`).
- **Twenty CRM Minimalist UI:** 1px borders, neutral zinc shades (`zinc-100` to `zinc-950`), `rounded-xl`, font-mono for metrics.
- **Multi-Tenant Ownership:** Ingested applications tagged with candidate `owner = @request.auth.id`.

## Review Focus

1. Empty or malformed URL paste does not crash the parser or prompt error modals.
2. Clicking external vacancy URLs opens safely with `rel="noreferrer noopener"` in a new tab.
3. 1-click pipeline save successfully saves to the database and disables duplicate additions.
4. Switching target role filter instantly updates both live search links and vacancy radar cards.
5. All monetary compensation displays exclusively in Rupiah (`Rp`) without dollar signs.

---

### Task 1: Auto Job Scout Engine & Query Builders

**Files:**
- Create: `frontend/src/lib/job-scout-engine.ts`
- Create: `frontend/src/lib/__tests__/job-scout-engine.test.ts`

- [ ] Step 1: Write test file `job-scout-engine.test.ts` covering platform URL generation (Jobstreet, LinkedIn, Glints), query parameter formatting, URL extraction heuristics, and fit calculation.
- [ ] Step 2: Run tests to verify they fail initially.
- [ ] Step 3: Implement `frontend/src/lib/job-scout-engine.ts` with:
  - `buildJobstreetSearchUrl(query, location, workMode)`
  - `buildLinkedInSearchUrl(query, location, workMode)`
  - `buildGlintsSearchUrl(query, location)`
  - `parseJobUrlHeuristics(url)`
  - `calculateScoutFitScore(vacancy, profile)`
  - Curated initial tech vacancies tailored to candidate profile.
- [ ] Step 4: Run tests to ensure 100% pass rate.
- [ ] Step 5: Commit changes to git.

---

### Task 2: Auto Job Scout React View Component

**Files:**
- Create: `frontend/src/features/job-scout/AutoJobScoutView.tsx`

- [ ] Step 1: Implement `AutoJobScoutView.tsx` with:
  - Header: Title "Auto Job Scout", badge "MULTI-PLATFORM VACANCY RADAR", quick stats (Total Radar Leads, Target Match Rate).
  - Search & Platform Toolbar:
    - Platform selector (Jobstreet, LinkedIn, Glints).
    - Role presets (from candidate profile: Technical Consultant Analyst, Data Analyst, Data Engineer, DevOps) + custom search input.
    - Work mode pills (All, Remote, Hybrid, On-site).
    - Direct "Buka Pencarian Live di [Platform]" launch button.
  - Quick Paste Box: Optional fast paste bar for external vacancy URLs without mandatory fields.
  - Vacancy Radar Stream: Grid of cards showing role, company, location, stated IDR salary, fit score badge, matching skills, and 1-click action buttons ("Buka di [Platform]" and "+ Simpan ke Pipeline").
- [ ] Step 2: Connect view to `useCandidateProfile` and `useApplications`.
- [ ] Step 3: Handle 1-click save to applications table with toast notification.
- [ ] Step 4: Verify build with Vite.
- [ ] Step 5: Commit changes to git.

---

### Task 3: App Navigation & Module Integration

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/lib/i18n.ts`

- [ ] Step 1: Update `Module` type in `frontend/src/App.tsx` to include `'jobscout'`.
- [ ] Step 2: Add sidebar navigation button for Auto Job Scout under Workspace with `Compass` icon.
- [ ] Step 3: Wire rendering of `<AutoJobScoutView />` inside `App.tsx` main view switch.
- [ ] Step 4: Add localization keys in `frontend/src/lib/i18n.ts` (`nav.jobscout`: "Auto Job Scout").
- [ ] Step 5: Commit changes to git.

---

### Task 4: End-to-End Verification & Testing

**Files:**
- Run: Full test suite (`npm test`)
- Run: Frontend build (`npm run frontend:build`)

- [ ] Step 1: Execute `npm test` and ensure all unit tests pass with zero failures.
- [ ] Step 2: Execute `npm run frontend:build` and verify 0 TypeScript errors.
- [ ] Step 3: Verify clean UI state, zero em-dashes, and seamless 1-click workflow.
