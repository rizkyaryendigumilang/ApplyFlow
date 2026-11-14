# AI Job Hunter Audit & Enhancement Spec

Spec for auditing and hardening the AI Job Hunter module in accordance with Matt Pocock's domain modeling and engineering skill standards.

## Objective

Elevate the Job Hunter engine from static regex matching to an adaptive, domain-aligned Career Ops evaluation engine that deterministically triages leads, matches dynamic candidate skills, catches salary dealbreakers, and bridges vetted leads seamlessly into ApplyFlow.

## Domain Model Alignments

- **Entities:** `CandidateProfile` -> `JobLead` (with `JobLeadEvaluation`) -> `ApplyFlowDraft` -> `Application`.
- **Glossary Compliance:** Ensure terminology in UI, TypeScript types, and database collections follows `GLOSSARY.md`.
- **Architecture Invariants:** Two-Tier Triage architecture as codified in `docs/adr/0001-ai-job-hunter-two-tier-triage.md`.
