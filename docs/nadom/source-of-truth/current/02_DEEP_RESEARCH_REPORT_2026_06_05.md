# Nadom deep research report

Updated: 2026-06-05.

This report captures the current strategic source-of-truth direction for Nadom / Надом. It supports the project instruction and UX/TOV microcopy files in this folder. It overrides older Nadom / IVhome research notes and design references when they conflict.

## Current priority

For Nadom / Надом tasks, read first:

1. `docs/nadom/source-of-truth/current/00_NADOM_CURRENT_PROJECT_INSTRUCTION_2026_06_05.md`
2. `docs/nadom/source-of-truth/current/01_NADOM_UX_TOV_RECOMMENDED_MICROCOPY_2026_06_05.md`
3. `docs/nadom/source-of-truth/current/02_DEEP_RESEARCH_REPORT_2026_06_05.md`

Older docs are archive/reference only unless explicitly requested.

## Strategic summary

Nadom should feel like a private, calm, Telegram-native matching flow for a home visit by a selected medservice or clinic in Moscow. The user should quickly understand what can be requested, what Nadom does, what the selected medservice confirms, what data is needed now, and what happens next.

Core feeling:

> Быстро. Удобно. Анонимно.

The product should communicate speed and privacy without making absolute promises about anonymity, medical outcomes, sedation, or guaranteed availability.

## Product positioning

Nadom is a technology aggregator / marketplace / matching service. It is not a clinic and not a medical provider.

The selected medservice / clinic is responsible for confirming:

- medical feasibility;
- visit format;
- final details;
- composition where applicable;
- arrival expectations;
- final price;
- visit conditions.

Nadom should make the selection flow clear and safe without diagnosing, prescribing, recommending medications, recommending IV composition, or promising results.

## UX priorities

Current UX direction:

1. A clear first screen with user-recognizable categories.
2. A low-friction privacy-first selection flow.
3. Separate response and arrival expectations.
4. A stronger, flagship expanded clinic / medservice card.
5. Chat with the selected clinic / medservice before final confirmation.
6. Waiting statuses with clear next actions.
7. A visible price lifecycle and price-lock state.
8. Trust chips that explain privacy, verification, and price rules concisely.
9. Calm microinteractions that reduce uncertainty without medical drama.

## First-screen category research outcome

Use direct, familiar service categories while keeping explanatory subtitles:

- `Вывод из запоя — помощь при длительном употреблении алкоголя`
- `Капельница после алкоголя — если плохо после алкоголя или тяжёлое похмелье`
- `Нарколог на дом — консультация и выезд специалиста`
- `Детокс — восстановление после интоксикации`
- `Описать ситуацию — какую услугу ищите`

Use `Описать ситуацию`, not `Свой запрос`, because it better matches a user who is unsure which option to choose.

## Response, arrival, and waiting states

Research direction: users need to know whether they are waiting for a medservice response or for a confirmed specialist to arrive. Therefore, always separate:

- `Ответ медслужбы`
- `Прибытие после подтверждения`

Waiting states should provide clear next actions, such as opening chat, checking status, changing request details where safe, or contacting support.

## Price-lock direction

Use a staged price model:

1. Before medservice confirmation: `Ориентир по стоимости`.
2. After medservice confirmation: `Стоимость подтверждена`.
3. Locked state: `Цена зафиксирована`.
4. Stability explanation: `Цена не изменится, если условия заявки остаются прежними`.

This avoids implying that Nadom sets medical pricing before the selected medservice has confirmed the visit.

## Privacy direction

Recommended privacy formula:

> Для подбора не нужны ваши данные, паспорт, точный адрес. Когда выберете клинику и подтвердите выезд, понадобится адрес — его увидит только выбранная клиника.

This supports an anonymous/private-feeling early flow while remaining accurate about the data needed for a confirmed visit.

## Design direction

Current visual/UX direction:

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

Design should feel private, warm, premium, and useful. Avoid generic SaaS visuals, panic healthcare visuals, red crosses, sirens, aggressive warnings, and guaranteed-outcome visuals.

## Security and data minimization

The strict security baseline remains:

- no secrets;
- no `.env`;
- no token logging;
- no sensitive medical/personal details in Telegram notifications;
- validate Telegram `initData`;
- minimal data collection.

Do not collect phone, passport, exact address, or unnecessary medical detail before the selected medservice actually needs it for a confirmed visit.

## Deferred implementation

This research report does not implement:

- UI copy changes;
- UX features;
- v6.2 design work;
- app/frontend changes;
- Telegram bot changes;
- backend/API changes;
- DB, Prisma schema, or migration changes.
