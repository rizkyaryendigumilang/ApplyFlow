# LinkedIn Assistant & Referral Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dedicated LinkedIn Assistant workspace that enables target company employee deep-linking, anti-slop referral & cold message drafting, safe weekly quota tracking, and 1-click sync to Networking CRM.

**Architecture:** A standalone React modular view (`LinkedInAssistantView`) composed of focused sub-cards (`CompanyDeepLinkCard`, `OutreachComposerCard`, `SafeQuotaTrackerCard`, `ProfilePolisherCard`). Powered by a zero-dependency, client-side template interpolation and anti-slop sanitation engine (`linkedin-templates.ts`), integrated directly with `useApplications`, `useCandidateProfile`, and `useProfessionalContacts`.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Lucide icons, Node test runner (`node --test`), PocketBase client SDK.

**Spec:** [docs/superpowers/specs/2026-11-14-linkedin-assistant-design.md](file:///c:/Users/rizky/Documents/Dev/job-tracker-app/docs/superpowers/specs/2026-11-14-linkedin-assistant-design.md)

## Global Constraints

- Zero em-dashes (`—`) in all generated outreach drafts or copy text.
- Strictly first-person voice ("I...", "Saya...", never third person "He/She").
- LinkedIn connection note length hard cap: maximum 300 characters.
- Multi-tenant data isolation: all contact additions must carry the authenticated user ID (`owner`).
- Weekly safe quota cap: 25 connection requests per rolling week with automatic Monday reset.

## Review Focus

1. Target role or company missing from input: fallback smoothly without displaying `undefined` or crashing.
2. Character limit violation: connection invite notes must strictly remain <= 300 characters.
3. AI Slop leakage: ensure no em-dashes (`—`) ever appear in generated drafts.
4. Quota corruption: corrupted `localStorage` payload self-heals to default 0 count for the active week.
5. Network error resilience: failed contact sync displays an error alert while preserving the generated draft in memory.

---

### Task 1: Anti-Slop Heuristic Generator & Template Engine

**Files:**
- Create: `frontend/src/features/linkedin-assistant/linkedin-templates.ts`
- Test: `frontend/src/features/linkedin-assistant/__tests__/linkedin-templates.test.ts`

**Interfaces:**
- Consumes:
  - `CandidateProfile` interface or fields (`headline`, `skills`, `currentRole`, `fullName`)
  - Target job parameters (`company: string`, `role: string`, `persona: 'peer' | 'recruiter' | 'lead'`, `degree: '1st' | '2nd'`, `lang: 'id' | 'en'`)
- Produces:
  - `generateOutreachMessage(params: OutreachParams): string`
  - `generateConnectionNote(params: ConnectionNoteParams): string` (strictly <= 300 chars, no em-dash)
  - `generateLinkedInHeadlines(params: HeadlineParams): string[]` (3 punchy options)
  - `generateLinkedInAbout(params: AboutParams): string`
  - `sanitizeAntiSlop(text: string): string` (replaces em-dashes with comma/period, removes generic AI filler)

- [ ] **Step 1: Write the failing tests in `frontend/src/features/linkedin-assistant/__tests__/linkedin-templates.test.ts`**
  Cover:
  - Assert generated outreach contains NO em-dash `—`.
  - Assert connection note length is <= 300 characters.
  - Assert persona differences (peer referral vs recruiter intro).
  - Assert language support (Indonesian vs English).
  - Assert fallback handling when profile skills or company is empty.

- [ ] **Step 2: Run test to verify failure**
  Run: `node --experimental-strip-types --test frontend/src/features/linkedin-assistant/__tests__/linkedin-templates.test.ts`
  Expected: FAIL with module not found or functions undefined.

- [ ] **Step 3: Implement `linkedin-templates.ts`**
  Implement generator functions, persona dictionaries, sanitization rules, and fallback handling.

- [ ] **Step 4: Run test to verify it passes**
  Run: `node --experimental-strip-types --test frontend/src/features/linkedin-assistant/__tests__/linkedin-templates.test.ts`
  Expected: PASS all assertions.

- [ ] **Step 5: Commit**
  Run: `git add frontend/src/features/linkedin-assistant/ && git commit -m "feat(linkedin): implement anti-slop templates and message generators"`

---

### Task 2: Weekly Safe Quota Tracker Engine & Hook

**Files:**
- Create: `frontend/src/features/linkedin-assistant/useLinkedInQuota.ts`
- Test: `frontend/src/features/linkedin-assistant/__tests__/useLinkedInQuota.test.ts`

**Interfaces:**
- Consumes:
  - `localStorage` key `'career_crm_linkedin_quota_v1'`
- Produces:
  - `useLinkedInQuota(): { count: number, safeLimit: number, status: 'safe' | 'caution' | 'danger', increment: () => void, reset: () => void, weekLabel: string }`

- [ ] **Step 1: Write the failing tests in `frontend/src/features/linkedin-assistant/__tests__/useLinkedInQuota.test.ts`**
  Cover:
  - Assert initial count defaults to 0 and status is `'safe'`.
  - Assert `increment` increases count by 1 and persists to storage.
  - Assert count approaching/exceeding limit shifts status to `'caution'` (>= 20) and `'danger'` (>= 25).
  - Assert automatic self-healing if storage contains malformed JSON or past-week dates.

- [ ] **Step 2: Run test to verify failure**
  Run: `node --experimental-strip-types --test frontend/src/features/linkedin-assistant/__tests__/useLinkedInQuota.test.ts`
  Expected: FAIL with module not found.

- [ ] **Step 3: Implement `useLinkedInQuota.ts`**
  Implement the hook with Monday-boundary calculation, state persistence, and error-tolerant parsing.

- [ ] **Step 4: Run test to verify it passes**
  Run: `node --experimental-strip-types --test frontend/src/features/linkedin-assistant/__tests__/useLinkedInQuota.test.ts`
  Expected: PASS all assertions.

- [ ] **Step 5: Commit**
  Run: `git add frontend/src/features/linkedin-assistant/ && git commit -m "feat(linkedin): implement safe weekly quota tracking hook"`

---

### Task 3: UI Cards (Deep-Links, Composer, Quota & Profile Polisher)

**Files:**
- Create: `frontend/src/features/linkedin-assistant/CompanyDeepLinkCard.tsx`
- Create: `frontend/src/features/linkedin-assistant/OutreachComposerCard.tsx`
- Create: `frontend/src/features/linkedin-assistant/SafeQuotaTrackerCard.tsx`
- Create: `frontend/src/features/linkedin-assistant/ProfilePolisherCard.tsx`

**Interfaces:**
- Consumes:
  - `linkedin-templates.ts`
  - `useLinkedInQuota.ts`
  - `useProfessionalContacts` (`addContact`)
  - Target company & role state from parent
- Produces:
  - `CompanyDeepLinkCard`: 3 deep-link search buttons (1st-degree peers, recruiters, leads) opening LinkedIn in new tab.
  - `OutreachComposerCard`: Persona selector, tone & language toggle, copy-to-clipboard button, and "Log to Networking CRM" button.
  - `SafeQuotaTrackerCard`: Progress bar, quota status indicator, increment button.
  - `ProfilePolisherCard`: 3 headline options and "About" generator with 1-click copy.

- [ ] **Step 1: Implement `CompanyDeepLinkCard.tsx`**
  Build card with URL-encoded query generators for LinkedIn people search filters.

- [ ] **Step 2: Implement `SafeQuotaTrackerCard.tsx`**
  Build visual progress bar with safety badge (`safe`, `caution`, `danger`).

- [ ] **Step 3: Implement `OutreachComposerCard.tsx`**
  Build draft editor with persona pills, language switch, character counter, copy-to-clipboard, and direct sync to `professional_contacts`.

- [ ] **Step 4: Implement `ProfilePolisherCard.tsx`**
  Build headline comparison tabs and About summary draft with 1-click copy.

- [ ] **Step 5: Verify components compile cleanly**
  Run: `npx --prefix frontend tsc -b`
  Expected: No TypeScript diagnostic errors.

- [ ] **Step 6: Commit**
  Run: `git add frontend/src/features/linkedin-assistant/ && git commit -m "feat(linkedin): create deep-link, composer, quota, and profile polish cards"`

---

### Task 4: Main Orchestrator View & Application Navigation Wiring

**Files:**
- Create: `frontend/src/features/linkedin-assistant/LinkedInAssistantView.tsx`
- Modify: `frontend/src/App.tsx:74-87` (add `'linkedin'` to `Module` type)
- Modify: `frontend/src/App.tsx` (add sidebar nav button with icon & render view in main area)

**Interfaces:**
- Consumes:
  - All cards from Task 3
  - `useApplications` (loads pipeline jobs for quick selection)
  - `useCandidateProfile` (loads candidate details)
  - `useProfessionalContacts` (passed to sync actions)
- Produces:
  - Complete, responsive LinkedIn Assistant view integrated seamlessly into the App shell.

- [ ] **Step 1: Implement `LinkedInAssistantView.tsx`**
  Wire active application selection, custom company input fallback, tab switching between "Outreach Hub" and "Profile Polish", and sub-cards orchestration.

- [ ] **Step 2: Update `App.tsx`**
  Add `'linkedin'` to `Module` union type. Add sidebar button with `Share2` icon and label "LinkedIn Assistant". Connect module view switch to render `<LinkedInAssistantView />`.

- [ ] **Step 3: Verify TypeScript and build**
  Run: `npm --prefix frontend run build`
  Expected: Build succeeds with 0 errors.

- [ ] **Step 4: Commit**
  Run: `git add frontend/src/features/linkedin-assistant/LinkedInAssistantView.tsx frontend/src/App.tsx && git commit -m "feat(linkedin): integrate LinkedIn Assistant into main application shell"`

---

### Task 5: End-to-End Verification & Documentation

**Files:**
- Create/Update: `.scratch/linkedin-assistant/issues/01-linkedin-assistant-hub.md`
- Test: Full unit suite + PocketBase smoke test

- [ ] **Step 1: Run all unit tests**
  Run: `node --experimental-strip-types --test frontend/src/features/linkedin-assistant/__tests__/*.test.ts`
  Expected: All unit tests PASS.

- [ ] **Step 2: Run PocketBase smoke verification**
  Run: `powershell -ExecutionPolicy Bypass -File scripts/pocketbase-smoke.ps1`
  Expected: All 10 contract tests PASS with exit code 0.

- [ ] **Step 3: Run full production frontend build**
  Run: `npm --prefix frontend run build`
  Expected: Exit code 0, dist bundles built.

- [ ] **Step 4: Update issue tracking ticket**
  Document the completion of the feature in `.scratch/linkedin-assistant/issues/01-linkedin-assistant-hub.md` with status `ready-for-human`.

- [ ] **Step 5: Final commit**
  Run: `git commit --allow-empty -m "chore(linkedin): complete LinkedIn Assistant verification and spec implementation"`
