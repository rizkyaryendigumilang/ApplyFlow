# Issue 03: Vendor vs. In-house Placement Risk Checker

Status: closed

## Description
Provide a contract risk audit tool evaluating employment agreements against Indonesian labor laws and IT outsourcing industry norms (PP 35/2021, bench salary, SPKL overtime, hardware, and client transfer clauses).

## Acceptance Criteria
- [x] Matrix evaluating PP 35/2021 PKWT compensation, bench salary, overtime/on-call SPKL, hardware provision, and client buyout clauses
- [x] Normalized Risk Index (0-100) and severity rating (Low, Moderate, High)
- [x] Actionable negotiation checklist and questions for HR before signing
- [x] Accessible from Application Drawer and Offer Comparison view

## Comments
Implementation completed in `frontend/src/lib/vendor-risk-evaluator.ts` and `frontend/src/features/application-detail/VendorRiskModal.tsx`. Integrated into OfferComparatorView and ApplicationDrawer.
