# Nadom — Operations Checklist

Internal code: IVhome. Public brand: Наdom / Надом.

---

## Environment Variables

### API (Render web service: `nadom-api-preview`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ADMIN_TOKEN` | Yes (prod) | Secret token for `/mvp/admin/*` routes. If absent and `ENABLE_MVP_DEV_API=true`, admin routes are open (local dev only). |
| `ENABLE_MVP_DEV_API` | Optional | Set `true` to enable in-memory preview routes `/mvp/dev/*`. Also disables admin token requirement if `ADMIN_TOKEN` is absent. |
| `CLINIC_AUTH_ENABLED` | Optional | Set `true` to validate `X-Clinic-Id` against Clinic rows in DB. When `false`, any ID is accepted (local dev). |
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

### 1. Apply migrations

```bash
pnpm db:migrate
```

This applies all committed migrations under `prisma/migrations/`, including `20260603000000_add_mvp_request_and_chat` which adds:
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
   - **Preview-заявки** — in-memory requests (via `/mvp/dev/requests`, requires `ENABLE_MVP_DEV_API=true`).

---

## How to Open the Clinic Dashboard

1. Navigate to `http://localhost:5174/clinic`.
2. Enter the **Clinic ID** (the `id` field from the `Clinic` table, e.g. `medservice-north`) in the token form.
   - Or set `VITE_CLINIC_TOKEN=medservice-north` in `.env`.
3. The dashboard shows all `MvpRequest` rows where `clinicId` matches.
   - If `CLINIC_AUTH_ENABLED=true`, the API validates the clinic ID exists in DB.

---

## How to Test a Request from the Mini App

1. Start all services: `pnpm dev`.
2. Open `http://localhost:5173` in a browser.
3. Complete the onboarding flow: profile → district → time → select medservice.
4. Click "Оставить заявку" on an offer.
5. The request is created via `POST /mvp/dev/requests` (in-memory) or `POST /mvp/requests` (Postgres if wired).
6. Check the admin dashboard at `http://localhost:5174/admin` to see the new request.
7. Change the status in the dashboard and refresh the Mini App status screen.

---

## Migration / Deploy Commands (Render)

```bash
# Apply migrations on Render (run as a pre-deploy step or one-off job)
pnpm db:migrate

# Seed (only needed once per environment, idempotent)
pnpm db:seed

# Validate schema locally
pnpm db:validate

# Generate Prisma client after schema changes
pnpm db:generate
```

---

## Known Limitations (MVP)

- **No real auth**: Admin and clinic routes use a single static bearer token. Multi-user auth is a follow-up.
- **No file upload**: License scan upload is stubbed with a TODO in `OnboardingForm.tsx`.
- **In-memory requests reset on restart**: The `/mvp/dev/*` store is in-memory. The new `/mvp/requests` store is persistent.
- **Mini App still uses `/mvp/dev/requests`** for the `createMvpRequest` flow (backward compat). New `submitRequest()` function in `api.ts` uses the persistent endpoint but is not wired to the UI flow yet.
- **No bot integration with DB**: The Telegram bot sends status notifications but is not yet wired to `MvpRequest` status changes.
- **No chat UI in Mini App**: Chat API endpoints exist but the Mini App chat UI uses local-only state. Wiring to DB chat is a follow-up.
- **Offers are static**: `/mvp/offers` returns hardcoded offers. Dynamic DB-driven offers are a follow-up.
- **No HTTPS enforcement**: Enforce HTTPS and set `Secure` cookies in production.
