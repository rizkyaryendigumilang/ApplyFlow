# Design Document: Auto Job Scout & Platform Vacancy Radar

- **Topic:** Automated Job Discovery, Multi-Platform Query Radar, 1-Click Redirect, and Batch Pipeline Ingestion
- **Date:** 2026-11-16
- **Status:** Draft for Review
- **Author:** Antigravity Agent & User

---

## 1. Intent & The Why

Active job candidates frequently apply to dozens of relevant positions each week across major employment portals such as Jobstreet Indonesia, LinkedIn, and Glints. 

However, the existing Job Hunter tool enforces strict mandatory fields:
1. `Company Name` is strictly mandatory.
2. `Raw Job Description` is strictly mandatory.
3. Every single vacancy requires manual copy-pasting before any action can be taken.

This creates immense friction for candidates who want to rapidly scout opportunities matching their target roles, review compensation and requirements, redirect to the official application page with a single click, and seamlessly log the lead into their tracker without repetitive data entry.

This feature introduces **"Auto Job Scout"**, a dedicated top-level workspace in the Career CRM that:
- Connects directly to candidate profile targets (roles, skills, location, work mode).
- Formulates optimized search query feeds for Jobstreet Indonesia, LinkedIn, and regional portals.
- Displays scannable vacancy radar cards with fit indicators and compensation estimates.
- Enables 1-click external redirect to official application pages.
- Enables 1-click pipeline logging into the applicant tracking system with zero mandatory text inputs.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
- **G1:** Dedicated top-level sidebar navigation menu item **"Auto Job Scout"** (module id: `jobscout`) with a distinct icon (Compass / Radar).
- **G2:** Platform Query Adapter Engine supporting:
  - **Jobstreet Indonesia** (`id.jobstreet.com`) with role, location, and salary filter parameters.
  - **LinkedIn Jobs** (`linkedin.com/jobs`) with targeted keyword, geo-id, and remote flags.
  - **Glints Indonesia** (`glints.com/id`) with engineering and tech role filters.
- **G3:** Profile-Driven Role Presets: Automatically populates filters using `CandidateProfile.targetRoles` (e.g. Technical Consultant Analyst, Data Analyst, Data Engineer, DevOps) with option for custom keyword queries.
- **G4:** Scannable Vacancy Radar Interface:
  - Displays high-priority vacancies matching candidate profile.
  - Visual fit score pill (High Match >= 85%, Solid Fit 70-84%, Review Needed < 70%).
  - Salary range badge in Indonesian Rupiah (IDR).
  - Stated work arrangement (Remote, Hybrid, On-site).
- **G5:** 1-Click Action Flow:
  - **"Buka & Lamar di Platform"**: Opens target platform vacancy URL in a new browser tab.
  - **"+ Simpan ke Pipeline"**: Instantly saves vacancy into PocketBase `applications` table (status: `Wishlist` or `Applied`) without prompting for manual text input.
- **G6:** Direct URL Quick Ingestion:
  - Candidates can paste any platform link (e.g. `https://id.jobstreet.com/job/...`).
  - System extracts role, company, and location heuristics automatically without blocking on mandatory fields.
- **G7:** Twenty CRM Aesthetic: Neutral zinc design tokens (`zinc-100` to `zinc-950`), 1px borders, rounded-xl cards, font-mono numbers, and responsive desktop/mobile view.

### Non-Goals
- Headless browser botting or scraping that attempts to bypass Cloudflare Turnstile or Akamai bot protection on third-party sites (violates guidelines and triggers IP blocking).
- Replacing the existing single-vacancy `Job Hunter Evaluator & Fit Scoring` (which remains available for deep, multi-paragraph JD analysis).

### Anti-Goals
- Requiring mandatory company name or full JD text before allowing a candidate to browse or track a lead.
- Introducing AI slop or em-dashes in any generated text, logs, or code.

---

## 3. Constraints

- **Zero Em-Dashes:** Strictly forbid em-dash and en-dash characters across code, templates, and UI copy.
- **Data Isolation:** All new records saved to PocketBase `applications` or `job_leads` must belong to `@request.auth.id`.
- **Indonesian Currency Standard:** All salary figures and estimates must strictly display in IDR (`Rp`) format with thousand dot separators.
- **Sandboxed Navigation:** External job URLs must open with `rel="noreferrer noopener"` in new tabs.

---

## 4. Approaches Considered

