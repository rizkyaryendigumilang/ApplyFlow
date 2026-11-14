# ApplyFlow

> **Private Career CRM & Monotonic Funnel Pipeline**  
> Full-stack Career Operating System built with React 18 (Vite + TypeScript + Tailwind CSS), PocketBase (Go + SQLite in WAL mode), and Capacitor (Android APK & iOS IPA).

---

## 🌟 Key Capabilities

1. **Monotonic Funnel Hierarchy**
   - Strictly enforces safe application progression (`Wishlist < Applied < Viewed < Screening < Interview < Offer`).
   - Late or out-of-order recruiter notifications preserve forward state progression without regression.

2. **Indonesia Statutory THP & Offer Calculator (2024)**
   - Computes realistic net take-home pay based on official PPh 21 TER (PP 58/2023 & PMK 168/2023) across Categories A, B, and C.
   - Deducts BPJS Ketenagakerjaan (JHT, JP with statutory wage ceiling) and BPJS Kesehatan.
   - Evaluates vendor outsourcing risk vs in-house placement.

3. **Harvard ATS Resume Formatter**
   - 1-click semantic single-column resume formatted to pass Taleo, Workday, and greenhouse parsers.
   - 1-click printable PDF view (`@media print`) and plaintext clipboard export.

4. **Two-Tier Triage Job Hunter**
   - Tier 1: Strict dealbreaker filter (salary floor, blacklist companies, remote/hybrid mode).
   - Tier 2: Dynamic skill extraction and fit score analysis.

5. **Telegram Autonomous Briefing**
   - Daily morning briefing at 08:30 WIB summarizing applications needing follow-up, upcoming interviews within 48 hours, and high-match job leads.
   - Instant webhook notification on interview invites and job offers.

6. **Zero-Token Leakage Security**
   - All OAuth tokens (`accessToken`, `refreshToken`) encrypted at rest via AES-256.
   - Tokens stripped from all client HTTP responses; strict multi-tenant boundary enforced via `owner = @request.auth.id`.

---

## 🚀 Mobile & VPS GitHub Actions Workflows

This repository includes production CI/CD workflows matching modern deployment standards:

| Workflow File | Purpose | Triggers |
| :--- | :--- | :--- |
| [build-and-sync-vps.yml](.github/workflows/build-and-sync-vps.yml) | Compiles Android APK (`assembleDebug`) & iOS IPA (`xcodebuild archive`), uploads GitHub artifacts, and optionally syncs to VPS download directory via SSH/SCP. | `workflow_dispatch`, `push` on mobile paths |
| [ci-cd-web-vps.yml](.github/workflows/ci-cd-web-vps.yml) | Runs 39 unit tests, validates PocketBase schema and auth hooks, packages web distribution, and enables guarded deployment to VPS. | `push`, `pull_request`, `workflow_dispatch` |

### Required GitHub Repository Secrets (for VPS sync)

To enable automatic artifact synchronization to your VPS, configure the following secrets in **Settings > Secrets and variables > Actions**:

* `VPS_HOST`: VPS IP address or domain (e.g. `43.156.x.x`).
* `VPS_SSH_KEY`: Private SSH Key (ed25519 or rsa) with access to the VPS.
* `VPS_USERNAME`: SSH username (defaults to `ubuntu`).
* `VPS_PORT`: SSH port (defaults to `22` or `2222`).
* `VPS_TARGET_DIR`: Target path on VPS (e.g. `/srv/www/applyflow`).
* `VITE_POCKETBASE_URL`: Production PocketBase backend URL.

> **Safety Notice:** Automatic deployment to VPS in `ci-cd-web-vps.yml` is guarded by default (`deploy_to_vps: false`). It will only execute when explicitly triggered by you.

---

## 💻 Local Development

### Prerequisites
- Node.js 20+ (recommended: Node.js 22)
- PocketBase 0.22+

### 1. Install Dependencies
```bash
# Root & mobile dependencies
npm install

# Frontend web dependencies
npm --prefix frontend install
```

### 2. Run Test Suite
```bash
npm test
```
*Runs 39 unit tests covering radar calculations, anti-slop sanitizer, quota status, URL sanitization, THP calculator, and PocketBase schema contract.*

### 3. Build Web Bundle
```bash
npm run build
```

### 4. Sync Mobile Platforms (Capacitor)
```bash
npm run cap:sync
```

---

## 🛡️ License

MIT License. Designed and crafted with clean, human-centered UI/UX standards.
