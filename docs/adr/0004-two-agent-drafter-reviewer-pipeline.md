# ADR 0004: Two-Agent Drafter-Reviewer Quality Loop & STAR Simulator

## Status
Accepted

## Context
Standard AI application generation tools rely on a single-prompt pass, which often produces generic, hyperbolic, AI-sounding cover letters ("testament to my passion", "tapestry of experiences") that fail ATS parser checks and lack measurable technical proof. The open-source `ai-job-search` project resolves this via a two-agent architecture:
1. Agent 1 (Drafter) creates the first tailored draft.
2. Agent 2 (Reviewer) audits company alignment, ATS keyword density, removes AI slop, and ensures every key claim has measurable engineering impact.

## Decision
- Introduce an autonomous `AI Agent Studio` module into Junction Career CRM.
- Implement a two-agent quality pipeline:
  - Agent 1 synthesizes candidate experience into a targeted letter.
  - Agent 2 conducts a 3-point audit: ATS Keyword Coverage, Quantified Impact Evidence, and Human Tone / Anti-Slop verification.
- Provide a structured STAR interview preparation simulator mapping job requirements into Situation, Task, Action, and Result talking points.

## Consequences
- Elevates application quality from generic AI copy to verified, high-conversion technical pitches.
- Increases candidate interview readiness with deterministic STAR frameworks.
- Preserves full privacy and multi-tenant security within the browser client.
