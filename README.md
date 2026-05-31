# IVhome

IVhome is an MVP Telegram Mini App and Telegram Bot for comparing licensed
at-home medical service partners in Moscow. The platform is an aggregator: it
does not provide medical services, diagnose, prescribe treatment, or recommend
medication or IV composition.

## PR 1 Scope

This foundation stage intentionally contains no business logic. It adds:

- a `pnpm` monorepo;
- a Fastify API with process-level health checks;
- placeholder React apps for the Telegram Mini App and internal dashboard;
- a placeholder Telegram Bot package;
- a shared package;
- PostgreSQL in Docker Compose;
- a Prisma entry point for the schema work in PR 2;
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

PR 2 will add `PartnerLead` or `LeadTransfer` and `PartnerContactChannel` data
models. Supported contact channels are planned as `TELEGRAM`, `WHATSAPP`,
`PHONE`, `EMAIL`, and `DASHBOARD`, so early partners can process leads manually.

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
  schema.prisma   Prisma entry point; models arrive in PR 2
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

`/health/ready` is process-level in PR 1. Database connectivity will be added
when Prisma models are introduced.

## Scripts

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm build
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
