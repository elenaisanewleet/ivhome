# IVhome

IVhome is an MVP Telegram Mini App and Telegram Bot for comparing licensed
at-home medical service partners in Moscow. The platform is an aggregator: it
does not provide medical services, diagnose, prescribe treatment, or recommend
medication or IV composition.

## PR 2 Scope

This database-modeling stage intentionally contains no business logic. The
repository now includes:

- a `pnpm` monorepo;
- a Fastify API with process-level health checks;
- placeholder React apps for the Telegram Mini App and internal dashboard;
- a placeholder Telegram Bot package;
- a shared package;
- PostgreSQL in Docker Compose;
- the Prisma data model for the MVP aggregator;
- idempotent fake seed data for local development;
- baseline security notes.

## Simplified MVP Architecture

The internal tools are one React application with role-based routes:

- `/admin` for platform staff;
- `/clinic` for partner staff.

The route boundaries and backend modules should remain separable so the two
interfaces can become standalone applications later if needed.

The partner-side request-review role is `CLINIC_AUTHORIZED_STAFF`. UI copy must
say "уполномоченный сотрудник партнёра" and must not imply that IVhome verifies
the medical qualification of a specific person.

The schema includes `PartnerLead` and `PartnerContactChannel` models. Supported
contact channels are `TELEGRAM`, `WHATSAPP`, `PHONE`, `EMAIL`, and `DASHBOARD`,
so early partners can process leads manually in later workflow PRs.

The MVP excludes online payments, acquiring, automatic license verification,
telemedicine, AI recommendations, and CRM integrations.

## Workspace Layout

```text
apps/
  api/            Fastify backend
  dashboard/      shared internal dashboard with /admin and /clinic routes
  mini-app/       Telegram Mini App
  telegram-bot/   Telegram Bot placeholder
packages/
  shared/         shared TypeScript package
prisma/
  migrations/      committed PostgreSQL migrations
  schema.prisma   Prisma data model
  seed.ts         idempotent fake local-development data
```

## Requirements

- Node.js 20 or newer
- `pnpm` 10.12.4
- Docker with Docker Compose for PostgreSQL

## Local Setup

```bash
cp .env.example .env
pnpm install
docker compose up -d postgres
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The local URLs are:

- API: `http://localhost:3000`
- Telegram Mini App: `http://localhost:5173`
- internal dashboard: `http://localhost:5174`

## Health Checks

```bash
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
```

`/health/ready` is still process-level. Database connectivity will be added in
a later backend PR.

## Telegram Entry Point

Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBAPP_URL` outside source control to
enable the Telegram Bot `/start` entry point. The Bot replies with a Nadom
Mini App button. The API validates signed, current Telegram Mini App `initData`
without logging it:

```text
POST /telegram/init-data/validate
{ "initData": "<window.Telegram.WebApp.initData>" }
```

The API returns only `{ "valid": true }` or `{ "valid": false }`; it does not
echo Telegram data or expose validation-failure details.

## Mini App MVP Integration Contract

The Mini App keeps a fully walkable local fallback when `VITE_API_BASE_URL` is
unset. For controlled MVP previews, the API exposes a gated in-memory contract:

```text
GET  /mvp/dev/offers
POST /mvp/dev/requests
GET  /mvp/dev/requests/:requestId/status
```

Set `ENABLE_MVP_DEV_API=true` to enable these routes. The request endpoint
accepts only `offerId`, `district`, `desiredTime`, and `profile`. It rejects
extra fields and does not accept chat content, phone numbers, exact addresses,
raw Telegram data, or medical details.

This is preview scaffolding, not production persistence or authentication.
Before real traffic, replace the in-memory store with an approved authenticated
workflow and complete the security work listed in [SECURITY.md](./SECURITY.md).

## Database

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Create and apply a development migration after changing the schema:

```bash
pnpm db:migrate:dev -- --name describe_your_change
```

Apply committed migrations in an environment:

```bash
pnpm db:migrate
```

Seed local development data, validate the schema, and generate the Prisma
client:

```bash
pnpm db:seed
pnpm db:validate
pnpm db:generate
```

The seed is idempotent and contains fake data only: demo partners, fake license
numbers, masked or placeholder contact values, and placeholder encrypted
values. It must never be treated as production data.

## Scripts

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
pnpm db:migrate
pnpm db:migrate:dev -- --name describe_your_change
pnpm db:seed
pnpm db:studio
pnpm db:validate
pnpm db:generate
```

## Incremental Delivery Plan

1. Monorepo, Docker Compose, PostgreSQL, Prisma entry point, API health check.
2. Prisma schema and fake seed data.
3. Telegram `initData` validation and basic Bot `/start`.
4. Mini App consent, emergency screening, service category, location, time.
5. Matching and offers list.
6. Request submission and manual clinic or admin confirmation.
7. Price lock and status tracking.
8. Simple role-based internal dashboard.
9. Audit logs and security hardening.

See [SECURITY.md](./SECURITY.md) for prototype limits and production TODOs.

## Deployment / Replit

The committed `.replit` file prepares an API deployment. It does not publish
anything automatically and it does not contain secrets.

For an API preview in Replit Publishing:

1. Import this repository and select an Autoscale or Reserved VM web-server
   deployment.
2. Use the committed build command:
   `pnpm install --frozen-lockfile && pnpm --filter @ivhome/api... build`.
3. Use the committed run command: `pnpm --filter @ivhome/api start`.
4. Add `DATABASE_URL`, `CORS_ORIGINS`, and `ENABLE_MVP_DEV_API=true` as
   deployment environment values for a controlled preview. Do not enable the
   dev API for real user traffic.
5. Verify `GET /health/live` and `GET /health/ready` on the published API URL.

Publish the Mini App separately as a Static Deployment:

1. Add `VITE_API_BASE_URL=https://<api-subdomain>.replit.app` and an optional
   HTTPS `VITE_SUPPORT_URL` as build environment values.
2. Use build command:
   `pnpm install --frozen-lockfile && pnpm --filter @ivhome/mini-app build`.
3. Use public directory: `apps/mini-app/dist`.
4. Set `TELEGRAM_WEBAPP_URL` to the published Mini App HTTPS URL for the bot.

The long-polling Telegram Bot should be published separately as a Reserved VM
background worker with `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBAPP_URL` supplied
through Replit secrets. Use build command
`pnpm install --frozen-lockfile && pnpm --filter @ivhome/telegram-bot build`
and run command `pnpm --filter @ivhome/telegram-bot start`.
