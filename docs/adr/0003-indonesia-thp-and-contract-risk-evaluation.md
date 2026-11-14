# ADR 0003: Deterministic Indonesian THP Calculation and Contract Risk Evaluation

## Status
Accepted

## Context
Engineering compensation in Indonesia involves multiple variables beyond base pay:
1. Statutory PPh 21 TER (Tarif Efektif Rata-rata 2024 per PMK 168/2023).
2. Social security deductions under BPJS Ketenagakerjaan (JHT 2%, JP 1% with statutory wage ceiling) and BPJS Kesehatan (1% with statutory wage ceiling).
3. IT-specific allowances: 24/7 on-call duty, night shift rotations, and remote work stipends.
4. Statutory THR (Tunjangan Hari Raya) under Indonesian labor law (PP 36/2021).
5. Vendor/outsource placements under PKWT agreements requiring statutory severance compensation under PP 35/2021.

## Decision
- Implement pure client-side deterministic calculation engines for THP and contract risk in `frontend/src/lib/`.
- Never send candidate financial data or contract clauses to external LLM APIs; evaluate all tax brackets, deduction caps, and risk rules with deterministic logic.
- Model real net compensation by deducting commute/WFO costs from gross monthly income to evaluate effective Take Home Pay.

## Consequences
- Guarantees instantaneous, 100% reproducible compensation simulations without external API latency or cost.
- Preserves candidate financial privacy (Zero-Token Leakage).
- Allows engineers to compare competing offers side-by-side with statutory compliance.
