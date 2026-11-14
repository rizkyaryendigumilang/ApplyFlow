# Design Document: LinkedIn Assistant & Referral Command Center

- **Topic:** LinkedIn Outreach & Referral Command Center
- **Date:** 2026-11-14
- **Status:** Draft for Review
- **Author:** Antigravity Agent & User

---

## 1. Intent & The Why

Securing job interviews through cold job portal applications has historically low conversion rates (< 3%). Referral outreach to internal peers, hiring managers, and technical recruiters at target companies increases interview call rates by 4x to 8x. 

However, job seekers struggle with four major friction points:
1. **Target Paralysis:** Not knowing how to quickly find the right internal contacts or recruiters at a specific target company.
2. **Blank-Page Anxiety & AI Slop:** Writing cold messages that sound generic, robotic, or overly verbose (full of AI tells like em-dashes `—` and passive voice).
3. **Account Risk / Ban Fear:** LinkedIn limits weekly connection invitations and penalizes accounts that trigger bot or spam detection.
4. **Disorganized Tracking:** Sending messages on LinkedIn and forgetting to log the contact and follow-up deadline in their tracker.

This feature adds a dedicated **"LinkedIn Assistant"** workspace to the Career CRM, empowering users to execute daily safe, high-converting outreach, leverage deep-link filters, compose natural first-person messages, and sync contacts seamlessly with the existing Networking CRM.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **G1:** Dedicated top-level module view (`LinkedInAssistantView`) accessible directly from the main sidebar.
- **G2:** Target Company Deep-Linker: 1-click generation of exact, pre-filtered LinkedIn search URLs for any selected application/company (1st-degree peers, recruiters, engineering managers).
- **G3:** Anti-Slop AI Outreach Composer: Generates high-converting first-person messages tailored to 3 distinct personas:
  - *Internal Peer / Alum (1st Degree):* Requesting a warm referral or coffee chat.
  - *Technical Recruiter / Talent Acquisition (2nd Degree):* Direct candidacy pitch with role alignment.
  - *Engineering Lead / Hiring Manager (2nd Degree):* Value-driven problem-solving intro.
- **G4:** Anti-Slop Enforcement: Strict adherence to natural human voice—no em-dashes (`—`), active 1st-person phrasing, concise (< 100 words for DMs, < 300 characters for connection notes).
- **G5:** Safe Weekly Quota Tracker: Visual progress bar and safety meter tracking connection invites sent this week (recommended cap: 25–30/week) to safeguard LinkedIn account reputation.
- **G6:** 1-Click Sync to Networking CRM: Instantly log the contact to the `professional_contacts` table with an automatic +5 day follow-up reminder.
- **G7:** LinkedIn Profile & Headline Polish: Generates 3 ATS-aligned headline options and a concise "About" summary based on the user's Candidate Profile.

### Non-Goals
- Automated headless browser scraping or DOM botting inside external LinkedIn tabs (violates LinkedIn terms, causes bot bans, requires brittle Chrome extensions).
- Replacing the general `Networking CRM` (Networking CRM remains the long-term relationship and headhunter database).

### Anti-Goals
- Generating boilerplate spam templates that read like marketing outreach.
- Allowing background bots to automatically send messages without human approval and manual review.

---

## 3. Constraints

- **Web Sandbox / CORS:** A browser-based web application cannot directly click buttons or read private DOM nodes of `linkedin.com` without a dedicated browser extension. Deep-links + 1-click clipboard copy is the most reliable, 100% ban-proof architecture.
- **Tone & Slop Rules:** Must never output em-dashes (`—`). Must output strictly in 1st person ("I", "Saya").
- **Language Support:** Bilingual support (Indonesian and English) for both domestic and multinational/remote outreach.
- **Data Integrity:** Must integrate cleanly with existing PocketBase collections (`applications`, `candidate_profiles`, `professional_contacts`).

---

## 4. Approaches Considered

### Approach 1: Sub-tab inside Networking CRM
Embed a "LinkedIn Tools" tab inside the existing `features/networking/NetworkingView.tsx`.
- *Pros:* Keeps all contact-related features under one roof.
- *Cons:* Less visible as a daily workflow command center; cluttering the contacts table view with outreach generators, deep-links, and profile polishers.

### Approach 2: Standalone Top-Level Menu "LinkedIn Assistant" (Chosen)
A dedicated module in the sidebar (`linkedin`) that acts as a daily command center.
- *Pros:* Clean separation of concerns; high visibility; clear daily habit loop (Select target company -> Deep-link to search -> Generate message -> Copy & Send -> Log to CRM); accommodates profile polisher and quota tracker comfortably.
- *Cons:* Adds 1 item to the sidebar navigation.
- *Verdict:* **Chosen**. Matches the user's desire for a dedicated "LinkedIn Assistant" inspired by the reference repository.

### Approach 3: Headless Browser Driver Daemon
Build a local Puppeteer/Selenium service to mimic the original repo's Chrome extension.
- *Pros:* Fully automated clicks.
- *Cons:* High probability of LinkedIn account restrictions/bans; complex multi-process architecture; poor mobile/PWA experience.
- *Verdict:* **Rejected**.

---

## 5. System Architecture & UI Design

### Component Tree
```
frontend/src/features/linkedin-assistant/
├── LinkedInAssistantView.tsx       # Main orchestrator view (tabs: Outreach Command Center, Profile Polisher)
├── CompanyDeepLinkCard.tsx         # Target company selector & pre-filtered LinkedIn search buttons
├── OutreachComposerCard.tsx        # Persona selector, tone toggle, draft viewer, 1-click copy & sync
├── SafeQuotaTrackerCard.tsx        # Weekly connection counter, reset timer, safe-zone indicator
├── ProfilePolisherCard.tsx         # Headline & About section enhancer from Candidate Profile
└── linkedin-templates.ts           # Anti-slop prompt templates & heuristic generators (ID & EN)
```

### Data Integration
- Reads target companies from `useApplications` (Wishlist & Applied statuses highlighted).
- Reads candidate name, skills, and current role from `useCandidateProfile`.
- Creates new contacts via `useProfessionalContacts.addContact()`.
- Stores weekly quota counter in `localStorage` (`career_crm_linkedin_quota_v1`), tracking count and week-commencing date.

---

## 6. Settled Builder Decisions & Technical Specifications

- **Message Generation Engine:** Implemented as a high-fidelity, deterministic client-side template & interpolation engine (`linkedin-templates.ts`). It pulls live variables from `useCandidateProfile` (name, skills, current role, years of experience) and target job data from `useApplications`. This ensures instant generation with 0ms latency, zero API token cost, zero failure rate, and full offline/PWA compatibility.
- **Company Input Flexibility:** In addition to selecting from existing `applications` (Wishlist / Applied), users can type any custom target company and role.
- **Sync to Networking CRM Flow:** Clicking "Log to Networking CRM" prompts for contact name (optional fallback: "Recruiter / Peer at [Company]"), records `interaction_type = 'LinkedIn Outreach'`, `status = 'Outreach Sent'`, links to `company`, attaches the drafted message to `notes`, and automatically schedules `next_follow_up` to `today + 5 days`.
- **Safe Quota Tracker Storage:** Stored in `localStorage` under `career_crm_linkedin_quota_v1` with automatic rolling weekly reset (every Monday 00:00).
- **Navigation Integration:** Added as a distinct menu item in sidebar (`Module = 'linkedin'`) with a clean professional icon (`Share2` / `Send`).

---

## 7. Approval & Next Steps

Once this design document is approved by the user, the next step is invoking `superpowers:writing-plans` to generate the step-by-step implementation plan.
