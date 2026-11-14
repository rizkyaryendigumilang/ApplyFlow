# Issue 01: LinkedIn Assistant & Referral Command Center

Status: ready-for-human
Owner: Antigravity Agent
Plan: docs/superpowers/plans/2026-11-14-linkedin-assistant.md
Spec: docs/superpowers/specs/2026-11-14-linkedin-assistant-design.md

## Description
Implementation of the dedicated LinkedIn Assistant view in the Career CRM application.

## Deliverables
- `frontend/src/features/linkedin-assistant/linkedin-templates.ts`: Anti-slop template engine and heuristic message generator (ID & EN) without em-dashes `—`.
- `frontend/src/features/linkedin-assistant/useLinkedInQuota.ts`: Safe weekly connection quota tracker with rolling Monday auto-reset.
- `frontend/src/features/linkedin-assistant/CompanyDeepLinkCard.tsx`: Direct deep-link URL generator for LinkedIn search (1st-degree peers, recruiters, engineering managers).
- `frontend/src/features/linkedin-assistant/OutreachComposerCard.tsx`: AI referral & cold pitch generator with 1-click clipboard copy and direct sync to `professional_contacts`.
- `frontend/src/features/linkedin-assistant/SafeQuotaTrackerCard.tsx`: Visual progress meter and shadowban prevention guidelines.
- `frontend/src/features/linkedin-assistant/ProfilePolisherCard.tsx`: 3 ATS-aligned LinkedIn headline options and "About" section generator.
- `frontend/src/features/linkedin-assistant/LinkedInAssistantView.tsx`: Main view layout.
- `frontend/src/App.tsx`: Module routing and sidebar navigation integration.

## Verification
- Unit test suite: 13/13 passing tests (`node --experimental-strip-types --test`).
- PocketBase contract smoke test: passed (exit code 0).
- Production build: `npm --prefix frontend run build` succeeded cleanly with 0 TypeScript errors.

## Comments
- Completed and ready for human review.
