# Specification: Offer Comparison, THP Simulator & Workflow Automation

## 1. Context & Motivation
Engineering professionals navigating multiple interview funnels and job offers encounter high friction when evaluating total compensation and dealing with recruiter ghosting. 

In Indonesia and Southeast Asia, engineering compensation is rarely just basic salary:
- Variable allowances (On-Call 24/7 duty, shift allowances for SRE/DevOps) significantly alter actual earnings.
- Tax changes (PPh 21 TER 2024 PMK 168/2023) and statutory social security deductions (BPJS Ketenagakerjaan JHT & JP, BPJS Kesehatan) lead to gross vs. net disparities.
- Vendor/outsource arrangements (PKWT contracts) carry unique risks regarding severance compensation (PP 35/2021), bench salary, and client buyout clauses.
- Recruiter ghosting requires structured, polite follow-up cadences.

## 2. Requirements & Deliverables

### A. Offer Comparison & THP Simulator
- Real-time Indonesian PPh 21 TER 2024 calculation based on PTKP status (Kategori A, B, C) and custom contractor tax overrides.
- BPJS Ketenagakerjaan (JHT 2%, JP 1% with max wage cap) and BPJS Kesehatan (1% with max wage cap).
- Breakdown of base salary, fixed allowances, variable engineering allowances (On-Call, Shift, WFH).
- Annualized compensation including statutory THR and target performance bonuses.
- Side-by-side comparison of up to 3 candidate packages.
- Real Take Home Pay calculation factoring in commute and WFO expenses.

### B. Smart Follow-Up Generator (Anti-Ghosting Nudge)
- Detects applications exceeding the configured ghosting threshold.
- Generates context-aware, professional follow-up templates in Indonesian and English across Email, LinkedIn InMail, and WhatsApp.
- Actionable tracking: single-click copy, quick `mailto:`, and automatic logging of `recruiter_contacted` events in `ApplicationEvents`.

### C. Vendor vs. In-house Placement Risk Checker
- Audit matrix for IT vendor/outsource agreements:
  - PP 35/2021 PKWT compensation clause
  - Bench salary policy
  - Overtime/on-call SPKL clause
  - Workstation / dev laptop provision
  - Client direct-hire buyout restrictions
  - BPJS reported wage integrity
- Generates a Contract Risk Score (0-100) and tailored negotiation talking points.

## 3. Architecture Alignment
- Pure deterministic calculators in `frontend/src/lib/`.
- Zero-token leakage: calculations run client-side without sending sensitive salary data to external LLMs.
- Safe state progression: follow-up updates log monotonic events without downgrading application status.
