# ADR-0006: 1-Click Printable ATS Resume Formatter and Telegram Morning Career Briefing

## Status
Accepted

## Context
Candidates applying to technical and corporate opportunities face two major bottlenecks:
1. **Resume ATS Rejection**: Many visual templates created in design tools (e.g. Canva) use multi-column CSS tables, textboxes, and graphics that fail or scramble in Applicant Tracking Systems (Workday, Greenhouse, Lever, Taleo, and JobStreet ATS).
2. **Notification Friction & Inactivity (Ghosting)**: Candidates frequently miss interview notifications, forget to send follow-up inquiries, or suffer from application ghosting because they do not log into the web dashboard every day. In Indonesia, mobile-first messengers (Telegram) have near-100% daily open rates compared to web dashboards.

## Decision

### 1. 1-Click Printable ATS Resume Formatter (Harvard / Tech Standard)
- **Zero-Table Single-Column Standard**: Enforces single-column, standard semantic hierarchy (`h1`, `h2`, `h3`, `p`, `ul`, `li`) strictly compliant with Ivy League / Harvard Resume Guidelines.
- **Dedicated `@media print` Isolation**: The print stylesheet hides all application chrome, navigation, backdrops, and modal buttons. When `window.print()` is invoked, the document outputs an immaculate, vector-sharp A4/Letter PDF with zero visual clipping or blank second pages (`page-break-inside: avoid`).
- **Live ATS Auditor**: Computes real-time ATS parse compliance (0–100) along 4 dimensions:
  1. Contact completeness (Email, Phone, City, LinkedIn, GitHub).
  2. Standard section headers (`PROFESSIONAL SUMMARY`, `TECHNICAL SKILLS`, `PROFESSIONAL EXPERIENCE`, `EDUCATION`, `CERTIFICATIONS`).
  3. Quantifiable impact density (detects `%`, `$`, `k`, `M`, and metric verbs).
  4. Keyword matching against the target job posting / JD.
- **Export Versatility**: 1-click Print/PDF, 1-click Copy ATS Plaintext, and 1-click Export to GitHub Flavored Markdown.

### 2. Telegram Webhook & Morning Career Briefing Engine
- **Mobile-First Delivery**: Integrates direct messaging and webhook endpoints to Telegram (`/api/junction/telegram/send` and server cron `daily_telegram_briefing` scheduled at 08:30 WIB).
- **Daily Morning Briefing Format**: Formatted in Telegram HTML with 5 critical operational sections:
  1. Active Pipeline Status (Wishlist, Viewed, Interview, Offer).
  2. Scheduled Interviews for the next 48 hours.
  3. Actionable Follow-Up & Anti-Ghosting warnings (applications inactive $\ge 14$ days).
  4. Top High-Match AI Job Hunter Leads ($>80\%$ fit).
  5. Daily career tip.
- **Configurable Credentials**: Supports custom bot tokens via Telegram `@BotFather` and Chat IDs via `@userinfobot`, with built-in instant test ping and instant morning briefing preview.

## Consequences
- **Candidate Advantage**: Significantly higher ATS pass rates on corporate portals and zero missed interview deadlines.
- **Security & Privacy**: Telegram bot tokens are stored in user preferences or server environment variables; no candidate PII is sent to unauthorized external endpoints.
