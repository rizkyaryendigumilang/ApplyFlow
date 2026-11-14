# 5. Backend Hardening, Monotonic State Enforcement, and Statutory Offers Schema

## Status
Accepted

## Context
1. Previously, the Monotonic Safe State Progression ([ADR-0002](0002-safe-state-transition-hierarchy.md)) was only guarded during incoming `application_events` and within the frontend drawer, leaving direct HTTP PATCH / PUT mutations to `applications` vulnerable to downgrading active progress (e.g. from `Interview` back to `Applied`).
2. When applications were deleted, aggregate counters (`applications`, `responses`, `offers`) on `cv_artifacts` became stale due to the absence of an `onRecordAfterDeleteRequest` hook.
3. Complex compensation packages (Take-Home-Pay, PPh 21 TER 2024, BPJS Kesehatan/Ketenagakerjaan, THR multipliers, and allowances) lacked a persistent schema in PocketBase.
4. The AI Job Hunter analyzer (`/api/junction/hunter/analyze`) evaluated jobs using a static hardcoded dictionary instead of dynamically reading the user's `candidate_profiles` records.

## Decision
1. **P0 Direct API Monotonic Enforcement:** Added runtime validation inside `onRecordBeforeUpdateRequest` on `applications`. Any mutation attempting to downgrade status ranks (`Wishlist: 0 < Applied: 1 < Viewed: 2 < Screening: 3 < Interview: 4 < Offer: 5`) or move `Offer` to `Rejected` is rejected with `BadRequestError` (HTTP 400).
2. **P0 CV Artifacts Counter Synchronization on Delete:** Implemented `onRecordAfterDeleteRequest` on `applications` to automatically recount and update `cv_artifacts` metrics upon record deletion.
3. **P1 Statutory Offers Collection:** Created the `offers` collection ([1710000006_backend_p0_to_p2_improvements.js](file:///c:/Users/rizky/Documents/Dev/job-tracker-app/pocketbase/pb_migrations/1710000006_backend_p0_to_p2_improvements.js)) supporting PKWT/PKWTT, allowances, bonus months, PTKP categories, BPJS, and commute costs with strict multi-tenant isolation rules.
4. **P1 Inactivity & Ghosting Alert Cron Sweep:** Added a background cron worker (`detect_stale_ghosted_applications`) that flags applications inactive for >= 14 days and logs audit events.
5. **P2 Dynamic Candidate Profile AI Integration:** Enhanced `/api/junction/hunter/analyze` to read the authenticated candidate's `skills`, `dealbreakers`, and `minSalary` from `candidate_profiles`, returning personalized fit scores and dealbreaker alerts.
6. **P2 Multi-Tenant RBAC Role:** Added `role` (`candidate`, `coach`, `recruiter`, `admin`) to `users` (`_pb_users_auth_`).

## Consequences
- Data integrity across funnel stages is mathematically guaranteed against accidental or malicious HTTP API mutations.
- Multi-device offer simulations now persist cleanly in SQLite.
- Background cron sweeps autonomously log ghosting warnings.
- The AI evaluator adapts dynamically to candidate profiles.
