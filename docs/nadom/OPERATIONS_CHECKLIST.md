# Nadom — Operations Checklist

Internal code: IVhome. Public brand: Nadom / Надом.

---

## Environment Variables

### API (Render web service: `nadom-api`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ADMIN_TOKEN` | Yes (prod) | Secret token for `/mvp/admin/*` routes. If absent and `ENABLE_MVP_DEV_API=true`, admin routes are open (local dev only). |
| `ENABLE_MVP_DEV_API` | Optional | Set `true` to enable in-memory preview routes `/mvp/dev/*`. Also disables admin token requirement if `ADMIN_TOKEN` is absent. |
| `CLINIC_AUTH_ENABLED` | Optional | Set `true` to validate `X-Clinic-Id` against Clinic rows in DB. When `false`, any non-empty ID is accepted and only request scoping limits access. Use `true` for pilot unless intentionally testing locally. |
| `TELEGRAM_BOT_TOKEN` | Yes (bot) | Telegram bot token for init-data validation and bot commands. |
| `CORS_ORIGINS` | Yes (prod) | Comma-separated list of allowed origins, e.g. `https://nadom.app,https://dashboard.nadom.app` |
| `HOST` | Optional | Bind address, default `0.0.0.0` |
| `PORT` | Optional | Port, default `3000` |

### Mini App (Render static: `nadom-mini-app-preview`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Full URL of the API, e.g. `https://nadom-api.onrender.com` |
| `VITE_SUPPORT_URL` | Optional | HTTPS URL for the support chat button |

### Dashboard (Render static: `nadom-dashboard-preview`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | Yes | Full URL of the API |
| `VITE_ADMIN_TOKEN` | Optional | Pre-fills the admin token automatically (skip the login form). Do not set in shared/public builds. |
| `VITE_CLINIC_TOKEN` | Optional | Pre-fills the clinic ID automatically for the `/clinic` route. |

### Bot (Render worker: `nadom-telegram-bot-preview`)

| Variable | Required | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Yes | Bot token |
| `TELEGRAM_WEBAPP_URL` | Yes | Public URL of the Mini App |

---

## First-Time Setup

Current Render state:

- PR #33 and PR #34 have already been merged into `main`.
- Render PostgreSQL database `nadom-db` exists.
- `DATABASE_URL` is configured on the Render `nadom-api` service.
- `ADMIN_TOKEN` is configured on the Render `nadom-api` service.
- Migration `20260603000000_add_mvp_request_and_chat` has already been applied on Render.
- `pnpm db:seed` and `pnpm db:generate` have been run on Render.
- `POST /mvp/requests` returns `201` on Render and Mini App requests persist in Postgres.

For a brand-new environment, run these commands in the Render Shell for `nadom-api`:

```bash
pnpm db:migrate
pnpm db:seed
pnpm db:generate
```

### 1. Apply migrations

This applies all committed migrations under `prisma/migrations/`. On the current Render environment,
`20260603000000_add_mvp_request_and_chat` is already applied and adds:
- `MvpRequest` — persistent request records
- `MvpChatMessage` — request chat messages
- `MvpOnboarding` — medservice onboarding questionnaire

### 2. Seed demo data

```bash
pnpm db:seed
```

Creates:
- 3 legacy demo clinics (`demo-clinic-*`)
- 3 MVP medservices matching Mini App offer IDs:
  - `medservice-north` — Медслужба «Север» (САО, СЗАО, СВАО)
  - `medservice-center` — Медслужба «Центр» (ЦАО, ЗАО, ЮЗАО)
  - `medservice-night` — Медслужба «Ночь» (вся Москва)
- Licenses, offers, areas, demo patient, demo booking

### 3. Generate Prisma client (after schema changes)

```bash
pnpm db:generate
```

---

## How to Create a New Medservice

1. Open the DB (via `pnpm db:studio` or direct SQL).
2. Insert a row into `Clinic` with a unique `id`, `inn`, `legalName`, `publicName`, `status = ACTIVE`.
3. Insert a `ClinicLicense` row with `licenseNumber`, `status = VERIFIED`.
4. Insert `ClinicServiceOffer` rows linking the clinic to service categories.
5. Insert `ClinicServiceArea` rows with district codes.
6. Or run the seed again after adding the clinic to `prisma/seed.ts`.

To fill the onboarding questionnaire via dashboard:
- Navigate to `/admin/onboarding/<clinicId>` in the admin dashboard.
- Fill all sections and click "Отправить на проверку".

---

## How to Open the Admin Dashboard

1. Deploy or run locally: `pnpm dev` (starts dashboard at `http://localhost:5174`).
2. Navigate to `http://localhost:5174/admin`.
3. Enter the `ADMIN_TOKEN` value in the token input form.
   - Or set `VITE_ADMIN_TOKEN` in `.env` to skip the login form locally.
4. The dashboard shows:
   - **DB-заявки** — persistent Postgres requests (via `/mvp/admin/requests`).
   - Request status actions via `/mvp/admin/requests/:id/status`.
   - Request chat view/replies via `/mvp/admin/requests/:id/chat`.
   - Links to `/admin/onboarding/<clinicId>` for each MVP medservice.
   - **Dev-заявки** — in-memory requests (via `/mvp/dev/requests`, requires `ENABLE_MVP_DEV_API=true`) only when legacy dev data exists.

---

## How to Open the Clinic Dashboard

