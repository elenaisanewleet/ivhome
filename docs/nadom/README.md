# Nadom documentation and design references

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

For product, legal, safety, UX research, and implementation context, use the current Nadom docs under `docs/nadom/` only where they do not conflict with the final TOV. In particular, `docs/nadom/source-of-truth/current/03_NADOM_FINAL_TOV_COPY_SYSTEM_2026_06_05.md` is now a supporting archived reference, not the primary active TOV source.

## Active reference map

The active stable reference paths are:

* `docs/nadom/design-config.md`
* `docs/nadom/current-source-of-truth.md`
* `docs/nadom/references/design/nadom-design-guide.pdf`
* `docs/nadom/references/design/nadom-design-package-v3.html`
* `docs/nadom/references/design/nadom-design-package-v2.html`
* `docs/nadom/references/design/nadom-design-package-v1.html`
* `docs/nadom/references/design/nadom-workflow-board.png`

The two Markdown references are committed. The HTML, PDF, and PNG source bytes were not available in the Codex workspace on May 31, 2026, so their stable paths are reserved but intentionally not populated with invented placeholders. Import the provided files under those exact ASCII filenames when their bytes are available.

## Supporting rule documents

The existing Markdown rule documents remain in place for useful historical and review context:

* `docs/nadom/project-rules.md`
* `docs/nadom/public-wording.md`
* `docs/nadom/visual-system.md`
* `docs/nadom/privacy-security.md`
* `docs/nadom/pr-review-checklist.md`

If an older supporting document conflicts with the active TOV source, follow `docs/tone-of-voice/final_tone_of_voice.md`. For non-TOV implementation details, follow the current Nadom docs under `docs/nadom/` where they do not conflict with the final TOV.

## Deprecated visual references

The previous rendered `saved_resource` PNG set and two supporting screenshots moved to `docs/nadom/references/deprecated/visual-legacy/`. Keep them only as historical context. Do not treat them as active visual references for new work.
