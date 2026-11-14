# Specification: AI Agent Studio (ai-job-search Autonomous Pipeline)

## 1. Context & Motivation
Adopting the core local-first architectural paradigms of `ai-job-search-dev/ai-job-search`:
1. Batch job ranking (`/rank`) over single-item manual entry.
2. Two-Agent Drafter-Reviewer loop (`/apply`) ensuring tailored applications pass ATS keyword audits and sound authentically human (anti-slop).
3. STAR interview preparation engine (`/interview`) generating structured Situation-Task-Action-Result talking points based on target JDs.

## 2. Requirements & Deliverables

### A. Step 1: Batch Discovery & Multi-Job Ingest
- Ingest multiple job descriptions via URL list or bulk text delimiter (`---`).
- Load candidate master profile context automatically.

### B. Step 2: Batch Fit Ranker
- Multi-dimensional ranking rubric:
  - Technical skills match with tech equivalence graph (K8s = Kubernetes, GitLab CI = GitHub Actions, etc.).
  - Role seniority alignment.
  - Dealbreaker and compensation floor screening.
- Visual prioritization: Tier 1 (High Fit >= 80%), Tier 2 (Moderate 60-79%), Tier 3 (Borderline/Dealbreaker).

### C. Step 3: Two-Agent Drafter-Reviewer Studio
- **Agent 1 (Drafter):** Tailors cover letter and selects optimal CV artifact matching target responsibilities.
- **Agent 2 (Reviewer):** Audits ATS keyword density, checks quantified impact evidence, and enforces anti-slop copy rules.
- Reviewer critique with one-click revision application.

### D. Step 4: STAR Interview Preparation Simulator
- Synthesizes 4 high-probability interview questions:
  1. Technical Architecture & System Design
  2. Production Incident & Troubleshooting
  3. Behavioral & Stakeholder Conflict
  4. Cultural & Motivation Alignment
- Structured STAR blueprints (Situation, Task, Action, Result) referencing candidate background.
- Ability to save Q&A notes into application interview logs.

## 3. Architecture Alignment
- Clean modular view in `frontend/src/features/ai-agent-studio/AiAgentStudioView.tsx`.
- Deterministic evaluation and generation logic in `frontend/src/lib/ai-agent-studio.ts`.
- Zero-token leakage: executes client-side without transmitting candidate master data to unverified external endpoints.
