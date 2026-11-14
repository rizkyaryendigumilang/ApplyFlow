# Issue 03: Connect Frontend Job Hunter to Server-Side AI Proxy Endpoint

Status: ready-for-agent
Type: task

## Description

The backend now exposes `POST /api/junction/hunter/analyze`, but the frontend `JobHunterView.tsx` currently computes evaluations purely client-side without attempting to leverage the backend proxy when online.

## Proposed Change

Allow `JobHunterView.tsx` and `useJobLeads.ts` to call `/api/junction/hunter/analyze` when connected to PocketBase, with graceful fallback to local client-side evaluation if offline.
