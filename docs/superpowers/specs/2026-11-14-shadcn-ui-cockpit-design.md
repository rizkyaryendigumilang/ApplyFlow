# Design Document: shadcn/ui Overhaul & Job Seeker Daily Command Cockpit

- **Topic:** Full UI Modernization with shadcn/ui, Job Seeker Command Cockpit, and Humanized Bilingual System
- **Date:** 2026-11-14
- **Status:** Draft for Review
- **Skills Engaged:** `ui-ux-pro-max`, `emil-design-eng`, `apple-design`, `kill-ai-slop`, `no-ai-slop`, `ponytail`, `humanizer-indonesia`, `technical-writer`, `writing-guidelines`, `agent-security-super-skill`, `ai-engineering-team`

---

## 1. Intent & The Why

A job search is a multi-front campaign: applying to openings, following up on stale leads, tracking recruiters, preparing for STAR interviews, and evaluating offers. When an applicant opens their Career CRM, they should not have to manually dig through 12 different tabs just to figure out what needs attention today.

This project executes a full UI modernization aligned with **shadcn/ui** (`https://github.com/shadcn-ui/ui.git`):
1. **Design System Transformation:** Transition from the legacy custom CSS to standard Tailwind CSS + shadcn/ui atomic components (`Button`, `Card`, `Badge`, `Dialog`, `Tabs`, `Table`, `Progress`, `DropdownMenu`), using a clean, refined Zinc/Slate neutral aesthetic (Linear/Vercel standard) that eliminates all AI slop (no gaudy gradients, no emoji spam, no em-dashes).
2. **Job Seeker Daily Command Cockpit (`JobSeekerCockpitView`):** A dedicated, high-impact landing dashboard answering the applicant's daily question: *"What do I need to check and act on today?"*
3. **Bilingual Humanized Experience (ID & EN):** Clean localization system with natural, flowing Indonesian (free of machine-translated translationese/kalke) and crisp, active-voice English.
4. **Fluid Craft & High Performance:** 60fps tactile micro-interactions (`:active scale-[0.98]`, spring curves, hardware-accelerated transforms) and strict zero-token-leakage multi-tenant security.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **G1 (Design System Foundation):** Install and configure Tailwind CSS, PostCSS, Autoprefixer, `clsx`, `tailwind-merge`, and `class-variance-authority`. Establish standard shadcn design tokens (CSS variables for light/dark Zinc palette) and `cn(...)` utility in `frontend/src/lib/utils.ts`.
- **G2 (Atomic shadcn Components):** Implement standard, accessible shadcn components in `src/components/ui/` (`button.tsx`, `card.tsx`, `badge.tsx`, `dialog.tsx`, `input.tsx`, `tabs.tsx`, `table.tsx`, `progress.tsx`, `dropdown-menu.tsx`, `tooltip.tsx`).
- **G3 (Job Seeker Daily Command Cockpit):** Build `JobSeekerCockpitView.tsx` featuring:
  - **Daily Attention Radar:** Real-time alerts for stale applications (> 7 days ghosting risk), upcoming interviews in 48-72h with quick STAR prep link, and high-match job leads (> 80% match) waiting in inbox.
  - **Funnel Momentum & Analytics:** Visual conversion metrics (Wishlist $\rightarrow$ Applied $\rightarrow$ Screening $\rightarrow$ Interview $\rightarrow$ Offer) with response rate diagnostics.
  - **Safe LinkedIn Outreach Quota:** Weekly connection progress meter and daily referral outreach reminder.
  - **Priority Action List:** Top 5 urgent applications with 1-click status drawer.
- **G4 (Modern Shell Navigation):** Overhaul `App.tsx` navigation header with sticky backdrop-blur, brand mark, quick search, notification badge, language toggle (ID/EN), and clean module routing.
- **G5 (Humanized Bilingual Localization):** Implement `frontend/src/lib/i18n.ts` supporting Indonesian and English. Indonesian text is natural and idiomatic (following `/humanizer-indonesia`), English is active and concise (following Vercel writing guidelines).
- **G6 (Performance & Compatibility):** Zero regressions on existing PocketBase backend collections (`applications`, `job_leads`, `interviews`, `cv_artifacts`, `candidate_profiles`, `professional_contacts`, `offers`). Fast build and smooth 60fps interaction.

### Non-Goals
- Modifying the PocketBase Go/SQLite backend schema (backend is already hardened and validated).
- Adding bloated 3rd-party animation runtime libraries that degrade load performance.

