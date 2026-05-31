# Nadom Design Configuration

## Brand

Public brand: `Надом / Nadom`.

Internal codename: `IVhome` only for repository, package, and internal technical context.

## Active source priority

Read the available sources in this order before future Nadom design or implementation work:

1. `docs/nadom/design-config.md` — implementation priority and file map.
2. `docs/nadom/current-source-of-truth.md` — product, legal, privacy, terminology, and MVP flow.
3. `docs/nadom/references/design/nadom-design-guide.pdf` — compact final design instruction.
4. `docs/nadom/references/design/nadom-design-package-v3.html` — final palette, card, and component direction.
5. `docs/nadom/references/design/nadom-design-package-v2.html` — main interface structure, visual maturity, typography, mobile frames, status track, chat UI, price lock, and BotFather/welcome package.
6. `docs/nadom/references/design/nadom-design-package-v1.html` — palette feeling, color combinations, and medservice-card visual reference.
7. `docs/nadom/references/design/nadom-workflow-board.png` — workflow completeness checklist: screens, states, BotFather/welcome assets, bot messages, icons, components, price lock, and empty/error/repeat states.

The Markdown files in items 1 and 2 are present in this repository. The binary and HTML sources in items 3–7 are the canonical stable import paths, but their source bytes were not available in the Codex workspace on May 31, 2026. Add the provided source files at those exact paths when they are available; do not fabricate replacements.

## Final design formula

* v2 = base interface structure, screen rhythm, maturity, typography logic, mobile frames, status track, SLA blocks, chat UI, price lock, and BotFather/welcome package.
* v1/v3 = palette, color combinations, badges/buttons/status colors, graphite + milk mood, and medservice-card visual feeling.
* PNG workflow board = flow logic and completeness checklist.
* Current source of truth = product, legal, privacy, and terminology rules.
* Chat with the selected medservice specialist = mandatory MVP function after the medservice card and before final request confirmation.

## Canonical palette

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

* Graphite shell.
* Milk / warm-paper Mini App surfaces.
* Compact cards, thin borders, and soft but strict radius.
* Small uppercase metadata labels.
* Calm blue / teal accents.
* No hospital visuals, red crosses, sirens, doctor photos, generic SaaS gradients, bright green checkmarks, or aggressive warning visuals.

## Medservice card

Follow the v1/v3 visual feeling:

* light card;
* calm rating badge;
* two separate SLA blocks;
* short labels;
* private premium feeling;
* `Ответ` and `Прибытие` separated;
* note: `Детали и возможность выезда подтверждает медслужба`.

## Terminology

* Use `медслужба` as the main user-facing compact term.
* Do not use `партнёр` in UI.
* Do not use `IVhome` in public UI.
* Do not use `Домой`.

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
