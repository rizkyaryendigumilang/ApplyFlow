# Issue 02: Smart Follow-Up Generator (Anti-Ghosting Nudge)

Status: closed

## Description
Provide a contextual follow-up message generator for applications in `Applied`, `Viewed`, `Screening`, and `Interview` stages that exceed the ghosting threshold.

## Acceptance Criteria
- [x] Multi-channel templates: Email, LinkedIn InMail, WhatsApp
- [x] Bilingual generation: Indonesian & English
- [x] Three strategic tones: Polite Inquiry, Value-Add, and Closing Check-in
- [x] One-click clipboard copy and `mailto:` link launcher
- [x] Integration with `ApplicationEvents` logging `recruiter_contacted` and updating `nextFollowUp`

## Comments
Implementation completed in `frontend/src/lib/follow-up-generator.ts` and `frontend/src/features/application-detail/FollowUpModal.tsx`. Seamlessly integrated into Application Drawer and Follow-Up Radar.
