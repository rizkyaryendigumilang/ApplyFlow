# Spec: LinkedIn Assistant & Referral Command Center

Status: ready-for-agent
Related: docs/superpowers/specs/2026-11-14-linkedin-assistant-design.md

### Summary of Decisions
- **View:** `frontend/src/features/linkedin-assistant/LinkedInAssistantView.tsx`
- **Module ID:** `linkedin` in `App.tsx`
- **Core Tabs:**
  1. **Outreach Command Center:**
     - Target Company Deep-Linker (1st-degree peers, Recruiters, Hiring Managers)
     - Anti-Slop AI Outreach Composer (Peer Referral, Recruiter Intro, Hiring Manager Chat)
     - Safe Weekly Quota Tracker (Safe indicator, reset every Monday)
     - 1-Click Sync to Networking CRM (`professional_contacts` with +5 days follow-up)
  2. **Profile & Headline Polisher:**
     - Generates 3 ATS/Search-optimized LinkedIn headlines & "About" summary from Candidate Profile.
- **Engine:** Client-side template & interpolation engine (`linkedin-templates.ts`), 0ms latency, zero API costs, full PWA compatibility.
