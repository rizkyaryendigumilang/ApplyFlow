# shadcn/ui Overhaul & Job Seeker Command Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the application UI to modern shadcn/ui standards (Tailwind CSS, atomic primitives, Zinc/Slate palette), build a dedicated Job Seeker Daily Command Cockpit, and introduce a humanized bilingual localization system (ID/EN).

**Architecture:** Tailwind CSS v3 with semantic CSS variables for dark/light theme, atomic shadcn component primitives in `src/components/ui/`, an intelligent Job Seeker Cockpit (`JobSeekerCockpitView`) synthesizing data from `applications`, `interviews`, `job_leads`, and `useLinkedInQuota`, and a humanized bilingual dictionary engine (`lib/i18n.ts`).

**Tech Stack:** React 18, TypeScript, Tailwind CSS, PostCSS, Autoprefixer, clsx, tailwind-merge, class-variance-authority, Lucide icons, Node test runner (`node --test`).

**Spec:** [docs/superpowers/specs/2026-11-14-shadcn-ui-cockpit-design.md](file:///c:/Users/rizky/Documents/Dev/job-tracker-app/docs/superpowers/specs/2026-11-14-shadcn-ui-cockpit-design.md)

## Global Constraints

- Zero em-dashes (`—`) in all user-facing copy and templates.
- Strict Anti-AI Slop: no gaudy purple/indigo gradients, no glowing borders, no emoji overload.
- Humanized Indonesian: natural phrasing without translationese/kalke (curated via `humanizer-indonesia`).
- Multi-tenant data isolation: all reads and mutations strictly bound to `@request.auth.id`.
- 60fps interaction: hardware-accelerated transitions (`transform: scale`, `opacity`), zero lag.

## Review Focus

1. Tailwind & legacy CSS coexistence: ensure `@tailwind` directives and custom CSS variables in `styles.css` do not collide or break existing layouts.
2. Missing data resilience: Cockpit widgets must handle empty application, interview, or lead arrays gracefully with clean empty states.
3. Ghosting threshold calculation: stale applications must accurately compute `daysSince >= 7` without NaN or date parsing errors.
4. Locale persistence: switching language between ID and EN persists cleanly to `localStorage` without page reload.
5. Touch & click feedback: interactive buttons must have tactile `:active scale-[0.98]` micro-interactions (`emil-design-eng`).

---

### Task 1: Tailwind CSS, shadcn Tokens & `cn` Utility Setup

**Files:**
- Modify: `frontend/package.json` (add tailwindcss, postcss, autoprefixer, clsx, tailwind-merge, class-variance-authority)
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/src/lib/utils.ts`
- Modify: `frontend/src/styles.css` (inject `@tailwind` directives and shadcn CSS variables)
- Test: `frontend/src/lib/__tests__/utils.test.ts`

**Interfaces:**
- Produces:
  - `cn(...inputs: ClassValue[]): string`

- [ ] **Step 1: Write failing test in `frontend/src/lib/__tests__/utils.test.ts`**
  Cover class merging, conditional classes, and tailwind conflicts resolution.

- [ ] **Step 2: Install dependencies**
  Run: `npm --prefix frontend install -D tailwindcss@^3.4.17 postcss@^8.4.49 autoprefixer@^10.4.20 clsx@^2.1.1 tailwind-merge@^2.6.0 class-variance-authority@^0.7.1`

- [ ] **Step 3: Create `tailwind.config.js`, `postcss.config.js`, `src/lib/utils.ts`, and update `styles.css`**
  Configure Zinc/Slate theme variables, border radius, and utility functions.

- [ ] **Step 4: Run test to verify it passes**
  Run: `node --experimental-strip-types --test frontend/src/lib/__tests__/utils.test.ts`
  Expected: PASS

- [ ] **Step 5: Verify Tailwind compilation**
  Run: `npm --prefix frontend run build`
  Expected: Build succeeds with exit code 0.

---

### Task 2: Atomic shadcn/ui Component Primitives

**Files:**
- Create: `frontend/src/components/ui/button.tsx`
- Create: `frontend/src/components/ui/card.tsx`
- Create: `frontend/src/components/ui/badge.tsx`
- Create: `frontend/src/components/ui/dialog.tsx`
- Create: `frontend/src/components/ui/input.tsx`
- Create: `frontend/src/components/ui/tabs.tsx`
- Create: `frontend/src/components/ui/table.tsx`
- Create: `frontend/src/components/ui/progress.tsx`
- Test: `frontend/src/components/ui/__tests__/badge.test.ts`

**Interfaces:**
- Produces:
  - `Button`, `buttonVariants`
  - `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
  - `Badge`, `badgeVariants` (with semantic status variants)
  - `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`
  - `Input`, `Tabs`, `Table`, `Progress`

- [ ] **Step 1: Write failing test for `badgeVariants` status mapping**
  Test in `frontend/src/components/ui/__tests__/badge.test.ts`.

- [ ] **Step 2: Implement all atomic components in `src/components/ui/`**
  Implement accessible components with cva variants and tactile `:active` micro-interactions.

- [ ] **Step 3: Run test to verify it passes**
  Run: `node --experimental-strip-types --test frontend/src/components/ui/__tests__/badge.test.ts`
  Expected: PASS

- [ ] **Step 4: Verify TypeScript compilation**
  Run: `npm --prefix frontend run build`
  Expected: Build succeeds with exit code 0.

---

### Task 3: Humanized Bilingual Localization Engine

**Files:**
- Create: `frontend/src/lib/i18n.ts`
- Test: `frontend/src/lib/__tests__/i18n.test.ts`

**Interfaces:**
- Produces:
  - `useI18n(): { locale: 'id' | 'en', setLocale: (l: 'id' | 'en') => void, t: (key: string, params?: Record<string, string | number>) => string }`
  - Natural Indonesian phrases without translationese (`/humanizer-indonesia`)
  - Concise technical English (`/technical-writer`, `/writing-guidelines`)

- [ ] **Step 1: Write failing test in `frontend/src/lib/__tests__/i18n.test.ts`**
  Cover translation lookup, interpolation of numbers and names, and fallback when key is missing.

- [ ] **Step 2: Implement `frontend/src/lib/i18n.ts`**
  Build dictionary and hook with local storage persistence (`junction_crm_locale`).

- [ ] **Step 3: Run test to verify it passes**
  Run: `node --experimental-strip-types --test frontend/src/lib/__tests__/i18n.test.ts`
  Expected: PASS

---

### Task 4: Job Seeker Daily Command Cockpit

**Files:**
- Create: `frontend/src/features/cockpit/DailyAttentionRadar.tsx`
- Create: `frontend/src/features/cockpit/FunnelMomentumWidget.tsx`
- Create: `frontend/src/features/cockpit/PriorityActionList.tsx`
- Create: `frontend/src/features/cockpit/JobSeekerCockpitView.tsx`
- Test: `frontend/src/features/cockpit/__tests__/cockpit-radar.test.ts`

**Interfaces:**
- Consumes:
  - `applications: Application[]`
  - `interviews: InterviewRecord[]`
  - `jobLeads: JobLead[]`
  - `useLinkedInQuota`
  - `useI18n`
- Produces:
  - `JobSeekerCockpitView`: High-impact landing command center with Daily Attention Radar, Funnel, LinkedIn Quota, and Priority Action List.

- [ ] **Step 1: Write failing test for radar calculation logic**
  Test in `frontend/src/features/cockpit/__tests__/cockpit-radar.test.ts`.

- [ ] **Step 2: Implement `DailyAttentionRadar.tsx`, `FunnelMomentumWidget.tsx`, `PriorityActionList.tsx`, and `JobSeekerCockpitView.tsx`**
  Wire full reactive state, 1-click action buttons, and responsive bento grid.

- [ ] **Step 3: Run test to verify it passes**
  Run: `node --experimental-strip-types --test frontend/src/features/cockpit/__tests__/cockpit-radar.test.ts`
  Expected: PASS

---

### Task 5: Modern Application Shell Overhaul (`App.tsx`)

**Files:**
- Modify: `frontend/src/App.tsx`

**Interfaces:**
- Wire:
  - Add `'cockpit'` as a core module and default landing page.
  - Add top sticky header with shadcn styling, brand badge, module pills, search shortcut, notification badge, and language switch toggle (ID/EN).
  - Connect module routing to render `<JobSeekerCockpitView />`.

- [ ] **Step 1: Update `App.tsx` with modern header and Cockpit routing**
  Integrate `useI18n`, add `'cockpit'` to `Module` type, render `JobSeekerCockpitView`.

- [ ] **Step 2: Verify production build**
  Run: `npm --prefix frontend run build`
  Expected: Exit code 0, clean bundles.

---

### Task 6: Full Verification & Issue Tracker Update

**Files:**
- Create: `.scratch/shadcn-ui-cockpit/issues/01-shadcn-cockpit-modernization.md`

- [ ] **Step 1: Run all unit tests**
  Run: `node --experimental-strip-types --test frontend/src/**/__tests__/*.test.ts`
  Expected: All unit tests PASS.

- [ ] **Step 2: Run PocketBase contract smoke test**
  Run: `powershell -ExecutionPolicy Bypass -File scripts/pocketbase-smoke.ps1`
  Expected: PASS exit code 0.

- [ ] **Step 3: Full production build**
  Run: `npm --prefix frontend run build`
  Expected: PASS exit code 0.

- [ ] **Step 4: Update issue tracker**
  Write ticket with status `ready-for-human`.
