# Career CRM & Job Hunter Domain Glossary

Unified domain vocabulary for the Career CRM, Job Hunter AI engine, and recruitment pipeline automation.

## Language

### Job Hunter Context

**Candidate Profile**:
The authoritative record of an applicant's professional identity, target job roles, core competencies, minimum acceptable compensation, and non-negotiable boundaries.
_Avoid_: User settings, resume config, account preferences

**Job Lead**:
An unvetted employment opportunity identified from external sources (JobStreet, LinkedIn, direct referral) undergoing triage before formal application.
_Avoid_: Vacancy, job posting, opportunity, prospect

**Two-Tier Triage**:
The sequential evaluation protocol where Tier 1 immediately rejects leads with dealbreakers or red flags, and Tier 2 calculates multidimensional fit scores and skill gaps.
_Avoid_: Screening, filtering, basic check

**Dealbreaker**:
A non-negotiable negative attribute in a job description (e.g., gambling/slot/casino/judi online, unpaid overtime, compulsory 6-day on-site work) that triggers immediate lead rejection.
_Avoid_: Blacklist, red flag, negative tag

**Fit Score**:
A normalized 0–100 integer metric quantifying the alignment between a candidate's profile and a job description based on role title match, tech skill coverage, work mode, and compensation threshold.
_Avoid_: ATS grade, match percentage, ranking

**Lead Promotion**:
The workflow bridge transitioning a vetted `JobLead` (`status: 'shortlisted'`) into an active `Application` record while pre-populating an `ApplyFlowDraft`.
_Avoid_: Conversion, migration, import

### Pipeline CRM Context

**Application**:
An active pursuit of an employment position tracked through a canonical state machine from initial interest through final offer or closure.
_Avoid_: Job card, entry, tracker item

**Application Event**:
An immutable, chronological milestone or activity recorded against an application (e.g., email viewed, recruiter contacted, interview invited, offer received).
_Avoid_: Audit log, history item, activity note

**Recruitment Notification**:
An external alert parsed from recruitment platforms or incoming Gmail messages that maps to an application event.
_Avoid_: Ingested email, system alert, webhook payload

**Take Home Pay (THP)**:
The net compensation realized after deducting Indonesian statutory taxes (PPh 21), healthcare/employment social security (BPJS Kesehatan & Ketenagakerjaan), combined with on-call and shift allowances.
_Avoid_: Nett salary, take-home, cash in hand

**TER (Tarif Efektif Rata-rata)**:
The official Indonesian PPh 21 monthly withholding tax schedule under PMK 168/2023 categorized by PTKP status (Kategori A, B, C).
_Avoid_: Flat tax, rough estimate, income bracket

**Vendor Risk Index**:
A 0–100 risk score assessing Indonesian IT outsourcing contract terms against statutory protections (PP 35/2021 severance, bench salary, SPKL overtime, hardware, and client transfer penalties).
_Avoid_: Outsource penalty, contractor score

**Smart Follow-Up Nudge**:
A context-aware communication generator crafted across Email, LinkedIn InMail, and WhatsApp to re-engage recruiters after reaching the ghosting threshold.
_Avoid_: Reminder ping, follow-up template, poke

### Communications & Documents Context

**Harvard ATS Resume**:
An unslop, single-column resume formatted strictly under Ivy League / Harvard typographic standards with zero tables, textboxes, or multi-column CSS floats, engineered for 100% parser pass rates in Workday, Taleo, Greenhouse, and Lever.
_Avoid_: Canva CV, visual resume, design template

**Morning Career Briefing**:
An automated mobile-first dispatch sent to Telegram (scheduled at 08:30 WIB) aggregating a candidate's daily active pipeline, 48-hour interview schedule, anti-ghosting follow-up alerts, and high-match AI leads.
_Avoid_: Daily digest, notification email, bot spam
_Avoid_: Spam ping, cold outreach, generic follow-up

**Two-Agent Reviewer Loop**:
An autonomous quality assurance protocol where a primary Drafter Agent generates tailored application artifacts and a secondary Reviewer Agent rigorously critiques ATS keyword density, quantified impact proof, and anti-slop copy fidelity before dispatch.
_Avoid_: Proofreading, auto-correct, prompt chaining

**STAR Framework Blueprint**:
A structured interview response model articulating Situation (context), Task (objective), Action (specific engineering methodologies), and Result (quantifiable technical impact).
_Avoid_: Generic answer, interview script, speech

**ATS Keyword Density**:
The ratio of required technical tools, libraries, and architectural concepts from a job description present in an applicant's tailored submission.
_Avoid_: Word count, keyword stuffing, buzzword ratio
