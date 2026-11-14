# 1. AI Job Hunter Two-Tier Triage Architecture

We decided to structure job lead evaluation as a sequential two-tier triage process (Tier 1 deterministic heuristic rule-screening followed by Tier 2 deep skill-gap and compensation scoring) rather than a single black-box LLM prompt.

## Context

Job descriptions frequently contain immediate disqualifiers (e.g., predatory gambling/judi online operations, severe salary mismatches, rigid uncompensated overtime) that do not require expensive LLM inferences to identify. Running full generative AI evaluation on every unvetted job lead burns unnecessary token quotas and introduces nondeterministic hallucinations on strict boundaries.

## Decision

1. **Tier 1 (Instant Dealbreaker Filter):** Regex and heuristic matching immediately checks against candidate dealbreakers and basic criteria. Any match flags the lead as `triage_rejected` with a `dealbreaker` tier in sub-millisecond time.
2. **Tier 2 (Fit Evaluation & Strategic Pitch):** Only leads clearing Tier 1 undergo deep keyword extraction, skill gap calculation, and strategic positioning generation.
3. **Execution Boundary:** Evaluation runs client-side with full offline/LocalStorage support, backed by an optional server-side proxy endpoint (`/api/junction/hunter/analyze`) when API keys are secured on the backend.

## Consequences

- Zero API costs for filtering spam, predatory vacancies, and irrelevant roles.
- Deterministic explainability: candidates see exact missing skills and flagged dealbreaker phrases.
- Seamless one-click promotion into ApplyFlow drafts with pre-matched CV artifacts.
