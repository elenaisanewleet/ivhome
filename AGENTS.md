# AGENTS.md — IVhome / Nadom

You are working in the IVhome repository.

Internal repo/project name: **IVhome**.
Public user-facing brand: **Nadom / Надом**.

## Current priority — 2026-06-05 Nadom source of truth

For Nadom / Надом tasks, read first:

```text
docs/nadom/source-of-truth/current/00_NADOM_CURRENT_PROJECT_INSTRUCTION_2026_06_05.md
```

Then:

```text
docs/nadom/source-of-truth/current/01_NADOM_UX_TOV_RECOMMENDED_MICROCOPY_2026_06_05.md
```

Then:

```text
docs/nadom/source-of-truth/current/02_DEEP_RESEARCH_REPORT_2026_06_05.md
```

Then, as the main implementation copy source:

```text
docs/nadom/source-of-truth/current/03_NADOM_FINAL_TOV_COPY_SYSTEM_2026_06_05.md
```

These current files override older Nadom / IVhome instructions when they conflict. Older docs are archive/reference only unless explicitly requested.

Before any task, follow these rules.

## 1. Read the relevant Nadom docs first

Start with the files that match the task:

- Product / legal / safety: `docs/nadom/project-rules.md`
- Public copy and wording: `docs/nadom/public-wording.md`
- UI / visual / frontend: `docs/nadom/visual-system.md`
- Privacy / security: `docs/nadom/privacy-security.md`
- PR review checklist: `docs/nadom/pr-review-checklist.md`
- Operations / deploy / smoke tests: `docs/nadom/OPERATIONS_CHECKLIST.md`

If a referenced file is missing, use the closest current file under `docs/nadom/` and state what was unavailable.

## 2. Current source priority

Use this priority order when sources conflict:

1. Current repo docs under `docs/nadom/`, especially `project-rules.md`, `public-wording.md`, `visual-system.md`, `privacy-security.md`, and `OPERATIONS_CHECKLIST.md`.
2. Current design package, if present: `docs/nadom/references/design/nadom-design-package-v4.html`.
3. Newer design packages or explicitly attached design files in the current task.
4. Historical references in `docs/nadom/references/` only as supporting material.

Do not follow outdated wording if it conflicts with the current task or current repo docs.

## 3. Product frame

Nadom is a private technology service for matching users with a medservice that can visit at home in Moscow.

Nadom is an aggregator / marketplace / matching service, not a clinic and not a medical provider.

Nadom does not:

- provide medical services;
- diagnose;
- prescribe treatment;
- recommend medication;
- recommend IV composition;
- guarantee sedation;
- guarantee a medical result.

The selected medservice confirms medical feasibility, visit details, format, composition, ETA/arrival time, final price, and conditions.

## 4. Current terminology

Client-facing UI should use:

- `медслужба`
- `выбранная медслужба`
- `специалист выбранной медслужбы`
- `карточка медслужбы`
- `условия выезда`
- `детали и стоимость подтверждает выбранная медслужба`

Use `медицинская организация` in legal/consent/license contexts when a more formal term is needed.

Internal/admin/dashboard contexts may use:

- `партнёр`
- `партнёры`
- `партнёрский доступ`

Only use those terms when clearly internal/operator/admin-facing and not visible to clients.

Do not use client-facing wording such as:

- `клиника Надом`
- `врач Надом`
- `наш врач`
- `лечим`
- `назначаем`
- `диагностируем`
- `подберём капельницу`
- `гарантируем результат`
- `феназепам` as a service/package
- guaranteed sedation

## 5. Privacy / anonymity wording

Allowed in public/marketing/bot UI:

- `анонимность`
- `анонимный подбор`
- `анонимный поиск`
- `приватно`
- `конфиденциально`
- `без лишних звонков`

Do not promise absolute anonymity.

In consent/legal contexts, clarify that the selected medservice may request data necessary to provide the visit.

Do not collect phone or exact address before the selected medservice actually needs it for the confirmed visit.

## 6. Emergency / 103–112

Use 103/112 as a calm safety recommendation layer.

Do not use sirens, red crosses, panic language, aggressive warning cards, or shame/pressure.

Use small muted red/dust accents only.

The service does not diagnose severity. If there are acute symptoms, recommend 103/112 clearly and calmly.

## 7. Visual / frontend rules

For UI/frontend/visual tasks, inspect the current design package first:

- `docs/nadom/references/design/nadom-design-package-v4.html`

Keep the v2/v4 structure and icon-system logic, but preserve richer v1-style color rhythm where the design package specifies it: colorful pills, badges, buttons, service cards, and status states.

Do not introduce a new unrelated visual style.

Mini App UI must respect Telegram safe area / viewport:

- top content must not go under Telegram controls;
- bottom CTA must not cover content;
- chips/buttons must wrap or scroll without overlap;
- light and dark themes must both remain readable;
- browser preview `?theme=dark` / `?theme=light` must not break Telegram theme behavior.

## 8. Bot rules

Bot messages must be neutral and useful.

Recommended commands:

- `/start` — открыть Надом
- `/help` — как это работает
- `/status` — статус моей заявки
- `/support` — написать в поддержку

Telegram notifications must not include symptoms, medical details, chat content, exact address, phone, or other sensitive data.

## 9. Security / privacy

Never commit:

- `.env` files;
- tokens;
- secrets;
- Telegram bot tokens;
- personal data;
- phone numbers;
- exact addresses;
- medical details;
- chat content dumps.

Do not log tokens, initData, phone/address data, medical details, or chat content.

Validate Telegram initData where applicable. Keep admin/clinic access at least as strict as the current main branch.

## 10. PR workflow

Keep PRs scoped and reviewable.

Open PRs as draft unless the user explicitly asks otherwise.

Do not merge automatically unless the user explicitly asks to merge.

For each PR include:

- summary;
- changed files;
- validation results;
- privacy/security notes;
- remaining risks/TODOs;
- manual smoke-test path when relevant.

Run relevant validation commands when code changes:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm build`
- `pnpm db:validate`
- `pnpm db:generate`
- API/bot tests when relevant.

If a local DB or browser automation is unavailable, say so honestly. Do not fake success.
