# IVhome

IVhome is an MVP Telegram Mini App and Telegram Bot for comparing licensed
at-home medical service partners in Moscow. The platform is an aggregator: it
does not provide medical services, diagnose, prescribe treatment, or recommend
medication or IV composition.

## PR 4 Scope

This Telegram integration stage adds the first safe launch boundary. The
repository now includes:

- a `pnpm` monorepo;
- a Fastify API with process-level health checks;
- placeholder React apps for the Telegram Mini App and internal dashboard;
- a Telegram Bot `/start` entry point;
- a shared Telegram Mini App `initData` validation helper;
- a process-level API route for Telegram launch-data validation;
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
  telegram-bot/   Telegram Bot entry point
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

## Telegram Launch Boundary

The Telegram Bot reads its token only from `TELEGRAM_BOT_TOKEN`. If
`TELEGRAM_WEBAPP_URL` is set, `/start` includes an inline button that opens the
Telegram Mini App. Tokens, raw Telegram updates, raw `initData`, and Telegram
payloads must not be logged.

The API exposes a process-level launch validation endpoint:

```http
POST /telegram/validate-init-data
```

Request body:

```json
{ "initData": "<raw Telegram Mini App initData>" }
```

The endpoint validates Telegram Mini App launch data with the shared HMAC
SHA-256 helper. It returns a generic invalid response for rejected launch data,
returns `503` when `TELEGRAM_BOT_TOKEN` is not configured, and returns only a
minimal parsed Telegram identity when validation succeeds.

This boundary does not persist Telegram users, does not write to the database,
does not collect phone numbers or addresses, and does not add request creation,
matching, offers, medical triage, diagnosis, treatment recommendations, or IV
composition logic.

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
pnpm test
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
