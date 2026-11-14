import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const schema = await readFile(new URL('../pocketbase/pb_schema.json', import.meta.url), 'utf8');
const hooks = await readFile(new URL('../pocketbase/pb_hooks/main.pb.js', import.meta.url), 'utf8');
const settingsMigration = await readFile(new URL('../pocketbase/pb_migrations/1710000002_production_settings.js', import.meta.url), 'utf8');
const nginx = await readFile(new URL('../frontend/nginx.conf', import.meta.url), 'utf8');
const authScreen = await readFile(new URL('../frontend/src/components/AuthScreen.tsx', import.meta.url), 'utf8');

assert.match(schema, /"allowOAuth2Auth":\s*true/);
assert.match(schema, /cvArtifact\.owner = @request\.auth\.id/);
assert.match(hooks, /TELEGRAM_BOT_TOKEN/);
assert.match(hooks, /\$security\.hs256/);
assert.match(hooks, /auth_date/);
assert.match(hooks, /onRecordBeforeCreateRequest/);
assert.match(hooks, /requireGuestOnly/);
assert.match(hooks, /bodyLimit\(16 \* 1024\)/);
assert.match(hooks, /cv_artifacts/);
assert.match(settingsMigration, /settings\.backups\.cron/);
assert.match(nginx, /limit_req_zone/);
assert.match(nginx, /auth-with-password/);
assert.match(nginx, /request-password-reset/);
assert.match(nginx, /junction\/telegram/);
assert.match(authScreen, /authWithOAuth2/);
assert.match(authScreen, /requestPasswordReset/);
assert.match(authScreen, /onTelegramAuth/);
console.log('auth config ok: OAuth, password reset, and Telegram verification are wired');
