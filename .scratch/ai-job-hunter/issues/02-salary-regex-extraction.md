# Issue 02: Heuristic Salary Range Extraction and Minimum Threshold Check

Status: resolved
Type: task

## Description

`evaluateJobFit` currently receives `profile.minSalary` via `profile: CandidateProfile`, but does not attempt to extract numerical compensation from `rawJd`. If a JD explicitly offers `Rp 8.000.000 - 12.000.000` while the candidate's non-negotiable minimum is `Rp 25.000.000`, the engine does not flag this obvious dealbreaker.

## Proposed Change

Implement an Indonesian & International salary regex parser in `job-hunter.ts` to identify salary figures (e.g. `15 - 20 jt`, `Rp 20.000.000`, `$120k`). If maximum stated salary is below `profile.minSalary`, flag a compensation dealbreaker and deduct appropriate fit points.

## Answer

Implemented `extractStatedSalary` in `frontend/src/lib/job-hunter.ts` with regex support for Indonesian formats (`15 - 20 jt`, `Rp 20.000.000`). If stated max salary is lower than `profile.minSalary`, it automatically triggers a dealbreaker (`Stated max compensation below your minimum`), lowers the fit score, and displays clear pros/cons in the UI. Verified in production build.
