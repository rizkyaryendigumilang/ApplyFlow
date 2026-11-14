# Career CRM & Job Tracker Agent Guidelines

This repository contains a full-stack, production-ready Career CRM & Funnel Analytics Engine built with React (Vite + TypeScript + Tailwind CSS) on the frontend and PocketBase (Go + SQLite) on the backend.

## Agent skills

### Issue tracker

Local markdown files in `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context layout (`GLOSSARY.md` + `docs/adr/`). See `docs/agents/domain.md`.

## Architecture Principles

- **Single Source of Truth:** PocketBase SQLite schema (`pb_schema.json` and migrations) dictates collection rules; strict multi-tenant isolation via `owner = @request.auth.id`.
- **Zero-Token Leakage:** OAuth tokens (`accessToken`, `refreshToken`) on `gmail_connections` are encrypted at rest with AES-256 and stripped from client HTTP responses.
- **Safe State Progression:** State machine follows strict monotonic hierarchy (`Wishlist < Applied < Viewed < Screening < Interview < Offer`); late notifications never downgrade progress.
- **Deterministic Triage:** Job Hunter uses two-tier evaluation (dealbreaker screening + skill gap fit scoring) before lead promotion.
