# 2. Safe State Transition Hierarchy for External Recruitment Alerts

We decided to enforce a monotonic status progression hierarchy in server-side hooks (`main.pb.js`) to guarantee that asynchronous or delayed recruitment email notifications never downgrade an application's advancement in the CRM.

## Context

Email notification alerts from platforms like JobStreet often arrive out of chronological order (e.g., an "Employer viewed your application" notification email arriving 3 days after an interview has already been scheduled and logged by the candidate). Without server-side guards, automated email ingestion could revert an application status from `Interview` back to `Viewed`.

## Decision

We instituted an integer rank hierarchy for CRM states:
$$\text{Wishlist (0)} < \text{Applied (1)} < \text{Viewed (2)} < \text{Screening (3)} < \text{Interview (4)} < \text{Offer (5)}$$

When an incoming `application_event` is recorded:
1. `employer_viewed` promotes status only if current rank $\le 1$ (`Wishlist` or `Applied`).
2. `recruiter_contacted` / `screening_started` promotes status only if current rank $< 3$.
3. `interview_invited` promotes status only if current rank $< 4$.
4. `offer_received` promotes status to `Offer`.
5. `rejection_received` changes status to `Rejected` unless the application already reached `Offer`.

## Consequences

- Automated JobStreet and Gmail ingestion can run safely in the background without user fear of CRM regression.
- Manual candidate updates take precedence over delayed automated webhook/email alerts.
