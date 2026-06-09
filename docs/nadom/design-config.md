# Nadom Design Configuration

## Brand

Public brand: `Надом / Nadom`.

Internal codename: `IVhome` only for repository, package, and internal technical context.

## Active source priority

Read the available sources in this order before any Nadom UI, Mini App, Telegram Bot, dashboard, icon, visual, Claude Design prompt, Codex prompt, or copy-related implementation work.

1. `docs/tone-of-voice/final_tone_of_voice.md` — primary source for wording, tone, UI copy, CTA, bot text, status text, medservice/clinic card copy, Claude Design prompts, and Codex prompts. Do not duplicate the canonical TOV text inside design instructions.
2. `docs/nadom/references/design/nadom-design-package-v6.2.html` — current active visual/design source of truth.
3. `docs/nadom/references/design/nadom-design-package-v6.1.html` — nearest previous baseline; use to understand what v6.2 revised.
4. `docs/nadom/references/design/nadom-design-package-v6.html` — previous stable package; use for continuity and reusable product UI decisions.
5. `docs/nadom/references/design/nadom-design-package-v5.html` — supporting design reference; use for strong visual/product ideas that still fit v6.2.
6. `docs/nadom/references/design/nadom-design-package-v4.html` — supporting design reference; use for strong earlier foundation and decisions that were not intentionally replaced.
7. `docs/nadom/current-source-of-truth.md` — product, privacy, legal, MVP-flow, and implementation context only where it does not conflict with the canonical TOV or current design lineage.
8. Older design packages v1/v2/v3, if present — legacy/supporting references only. Do not let them override v4–v6.2.
9. `docs/nadom/references/design/nadom-workflow-board.png` — workflow completeness checklist only.

If sources conflict, follow the priority above: the canonical TOV owns wording and tone, and v6.2 wins visual/design conflicts. If a referenced visual file is missing, state that it is unavailable and use the next available source. Do not invent placeholder files or a new visual style outside this lineage.

## Current availability note

As of this docs update, the repository contains `nadom-design-package-v5.html`, `nadom-design-package-v4.html`, and `nadom-workflow-board.png`. The v6.2, v6.1, and v6 HTML packages are referenced as the intended current lineage; if they are unavailable in the working tree, use the next available source and note the limitation.

## Final design formula

* v6.2 = active current design package.
* v6.1 = nearest baseline / comparison point.
* v6 = continuity source for stable product UI.
* v5 = supporting visual/product ideas.
* v4 = supporting strong foundation.
* v6.2 owns the current screens, palette application, UI components, Telegram assets, bot assets, banners, clinic/medservice cards, admin cabinet, partner cabinet, motion examples, and export-ready visuals.
* The canonical TOV owns all wording and tone.
* Older v1/v2/v3 packages are historical support only.
* Do not invent a new visual style outside this lineage.

## Current design lineage guidance

Use v6.2 as the active visual/design source when available:

* current screen set and screen order;
* palette application and color rhythm;
* UI component structure and component states;
* Telegram Mini App assets and Telegram Bot assets;
* banners and export-ready visuals;
* clinic/medservice cards;
* admin cabinet and partner cabinet;
* motion examples and interaction details.

Use v6.1 only as the nearest comparison point to understand what v6.2 changed or intentionally kept.

Use v6 as the continuity source for stable product UI decisions when v6.2/v6.1 are unavailable or silent.

Use v5 for supporting visual/product ideas only when they still fit v6.2 and do not override the active package.

Use v4 for strong earlier foundation and decisions that were not intentionally replaced by v5–v6.2.

Use v1/v2/v3 only as historical references. They must not override v4, v5, v6, v6.1, or v6.2.

## Core visual rules

* Preserve the best working parts across v4 → v6.2, but v6.2 wins when there is a direct conflict.
* Keep Nadom in the same design lineage; do not introduce unrelated SaaS, hospital, wellness, emergency, or generic marketplace styling.
* Keep Telegram Mini App screens safe for Telegram controls and viewport behavior.
* Keep bottom CTAs from covering content.
* Keep chips, buttons, and filters wrapping or scrolling without overlap.
* Keep light and dark Telegram themes readable.
* Use calm, private, technology-service visuals.
* Avoid hospital visuals, red crosses, sirens, doctor photos, generic SaaS gradients, bright green checkmarks, aggressive warning visuals, wellness-sugar style, and cute medical illustrations.

## Medservice card

Follow the current v6.2 medservice-card direction when available. Use v6.1/v6/v5/v4 only for continuity and supporting ideas that still fit v6.2.

Medservice cards must keep:

* clear selected-medservice responsibility;
* license/trust markers where appropriate;
* separate response and arrival timing;
* transparent price orientation and confirmation flow;
* chat with the specialist of the selected medservice;
* privacy proof points only when true for the selected medservice;
* calm status/confirmation states.

Always separate:

1. response / confirmation time;
2. arrival ETA after confirmation.

Use `docs/tone-of-voice/final_tone_of_voice.md` for the exact wording, labels, CTA, and tone.

## Required MVP flow

`/start` → welcome → consent → emergency recommendation / `103–112` → profile of help → district / geozone → urgency / desired time → medservice list → medservice card → chat with specialist of selected medservice → request confirmation → manual admin / medservice confirmation → request status → price lock → waiting / visit → completion → rating / feedback → support → empty / error states → repeat request.

## Terminology

Use the canonical TOV for exact wording and tone. Product/legal implementation constraints still apply:

* Use `медслужба` as the main user-facing compact term.
* Use `медицинская организация` only where legal/consent/licensing clarity is needed.
* Do not use `партнёр` in client-facing UI.
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
