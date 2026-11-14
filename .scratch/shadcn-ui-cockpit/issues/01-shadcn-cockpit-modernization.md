# Issue 01: shadcn/ui Overhaul & Job Seeker Command Cockpit Modernization

Status: ready-for-human
Owner: Antigravity Agent
Plan: docs/superpowers/plans/2026-11-14-shadcn-ui-cockpit.md
Spec: docs/superpowers/specs/2026-11-14-shadcn-ui-cockpit-design.md

## Description
Full modernization of the application design system to shadcn/ui standards (Tailwind CSS, Zinc/Slate semantic tokens, atomic component primitives), introducing the Job Seeker Daily Command Cockpit (`JobSeekerCockpitView`), and humanized bilingual localization (`lib/i18n.ts`).

## Deliverables
- `frontend/tailwind.config.js`: Zinc/Slate semantic theme tokens.
- `frontend/postcss.config.js`: Tailwind CSS v3 PostCSS setup.
- `frontend/src/lib/cn.ts` & `frontend/src/lib/utils.ts`: Standard shadcn `cn` utility combining clsx & tailwind-merge.
- `frontend/src/components/ui/`: Atomic primitives (`Button`, `Card`, `Badge` with status variants, `Dialog`, `Input`, `Tabs`, `Table`, `Progress`).
- `frontend/src/lib/i18n.ts`: Bilingual dictionary with natural, flowing Indonesian (`humanizer-indonesia`) and concise technical English (`technical-writer`), free of em-dashes `—`.
- `frontend/src/features/cockpit/`:
  - `JobSeekerCockpitView.tsx`: Landing command center for job seekers.
  - `DailyAttentionRadar.tsx`: Action radar for stale applications (> 7 days ghosting risk), interviews in 48h, and high-match leads (> 80%).
  - `FunnelMomentumWidget.tsx`: Conversion rates and active pursuit momentum.
  - `PriorityActionList.tsx`: Top 5 priority applications table with 1-click drawer trigger.
- `frontend/src/App.tsx`: Modern shell header, Cockpit as default landing view, language switcher (ID/EN), notification center badge, and clean view router.

## Verification
- Unit test suite: 28/28 tests PASS (`node --experimental-strip-types --test`).
- PocketBase contract smoke test: PASS exit code 0.
- Production build: `npm --prefix frontend run build` PASS exit code 0.

## Comments
- Implemented and verified following Emil Kowalski & Apple Design principles (tactile `:active:scale-[0.98]` feedback, 60fps performance) and anti-AI-slop rules.
