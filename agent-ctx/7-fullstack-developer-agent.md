# Task 7 - Fullstack Developer Agent

## Task: Make Admin settings persist to DB, real API keys, real webhooks, real auto-escalation

### Work Done

1. **Added Setting model to Prisma schema** - `id`, `key` (unique), `value`, `createdAt`, `updatedAt`. Ran `db:push` successfully.

2. **Created `/src/lib/settings-db.ts`** - Raw SQL helper for Setting table. Uses `db.$queryRaw` and `db.$executeRaw` to work around stale PrismaClient model accessor issue in dev server. Functions: `getAllSettings()`, `upsertSetting(key, value)`, `getSetting(key)`.

3. **Created `/src/app/api/settings/route.ts`** - GET/PUT endpoints. GET returns all settings as key-value with defaults. PUT upserts settings (admin-only). Auto-generates API key on first GET.

4. **Updated `/src/components/admin/admin-view.tsx`** - Replaced localStorage with API calls. Settings loaded from `/api/settings` on mount. Save button persists to DB. API key regeneration saves immediately. Added loading/saving states.

5. **Updated `/src/lib/auth-middleware.ts`** - Added `validateApiKey()` async function. Checks X-API-Key header or apiKey query param. Validates against DB via `getSetting('api_key')`.

6. **Created `/src/lib/webhook.ts`** - `fireWebhook()` helper. Reads webhook URL from DB. Fires real HTTP POST with 5s timeout. Payload: `{ event, data, timestamp, source: 'verishield' }`.

7. **Created `/src/app/api/webhook/fire/route.ts`** - POST endpoint. Reads webhook URL from DB, fires HTTP POST, returns result.

8. **Created `/src/app/api/escalation/check/route.ts`** - POST endpoint (admin-only). Reads escalation settings from DB. Queries old pending/in_progress records. Updates risk level, adds notes, creates notifications, fires webhooks.

9. **Updated `/src/components/dashboard/dashboard-view.tsx`** - Added "Escalations" button near API Delay toggle. Shows toast with escalation results.

10. **Updated `/src/app/api/records/route.ts`** - Added POST handler for creating records. Fires `verification.created` webhook.

11. **Updated `/src/app/api/users/route.ts`** - Fires `user.created` webhook after user creation.

12. **Updated `/src/lib/api.ts`** - Added `settingsApi` and `escalationApi` clients.

### Key Technical Decision

Used raw SQL (`db.$queryRaw`/`db.$executeRaw`) via `settings-db.ts` for all Setting table access. This was necessary because the Next.js dev server caches the PrismaClient in `globalThis`, and when the Setting model was added after the server started, the cached client doesn't have the `setting` model accessor (`db.setting` is `undefined`). Raw SQL works fine through the stale client since it doesn't depend on model definitions.

### Files Created
- `/src/lib/settings-db.ts`
- `/src/lib/webhook.ts`
- `/src/app/api/settings/route.ts`
- `/src/app/api/webhook/fire/route.ts`
- `/src/app/api/escalation/check/route.ts`

### Files Modified
- `/prisma/schema.prisma` - Added Setting model
- `/src/components/admin/admin-view.tsx` - DB persistence for settings
- `/src/components/dashboard/dashboard-view.tsx` - Escalation button
- `/src/lib/auth-middleware.ts` - validateApiKey function
- `/src/lib/api.ts` - settingsApi, escalationApi clients
- `/src/app/api/records/route.ts` - POST handler + webhook firing
- `/src/app/api/users/route.ts` - Webhook firing on user creation

### Test Results
- `bun run lint` passes clean
- Settings GET/PUT tested and working via curl
- Escalation check tested: escalated 6 records successfully
- Webhook fire tested: fires real HTTP POST to configured URL
