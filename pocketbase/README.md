# PocketBase bootstrap

The compose service keeps the PocketBase admin at `http://localhost:8090/_/` on the host loopback interface. The public frontend proxies only `/api/` to PocketBase, so the admin UI is not exposed through the public frontend.
On a fresh instance, the versioned migration in `pb_migrations` creates the auth and application collections automatically when PocketBase starts. `pb_schema.json` remains available for manual import or inspection. Existing installations should take a backup and review the owner rules before applying schema changes.

For production, keep `pb_data` on a persistent volume. In the included compose setup, the frontend uses `VITE_POCKETBASE_URL=/` and Nginx proxies `/api/` to PocketBase, so the browser does not need a separate backend origin. Do not expose the superuser credentials to the frontend.

## Operations
- Nginx rate-limits password auth, password reset, and Telegram login per client IP before forwarding to PocketBase. The Telegram hook also keeps a small in-process safety limit; for multiple frontend replicas, use a shared edge rate limiter.
- Use the PocketBase backup API or Dashboard backup controls on a schedule, and copy backups to storage outside the host. A persistent Docker volume alone is not a backup.
- The production migration schedules local backups daily at 02:00 and keeps seven copies in the separate `pb_backups` volume. Copy those archives off-host or configure PocketBase S3 backup storage for disaster recovery.
- Monitor the container health check and rotate logs; compose caps each service at three 10 MB log files.
- The image defaults to `linux_amd64`. For ARM hosts, set `PB_ARCH` and the matching release checksum in `.env` before building.
- The Telegram custom route accepts only guest requests, has a 16 KiB body limit, and rejects payloads older than five minutes. Keep `TELEGRAM_BOT_TOKEN` server-side only.

## Social login configuration

- In PocketBase Admin → Settings → Auth providers, configure Google and GitHub with their client ID/secret and callback URL pointing to your PocketBase origin.
- Set `VITE_TELEGRAM_BOT_USERNAME` in the frontend environment and `TELEGRAM_BOT_TOKEN` only on the PocketBase service. Configure the Telegram bot domain to match the public frontend host.
- Telegram is verified server-side in `pb_hooks/main.pb.js`; the bot token is never sent to the browser.
- Set `REQUIRE_EMAIL_VERIFICATION=true` only after SMTP is configured and the verification email flow has been tested. The default remains `false` so local preview registration is not locked out.
- Run the contract test against a disposable/staging instance with `PB_TEST_URL`, `PB_TEST_EMAIL_A`, `PB_TEST_PASSWORD_A`, `PB_TEST_EMAIL_B`, and `PB_TEST_PASSWORD_B` set.
- On Windows, `pwsh -File scripts/pocketbase-smoke.ps1` downloads the pinned binary, runs the contract test in an isolated temp data directory, and removes it afterward.