1. Navigate to `http://localhost:5174/clinic`.
2. Enter the **Clinic ID** (the `id` field from the `Clinic` table, e.g. `medservice-north`) in the token form.
   - Or set `VITE_CLINIC_TOKEN=medservice-north` in `.env`.
3. The dashboard shows all `MvpRequest` rows where `clinicId` matches.
   - If `CLINIC_AUTH_ENABLED=true`, the API validates the clinic ID exists in DB.
4. The clinic dashboard can update status for its own requests and read/reply to its own request chat.

---

## How to Test a Request from the Mini App

1. Start all services: `pnpm dev`.
2. Open `http://localhost:5173` in a browser.
3. Complete the onboarding flow: profile → district → time → select medservice.
4. Confirm a selected offer.
5. The request is created via `POST /mvp/requests` and persisted as `MvpRequest`.
6. Check the admin dashboard at `http://localhost:5174/admin` to see the new request.
7. Check the clinic dashboard at `http://localhost:5174/clinic` with the selected clinic ID to see the same request.
8. Change the status, price range, ETA, or neutral operational note in admin or clinic dashboard.
9. Confirm the Mini App status screen updates by polling without a hard refresh.
10. Open the Mini App request chat after submission. Messages are stored via `POST /mvp/requests/:id/chat` and loaded via `GET /mvp/requests/:id/chat`.
11. Send a message from the user and reply from admin or clinic dashboard.
12. Confirm the Mini App chat updates by polling while the chat remains open.

---

## Migration / Deploy Commands (Render)

```bash
# Apply future migrations on Render as a one-off manual step.
# Do not run migrations automatically unless that deployment policy changes intentionally.
pnpm db:migrate

# Seed (only needed once per environment, idempotent)
pnpm db:seed

# Validate schema locally
pnpm db:validate

# Generate Prisma client after schema changes
pnpm db:generate
```

The API Render build command includes `pnpm db:generate` before the API TypeScript build so Prisma Client is
available even when Render starts from a fresh install cache. Migrations remain manual to avoid changing production
schema during an ordinary preview deploy.

## Pilot Security Gate

Before a real pilot with medservices:

1. Confirm `ADMIN_TOKEN` is set on `nadom-api-preview`; admin routes are closed without it.
2. Set `CLINIC_AUTH_ENABLED=true` on the API service after all pilot medservice rows exist in `Clinic`.
3. Keep `ENABLE_MVP_DEV_API=false` for pilot unless testing legacy in-memory routes intentionally.
4. Confirm `CORS_ORIGINS` contains only the deployed Mini App and dashboard origins.
5. Confirm `VITE_ADMIN_TOKEN` and `VITE_CLINIC_TOKEN` are not set in shared/public static builds.
6. Do not put phone numbers, exact addresses, or medical details in dashboard notes or chat test messages.

## Manual Pilot Smoke Test

1. Open Mini App.
2. Submit a request.
3. Open admin dashboard with `ADMIN_TOKEN`.
4. Verify the DB request appears.
5. Open clinic dashboard with the selected clinic ID.
6. Verify only that clinic's request appears.
7. User sends a neutral chat message from Mini App.
8. Medservice replies from the clinic dashboard.
9. Confirm Mini App chat updates without leaving the chat.
10. Admin or medservice updates status, price, and ETA.
11. Confirm Mini App status updates without hard refresh.
12. Open `/admin/onboarding/<clinicId>` and save draft/submitted.
13. Restart or redeploy API and verify the request still exists.

---

## Known Limitations (MVP)

- **No full account auth**: Admin routes use a single static bearer token. Clinic routes use `X-Clinic-Id`; when `CLINIC_AUTH_ENABLED=true`, the ID must exist, but this is still not proof of a real logged-in clinic user. Multi-user auth is a follow-up.
- **Clinic-ID MVP auth risk**: Anyone with a valid clinic ID and dashboard URL can act as that medservice in the MVP. Share IDs only with pilot operators and monitor request/chat changes manually.
- **Admin token handling**: Treat `ADMIN_TOKEN` as a production secret. Rotate it if it is shared in chat, screenshots, logs, or docs.
- **Dev API routes**: `/mvp/dev/*` must stay disabled for real pilot traffic. They are compatibility routes only and store data in memory.
- **No file upload**: License scan upload is stubbed with a TODO in `OnboardingForm.tsx`.
- **In-memory preview routes are compatibility-only**: The `/mvp/dev/*` store resets on restart and should be enabled only with `ENABLE_MVP_DEV_API=true` during local/dev checks.
- **Mini App uses persistent MVP requests by default**: offers load from `/mvp/offers`, request creation uses `/mvp/requests`, status reads `/mvp/requests/:id`, and post-submit chat uses `/mvp/requests/:id/chat`.
- **No bot integration with DB**: The Telegram bot sends status notifications but is not yet wired to `MvpRequest` status changes.
- **Bot notifications are helper-only**: neutral status/chat message text helpers exist, but automatic sends are not wired without safe user identity mapping.
- **No Telegram chat notifications**: Request chat content is stored in Postgres only and is not sent into Telegram messages/notifications.
- **Polling, not realtime sockets**: Mini App and dashboards poll chat/status during the pilot. WebSocket/SSE realtime is a follow-up.
- **Offers are static**: `/mvp/offers` returns hardcoded offers. Dynamic DB-driven offers are a follow-up.
- **No HTTPS enforcement**: Enforce HTTPS and set `Secure` cookies in production.
