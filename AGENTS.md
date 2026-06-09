# AGENTS.md — IVhome / Nadom

You are working in the IVhome repository.

Internal repo/project name: **IVhome**.
Public user-facing brand: **Nadom / Надом**.

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

1. Current repo docs under `docs/nadom/`, especially `project-rules.md`, `public-wording.md`, `visual-system.md`, `privacy-security.md`, `design-config.md`, and `OPERATIONS_CHECKLIST.md`.
2. Current design lineage, with `docs/nadom/references/design/nadom-design-package-v6.2.html` as the current active confirmed visual/design baseline when it exists in the repo or is explicitly attached, followed by v6.1, v6, v5, and v4. `nadom-design-package-v6.3.html` is the current target / next package to be created, not an existing input unless the file exists in the repository or is explicitly attached to the task.
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
- `феназепам` as a service/package
- guaranteed sedation

Do not hard-ban `подберём капельницу` or `гарантируем результат`. These phrases are allowed only in the service/process sense defined by `docs/tone-of-voice/final_tone_of_voice.md`.

Nadom may communicate process guarantees:

- visible options;
- clear route;
- anonymous flow;
- price visibility;
- status tracking;
- chat;
- no documents before clinic selection.

Nadom must not promise:

- medical result;
- cure;
- guaranteed sedation;
- guaranteed sleep;
- specific medication effect;
- that a specific IV composition will work.

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

For UI/frontend/visual/Claude Design tasks, inspect the current design lineage first:

1. `docs/nadom/references/design/nadom-design-package-v6.2.html`
2. `docs/nadom/references/design/nadom-design-package-v6.1.html`
3. `docs/nadom/references/design/nadom-design-package-v6.html`
4. `docs/nadom/references/design/nadom-design-package-v5.html`
5. `docs/nadom/references/design/nadom-design-package-v4.html`
6. `docs/nadom/design-config.md`
7. `docs/tone-of-voice/final_tone_of_voice.md` for wording/tone only

If v6.2 / v6.1 / v6 or any referenced visual file is missing from the repo and not explicitly attached to the task, state that it is unavailable and use the next available attached or repo source. Do not invent missing design files. v6.2 is the current active confirmed visual/design baseline only when available or attached; the canonical TOV owns all wording and tone.

When the task is to create `nadom-design-package-v6.3.html`, treat v6.3 as the output target, not as an existing input file. Once v6.3 exists in the repo, it can become the active current design package.

Do not introduce a new unrelated visual style outside the v4 → v6.2 lineage.

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
