# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project identity

Internal name: **IVhome**. Public user-facing brand: **Nadom / Надом**. Use IVhome in package names, migrations, and technical contexts only. Nadom is an aggregator and matching service — not a clinic. It does not diagnose, prescribe, recommend IV composition, or promise medical results.

## Current priority — 2026-06-09 Nadom Tone of Voice source hierarchy

For Nadom / Надом Tone of Voice, UI-copy, microcopy, Telegram Bot text, Telegram Mini App text, landing copy, medservice cards, CTA, safety/status messages, Claude Design AI prompts, and Codex prompts, use this primary active TOV source first:

```text
docs/tone-of-voice/final_tone_of_voice.md
```

Original source document / export for verification:

```text
Тон оф войс для Claude.docx
```

Then read the hierarchy and supporting-reference rules in:

```text
docs/tone-of-voice/README.md
```

For Nadom / Надом product, legal, safety, UX research, and implementation context, read:

```text
docs/nadom/source-of-truth/current/00_NADOM_CURRENT_PROJECT_INSTRUCTION_2026_06_05.md
docs/nadom/source-of-truth/current/01_NADOM_UX_TOV_RECOMMENDED_MICROCOPY_2026_06_05.md
docs/nadom/source-of-truth/current/02_DEEP_RESEARCH_REPORT_2026_06_05.md
```

`docs/nadom/source-of-truth/current/03_NADOM_FINAL_TOV_COPY_SYSTEM_2026_06_05.md` is a supporting archived reference. Do not use it as the primary TOV source when it conflicts with `docs/tone-of-voice/final_tone_of_voice.md`. Older Nadom / IVhome docs are archive/reference only unless explicitly requested.

## Commands

```bash
# Local setup
cp .env.example .env
pnpm install
docker compose up -d postgres
pnpm db:migrate
pnpm db:seed
pnpm dev                     # builds shared first, then runs all apps in parallel

# Individual commands
pnpm lint
pnpm typecheck
pnpm build
pnpm test                    # runs tests in all packages with test scripts

# Run tests for a single app
pnpm --filter @ivhome/api test
node --import tsx --test apps/api/test/mvp-dev-api.test.ts

# Database
pnpm db:migrate:dev -- --name describe_your_change   # create a new migration
pnpm db:migrate              # apply committed migrations
pnpm db:seed                 # idempotent fake data for local dev
pnpm db:generate             # regenerate Prisma client after schema changes
pnpm db:validate
pnpm db:studio
```

Local URLs: API `http://localhost:3000`, Mini App `http://localhost:5173`, Dashboard `http://localhost:5174`.

## Workspace layout

```
apps/
  api/            Fastify 5 backend (Node ESM, TypeScript, tsx for dev)
  mini-app/       Telegram Mini App (React 19, Vite)
  dashboard/      Internal dashboard with /admin and /clinic routes (React 19, Vite)
  telegram-bot/   Telegram Bot (Node ESM, TypeScript)
packages/
  shared/         Shared TypeScript types exported to all apps
prisma/
  schema.prisma   Prisma data model (PostgreSQL)
  seed.ts         Idempotent fake data (fake license numbers, masked contacts)
docs/nadom/       Product, wording, visual, and privacy rules (read before UI work)
```

`@ivhome/shared` must be built before the other apps — `pnpm dev` handles this automatically.

## API structure (`apps/api`)

- **`src/app.ts`** — `buildApp()` registers all Fastify routes and CORS.
- **`src/server.ts`** — entry point, binds the server.
- **`src/telegram/init-data.ts`** — Telegram `initData` HMAC validation.

Routes:
- `GET /health/live` and `GET /health/ready` — process-level health checks.
- `POST /telegram/init-data/validate` — validates signed Telegram Mini App `initData`. Returns only `{ valid: true|false }`. Never logs or echoes `initData`.
- `GET|POST|PATCH /mvp/dev/*` — preview-only in-memory contract, gated behind `ENABLE_MVP_DEV_API=true`. The in-memory request store resets on restart; this is not production persistence.

## Data model key concepts

The Prisma schema models the full aggregator lifecycle:

- `User` + `TelegramIdentity` — patient identity, Telegram-linked.
- `Clinic` + `ClinicLicense` + `ClinicMembership` — medical organizations and their staff (`CLINIC_OPERATOR`, `CLINIC_AUTHORIZED_STAFF`, `CLINIC_ADMIN`).
- `ServiceRequest` → `Quote` → `Booking` — the core request lifecycle.
- `EmergencyScreening` — hard-stop safeguard; `SCREENING_BLOCKED` stops the flow without diagnosis.
- `PartnerLead` + `PartnerContactChannel` — manual lead routing to clinics via `TELEGRAM`, `WHATSAPP`, `PHONE`, `EMAIL`, or `DASHBOARD`.
- `AuditLog` + `OutboxEvent` — audit trail and event outbox.
- `SlaEvent` — tracks `CLINIC_FIRST_RESPONSE`, `CLINIC_CONFIRMATION`, `ARRIVAL`, `COMPLETION` separately; never combine or blur these two SLA phases in UI or data.

Sensitive fields (`phoneEncrypted`, `addressEncrypted`, `valueEncrypted`, etc.) are encrypted at the application layer — the schema stores ciphertext only.

## Product and wording rules

Read `docs/nadom/project-rules.md`, `docs/nadom/public-wording.md`, and `docs/nadom/privacy-security.md` before tasks that touch user-facing copy, new routes, or data handling.

**Forbidden public terms:** `анонимная капельница`, `полная анонимность`, `лечим`, `назначаем`, `врач Надом`, `наш врач`, `наш партнёр`, `служба` as default term, urgency/FOMO phrases.

**Preferred terms:** `медицинская организация`, `выбранная организация`, `медицинский специалист`, `выездная бригада`, `предложение`, `вариант`.

Hard-stop emergency copy (no emoji): `при таких симптомах выезд на дом может быть небезопасен. пожалуйста, обратитесь за экстренной помощью: 103 или 112`

The clinic-side role is `CLINIC_AUTHORIZED_STAFF`; UI copy must say `уполномоченный сотрудник медслужбы`.

## Visual style (UI/frontend work)

Before any UI/visual change, inspect available references in this order:
1. `docs/nadom/references/Выполнение промта по проекту - Claude.html`
2. `docs/nadom/references/saved_resource*.html`
3. `docs/nadom/references/visual/` (PNG files)

Core style: soft pastel, Telegram-native. Main accent `#7EB8D4`. Rounded cards and buttons. Bubble/chat UI where relevant. Do not introduce a generic SaaS or AI gradient style.

Symbols: 🫧 onboarding · 🪽 visit/movement · 🩵 support/final · 🧊 waiting · ⋆✦⊹ list markers. No emoji in hard-stop or legally sensitive messages.

## Privacy and security constraints

- Never log or echo Telegram `initData`, phone numbers, exact addresses, tokens, or medical details.
- Validate Telegram `initData` before trusting Mini App data.
- Collect phone numbers and exact addresses only when the selected organization needs them for confirmed follow-up.
- Do not add AI diagnosis, automatic IV composition selection, real medical-record storage, payments, or CRM integrations to the MVP.
- Never commit `.env`, secrets, bot tokens, real personal data, or medical details.

## PR conventions

- Open PRs as **draft** unless explicitly told otherwise. Do not merge.
- Keep PRs small and scoped. Do not change the Prisma schema or package scripts unless explicitly requested.
- Before opening: run `pnpm lint`, `pnpm typecheck`, and the relevant test command.