### Approach 1 (Selected): Dedicated Sidebar Menu "Auto Job Scout"
Create a new standalone view component `AutoJobScoutView.tsx` accessible directly via the sidebar navigation under *Tools & Growth* (or *Workspace*).
- *Pros:* Complete freedom to design a high-velocity discovery and batch-application workflow without legacy single-item form constraints. Clear cognitive separation between bulk scouting vs deep ATS resume tailoring.
- *Cons:* Adds one additional item to the sidebar navigation.
- *Decision:* User explicitly selected this approach (Option A).

### Approach 2: Tab Inside Existing Job Hunter View
Add an "Auto Scout" tab alongside "Evaluator & Fit Scoring" and "Lead Pipeline".
- *Pros:* Keeps sidebar items unchanged.
- *Cons:* Conflates heavy manual triage with fast batch discovery; candidate has to click through nested tabs.

### Approach 3: Quick-Paste Bar in Spreadsheet Header
Add an inline URL input directly above the applications table.
- *Pros:* Minimal code footprint.
- *Cons:* Does not provide vacancy radar browsing, role filters, or multi-platform query generation.

---

## 5. System Architecture & Component Design

```
+-------------------------------------------------------------+
| Sidebar Navigation: "Auto Job Scout" (Compass Icon)        |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
| AutoJobScoutView.tsx                                        |
|                                                             |
|  [Platform Select: Jobstreet | LinkedIn | Glints]           |
|  [Role Presets from Candidate Profile | Custom Query]       |
|  [Location & Mode Filters: Remote | Hybrid | Jakarta]       |
|                                                             |
|  +-------------------------------------------------------+  |
|  | Launch Live Platform Search (Deep Query URL)           |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  [Quick Paste Job Link Box (Optional)]:                      |
|  (Paste any URL -> Auto-parsed card -> 1-Click Track)       |
|                                                             |
|  [Vacancy Radar Stream / Curated Opportunity Cards]:        |
|  +-------------------------------------------------------+  |
|  | Card: Title, Company, Location, Stated IDR Salary     |  |
|  | Fit Score Pill, Matching Skills Badges                |  |
|  | [Buka & Lamar di Jobstreet]  [+ Simpan ke Pipeline]   |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
                              |
       +----------------------+----------------------+
       |                                             |
       v                                             v
[External Tab: Jobstreet/LinkedIn]         [PocketBase: applications]
(Candidate completes application)          (Logged with 1-click status)
```

### 5.1 Query Builder (`job-scout-engine.ts`)
Generates exact, safe query URLs for platforms:
- **Jobstreet Indonesia:**
  - Base: `https://id.jobstreet.com/id/job-search/{query}-jobs/in-{location}`
  - Modifiers: work type, classification, sort by date.
- **LinkedIn Jobs:**
  - Base: `https://www.linkedin.com/jobs/search/?keywords={query}&location={location}`
  - Modifiers: `f_WT=2` (Remote), `f_TPR=r604800` (Past week).
- **Glints Indonesia:**
  - Base: `https://glints.com/id/opportunities/jobs/explore?keyword={query}&country=ID`

### 5.2 Preset Vacancy Radar
- Automatically seeds and refreshes curated, high-match tech leads tailored to the candidate's real profile (Technical Consultant Analyst, Data Analyst, Data Engineer, DevOps).
- Evaluates fit scores client-side against `CandidateProfile.skills` and `minSalary`.

### 5.3 1-Click Pipeline Ingestion
- Clicking `+ Simpan ke Pipeline` calls `addApplication` from `useApplications`:
  - `company`: Extracted company name or platform placeholder
  - `position`: Job title
  - `link`: Official job posting URL
  - `location`: Extracted location
  - `mode`: Remote / Hybrid / On-site
  - `status`: `Wishlist` (or `Applied` toggle)
  - `salaryMin` / `salaryMax`: Extracted compensation
  - `salaryPeriod`: `monthly`

---

## 6. Implementation Plan & File Touchpoints

1. **Frontend Architecture:**
   - Create `frontend/src/features/job-scout/AutoJobScoutView.tsx`.
   - Create `frontend/src/lib/job-scout-engine.ts` with platform query adapters, vacancy seeds, and URL parser.
   - Update `frontend/src/App.tsx`:
     - Add `jobscout` to `Module` type.
     - Add sidebar button under *Workspace* (with `Compass` icon).
     - Wire view routing to render `<AutoJobScoutView />`.
   - Update `frontend/src/lib/i18n.ts`:
     - Add Indonesian and English translation keys (`nav.jobscout`: `Auto Job Scout`).
2. **Quality & Verification:**
   - Write unit tests in `frontend/src/lib/__tests__/job-scout-engine.test.ts`.
   - Validate 100% clean TypeScript build with `npm run frontend:build`.
   - Run unit test suite with `npm test`.
