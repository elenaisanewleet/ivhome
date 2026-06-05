# Nadom current project instruction

Updated: 2026-06-05.

This is the current project instruction for Nadom / Надом AI-agent, Codex, Claude, and Copilot sessions. It overrides older Nadom / IVhome instructions when they conflict. Older docs are archive/reference only unless explicitly requested.

## Read order for Nadom tasks

1. `docs/nadom/source-of-truth/current/00_NADOM_CURRENT_PROJECT_INSTRUCTION_2026_06_05.md`
2. `docs/nadom/source-of-truth/current/01_NADOM_UX_TOV_RECOMMENDED_MICROCOPY_2026_06_05.md`
3. `docs/nadom/source-of-truth/current/02_DEEP_RESEARCH_REPORT_2026_06_05.md`

Then use older Nadom docs only as supporting context if they do not conflict with these current files.

## Source priority

1. The current source-of-truth files in `docs/nadom/source-of-truth/current/`.
2. Current task attachments or instructions that explicitly supersede these files.
3. Current repo docs under `docs/nadom/` for implementation details not covered here.
4. Design packages and references under `docs/nadom/references/` for visual/layout support only.
5. Historical Nadom / IVhome docs as archive/reference only.

Do not treat older blacklists, older first-screen wording, older category names, or older design directions as higher priority if they conflict with this instruction set.

## Product frame

Nadom is a private technology service for matching users with a medservice / medical organization that can visit at home in Moscow.

Nadom is an aggregator, marketplace, and matching service. Nadom is not a clinic and not a medical provider.

Nadom does not:

- provide medical services;
- diagnose;
- prescribe treatment;
- recommend medication;
- recommend IV composition;
- guarantee sedation;
- guarantee a medical result.

The selected medservice / clinic / medical organization confirms medical feasibility, visit details, visit format, composition where applicable, ETA/arrival time, final price, and conditions.

## Current core feeling

Use the current core feeling:

> Быстро. Удобно. Анонимно.

This is a product feeling and direction, not a promise of absolute anonymity.

## Current terminology

Client-facing UI should use:

- `медслужба`;
- `выбранная медслужба`;
- `специалист выбранной медслужбы`;
- `карточка медслужбы`;
- `условия выезда`;
- `детали и стоимость подтверждает выбранная медслужба`.

Use `медицинская организация` in legal, consent, license, and formal contexts when a more formal term is needed.

Internal/admin/dashboard contexts may use:

- `партнёр`;
- `партнёры`;
- `партнёрский доступ`.

Only use those terms when clearly internal/operator/admin-facing and not visible to clients.

## Tone of Voice rules

Do not add new hard Tone of Voice bans. Use only the current user-approved TOV review list in `01_NADOM_UX_TOV_RECOMMENDED_MICROCOPY_2026_06_05.md`.

Do not expand older blacklists from historical docs. If an old blacklist conflicts with the current review-list approach, follow the current review-list approach.

The current Tone of Voice is calm, private, concise, useful, and Telegram-native. Avoid medical claims, panic, shame, pressure, and sales aggression.

## First-screen categories

Use these first-screen categories exactly unless the user explicitly requests a later change:

- `Вывод из запоя — помощь при длительном употреблении алкоголя`
- `Капельница после алкоголя — если плохо после алкоголя или тяжёлое похмелье`
- `Нарколог на дом — консультация и выезд специалиста`
- `Детокс — восстановление после интоксикации`
- `Описать ситуацию — какую услугу ищите`

Use `Описать ситуацию`, not `Свой запрос`.

## SLA / waiting-status separation

Always separate:

- `Ответ медслужбы`
- `Прибытие после подтверждения`

Do not merge response time and arrival time into one ambiguous ETA. The selected medservice confirms the visit details and arrival expectations.

## Privacy and anonymity

Recommended privacy formula:

> Для подбора не нужны ваши данные, паспорт, точный адрес. Когда выберете клинику и подтвердите выезд, понадобится адрес — его увидит только выбранная клиника.

Use `анонимность`, `анонимный подбор`, `анонимный поиск`, `приватно`, `конфиденциально`, and `без лишних звонков` only as practical product-language signals. Do not promise absolute anonymity.

In consent/legal contexts, clarify that the selected medservice or clinic may request data necessary to provide the visit.

Do not collect phone or exact address before the selected medservice actually needs it for a confirmed visit.

## Price lifecycle and price lock

Use these recommended price-lock labels:

- `Ориентир по стоимости`
- `Стоимость подтверждена`
- `Цена зафиксирована`
- `Цена не изменится, если условия заявки остаются прежними`

Before confirmation, present price as an orientation/estimate. After the selected medservice confirms the visit, show the confirmed/locked price and clarify that it stays fixed if the request conditions stay the same.

## Design / UX direction

Use the current design and UX direction:

- warm graphite base;
- cream / milk / stone surfaces;
- petrol / blue, sage, amber, dusty rose accents;
- more color variety in real UI elements;
- flagship expanded clinic / medservice card;
- chat with selected clinic / medservice;
- waiting status with clear next actions;
- price lock visual;
- trust chips;
- calm microinteractions.

Do not introduce unrelated visual styles, generic SaaS gradients, panic medical imagery, red crosses, sirens, or aggressive warning cards.

## Emergency / 103–112

Use 103/112 as a calm safety recommendation layer. Nadom does not diagnose severity.

If there are acute symptoms, recommend 103/112 clearly and calmly. Do not use panic language, shame, pressure, sirens, red crosses, or aggressive warning visuals.

## Telegram bot and notifications

Bot messages must be neutral and useful.

Recommended commands:

- `/start` — открыть Надом
- `/help` — как это работает
- `/status` — статус моей заявки
- `/support` — написать в поддержку

Telegram notifications must not include symptoms, medical details, chat content, exact address, phone, or other sensitive data.

## Security and privacy

Security remains strict:

- no secrets;
- no `.env`;
- no token logging;
- no sensitive medical/personal details in Telegram notifications;
- validate Telegram `initData`;
- minimal data collection.

Never commit tokens, credentials, `.env` files, personal data, phone numbers, exact addresses, medical details, or chat-content dumps.

## Scope guard for future implementation work

This instruction set is a source of truth. It does not itself implement UI copy changes, UX features, v6.2 design work, app/frontend changes, bot changes, API changes, DB changes, or Prisma changes.
