# Nadom Design Configuration

## Brand

Public brand: `Надом / Nadom`.

Internal codename: `IVhome` only for repository, package, and internal technical context.

## Active source priority

Read the available sources in this order before any Nadom UI, Mini App, Telegram Bot, dashboard, icon, visual, or copy implementation work:

1. `docs/nadom/design-config.md` — this implementation priority map.
2. `docs/nadom/current-source-of-truth.md` — product, legal, privacy, terminology, and MVP flow.
3. `docs/nadom/references/design/nadom-design-package-v2.html` — MAIN visual/design source of truth.
4. `docs/nadom/references/design/nadom-design-package.html` — v1 visual benchmark for palette, color combinations, badges/buttons/status colors, and medservice-card feeling.
5. `docs/nadom/references/design/nadom-design-package-v3.html` — final synthesis/reference only when it does not conflict with the rule that v2 owns typography, icons, UI structure, and component logic.
6. `docs/nadom/references/design/Nadom Design Guide.pdf` — compact supporting design instruction.
7. Canva workflow PNG in `docs/nadom/references/design/` — workflow completeness checklist: screens, states, BotFather/welcome assets, bot messages, icons, components, price lock, empty/error/repeat states.
8. Older supporting docs only as historical context.

If sources conflict, follow the priority above. Do not invent a new visual style.

## Final design formula

* v2 = strict base for interface structure, typography, iconography, screen rhythm, mobile frames, component logic, status track, SLA blocks, chat UI, price lock, BotFather/welcome package, and overall visual maturity.
* v1 = palette, color combinations, badges/buttons/status colors, graphite + milk mood, and medservice-card visual feeling only.
* v3 = supporting synthesis if useful, but it must not override v2 for typography, icons, component structure, or UI logic.
* PNG workflow board = flow logic and completeness checklist.
* Current source of truth = product, legal, privacy, terminology, and MVP flow.
* Chat with the selected medservice specialist = mandatory MVP function after the medservice card and before final request confirmation.

## What to take from v2

Use v2 as the production UI base:

* typography: `Unbounded` for display and `Onest` for body;
* all icon logic and icon style;
* screen structure, rhythm, spacing, mobile frame proportions, and component hierarchy;
* strict technological private-service feeling;
* small mono labels;
* thin lines and strict cards;
* status track;
* SLA / ETA blocks;
* chat UI;
* price lock UI;
* BotFather / welcome package logic;
* overall mature, minimal, private digital-service feel.

## What to take from v1

Use v1 only as a visual benchmark for:

* palette and color combinations;
* graphite + milk / cream mood;
* accent / accent-mid / accent-light distribution;
* teal for chat, specialist, and confirmation;
* dust as a soft private / human accent;
* muted ok / warn / err;
* badge, pill, button, and status color feeling;
* medservice card visual feeling.

Do not take from v1:

* screen order;
* MVP priority order;
* product flow;
* typography if it conflicts with v2;
* icon style if it conflicts with v2;
* any decision that chat is phase 2;
* outdated labels.

## Canonical palette

Use the v1 palette as the canonical implementation palette unless a component is explicitly copied from v2 and needs a mapped equivalent:

```css
--ink: #0F0F0E;
--ink-2: #2A2A28;
--ink-3: #5A5A56;
--ink-4: #8A8A84;
--ink-5: #C4C4BC;
--paper: #F5F4F0;
--paper-2: #EEEDE8;
--paper-3: #E4E3DC;
--white: #FAFAF8;
--accent: #4A7FA5;
--accent-mid: #7EB8D4;
--accent-light: #D4E8F5;
--teal: #3A8A82;
--dust: #B89090;
--ok: #3A7A5A;
--warn: #8A6020;
--err: #8A3030;
```

## Core visual rules

* Graphite outer shell / board.
* Milk / warm-paper Mini App surfaces.
* Typography and iconography strictly from v2 direction.
* Compact cards, thin borders, and soft but strict radius.
* Small uppercase metadata labels.
* Calm blue / teal accents.
* No hospital visuals, red crosses, sirens, doctor photos, generic SaaS gradients, bright green checkmarks, aggressive warning visuals, wellness-sugar style, or cute medical illustrations.
* Do not use the wrong icon if v2 provides the correct symbol direction. The Nadom symbol should follow v2: private routing user → medservice → visit, with a subtle network/destination/infusion-line hint only on second look.

## Medservice card

Follow the v1/v3 card feeling while keeping v2 typography, icon style, spacing discipline, and component maturity:

* light card;
* calm rating badge;
* two separate SLA blocks;
* short labels;
* private premium feeling;
* `Ответ` and `Прибытие` separated;
* button: `Написать специалисту`;
* button: `Подтвердить заявку`;
* note: `Детали и возможность выезда подтверждает медслужба`.

Always separate:

1. response / confirmation time;
2. arrival ETA after confirmation.

## Required MVP flow

`/start` → welcome → consent → emergency recommendation / `103–112` → profile of help → district / geozone → urgency / desired time → medservice list → medservice card → chat with specialist of selected medservice → request confirmation → manual admin / medservice confirmation → request status → price lock → waiting / visit → completion → rating / feedback → support → empty / error states → repeat request.

## Terminology

* Use `медслужба` as the main user-facing compact term.
* Use `медицинская организация` only where legal/consent/licensing clarity is needed.
* Do not use `партнёр` in UI.
* Do not use `IVhome` in public UI.
* Do not use `Домой`.
* Do not use `клиника Надом`, `врач Надом`, `наш врач`, `лечим`, `назначаем`, `диагностируем`, or medical promises.

## Medical and legal rules

* Надом is not a clinic and does not provide medical services.
* Надом does not diagnose, prescribe treatment, recommend medications, recommend IV composition, or recommend therapy schemes.
* Details, medical possibility, format, visit, and final price are confirmed by the selected medservice, clinic, or medical organization.

## Emergency layer

`103/112` is a calm recommendation layer, not a hard-stop. Do not use panic visuals.

## Privacy

* Collect minimum data.
* Ask for district/geozone before exact address.
* Do not collect phone number or exact address too early.
* Do not log tokens, addresses, phones, personal data, or medical data.
* Do not put medical details in Telegram notifications.
* Validate Telegram `initData` server-side.
* Do not commit `.env`, tokens, or secrets.
