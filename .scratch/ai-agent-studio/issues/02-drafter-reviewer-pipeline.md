# Issue 02: Two-Agent Drafter-Reviewer Studio

Status: closed

## Description
Implement the two-agent quality loop from `ai-job-search /apply`. Separates creation from critique: Agent 1 drafts the tailored application letter; Agent 2 audits ATS keywords, flags lack of metrics, and removes generic AI slop.

## Acceptance Criteria
- [x] Agent 1 (Drafter) produces tailored pitch and CV alignment
- [x] Agent 2 (Reviewer) audits ATS keyword match percentage, impact metrics, and tone
- [x] Reviewer generates actionable critique and refined final draft
- [x] Seamless transition to promote as an active Application

## Comments
Implementation completed in `frontend/src/lib/ai-agent-studio.ts` and `frontend/src/features/ai-agent-studio/AiAgentStudioView.tsx`. Verified with 0 build errors.