### Anti-Goals
- AI Slop: No gaudy purple/indigo gradient headings, no glowing borders, no emoji overload (`/kill-ai-slop`).
- No translationese or awkward AI Indonesian phrasing like *"Aplikasi Tertunda Yang Membutuhkan Tindakan Lanjut"* (`/humanizer-indonesia`).
- Zero em-dashes (`—`) in any user-facing text (`/no-ai-slop`).

---

## 3. Constraints & Technical Boundaries

- **Tailwind Version:** Tailwind CSS v3 with PostCSS and Autoprefixer for maximum compatibility with Vite 5 and React 18.
- **Security:** Multi-tenant isolation (`owner = @request.auth.id`). OAuth tokens on Gmail connections stripped from client HTTP responses. Input sanitization to prevent XSS.
- **State Progression:** Monotonic application status machine (`Wishlist < Applied < Viewed < Screening < Interview < Offer`).
- **Responsiveness:** Full layout fluid responsiveness (Desktop, Tablet, Mobile PWA).

---

## 4. Approaches Considered

### Approach 1: Modern Native shadcn/ui Shell + Job Seeker Command Cockpit (Chosen)
Full adoption of Tailwind CSS + shadcn atomic primitives, accompanied by a dedicated daily intelligence cockpit for job seekers and a humanized bilingual system.
- *Pros:* Delivers exactly what the user requested; elevates the app to a world-class SaaS standard; gives immediate daily utility to job seekers; eliminates AI slop.
- *Cons:* Requires meticulous refactoring of navigation and core views.
- *Verdict:* **Chosen**.

### Approach 2: Minimalist Component Wrapper Only
Keep the legacy 73KB CSS file and wrap individual elements without creating the Cockpit or modernizing the header.
- *Pros:* Slightly fewer files edited.
- *Cons:* Leaves the app feeling fragmented, fails to solve the job seeker's daily information needs, retains old styling bugs.
- *Verdict:* **Rejected**.

---

## 5. System Architecture & UI Design

### Directory Structure
```
frontend/src/
├── components/
│   └── ui/
│       ├── button.tsx           # shadcn Button with cva variants (default, secondary, outline, destructive, ghost)
│       ├── card.tsx             # Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
│       ├── badge.tsx            # Semantic status badges (Wishlist, Applied, Interview, Offer, Rejected)
│       ├── dialog.tsx           # Accessible modal dialog with backdrop blur
│       ├── input.tsx            # Styled input field with focus ring
│       ├── tabs.tsx             # Tab list and panels with smooth transition
│       ├── table.tsx            # Modern table primitives (Table, TableHeader, TableRow, TableCell)
│       ├── progress.tsx         # Progress bar with color variants
│       └── tooltip.tsx          # Lightweight accessible tooltip wrapper
├── features/
│   ├── cockpit/
│   │   ├── JobSeekerCockpitView.tsx   # Daily Attention Radar, Funnel, Priority Queue, Habit Meter
│   │   ├── DailyAttentionRadar.tsx    # Stale follow-ups, interview countdown, high-match leads
│   │   └── FunnelMomentumWidget.tsx   # Conversion rates and drop-off diagnostics
│   └── ... (existing modules updated to use shadcn tokens)
├── lib/
│   ├── utils.ts                 # cn(...) utility combining clsx & tailwind-merge
│   └── i18n.ts                  # Bilingual dictionary (ID/EN) with humanized phrases
├── tailwind.config.js           # Semantic design tokens & color variables
└── postcss.config.js            # Tailwind + Autoprefixer plugins
```

---

## 6. Settled Builder Decisions & Technical Specifications

1. **Localization Storage:** `localStorage.getItem('junction_crm_locale')` with `'id'` (default) and `'en'`. Toggle button in the header bar.
2. **Default Landing View:** The newly built `cockpit` module is set as the primary landing view, with 1-click access to `pipeline`, `jobhunter`, `networking`, `linkedin`, and `offers`.
3. **Status Badge Palette:**
   - `Wishlist`: Slate/Zinc neutral
   - `Applied`: Blue
   - `Viewed`: Sky
   - `Screening`: Violet
   - `Interview`: Amber/Orange
   - `Offer`: Emerald
   - `Rejected`: Rose
   - `Ghosted`: Muted Zinc
4. **Performance Strategy:** Pure CSS transitions for animations (hardware-accelerated `transform` and `opacity`). Zero layout recalculation bottlenecks.
