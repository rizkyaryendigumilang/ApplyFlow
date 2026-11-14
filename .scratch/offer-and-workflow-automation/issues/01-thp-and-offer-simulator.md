# Issue 01: Indonesian THP & Offer Comparison Simulator

Status: closed

## Description
Implement the deterministic Indonesian Take Home Pay (THP) calculation engine supporting PMK 168/2023 TER (Tarif Efektif Rata-rata) 2024, BPJS statutory caps, on-call/shift allowances, and a side-by-side comparison interface.

## Acceptance Criteria
- [x] Accurate PPh 21 TER 2024 calculation for monthly gross brackets
- [x] Accurate BPJS JHT (2%), JP (1% capped at Rp 10.042.300), and BPJS Kesehatan (1% capped at Rp 12.000.000)
- [x] Support for engineering allowances: On-Call, Shift, WFH, Fixed transport
- [x] Annualized calculation including mandatory THR (1x base) and bonus months
- [x] Side-by-side comparator component comparing up to 3 offer packages with real THP (deducting commute/WFO costs)

## Comments
Implementation completed in `frontend/src/lib/thp-calculator.ts` and UI in `frontend/src/features/offer-calculator/OfferComparatorView.tsx`. Verified with 0 build errors.
