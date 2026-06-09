# Tone of Voice source hierarchy

## Level 1 — Primary source of truth

`docs/tone-of-voice/final_tone_of_voice.md`

This file is the canonical markdown version of `Тон оф войс для Claude.docx`.

It is the only active source of truth for:
- Tone of Voice
- UI-copy
- microcopy
- Telegram Bot text
- Telegram Mini App text
- landing copy
- clinic / medservice cards
- CTA
- BotFather copy
- safety messages
- status messages
- Claude Design AI prompts
- Codex prompts

If any other TOV file conflicts with `docs/tone-of-voice/final_tone_of_voice.md`, always follow `docs/tone-of-voice/final_tone_of_voice.md`.

## Level 2 — Source document / export

`Тон оф войс для Claude.docx`

This is the original final Claude-facing document. It can be used to verify the canonical markdown file.

## Level 3 — Supporting TOV philosophy

`nadom_tov_unified_no_blacklist_2026_06_09.md`

Use only for additional explanation of:
- no-blacklist approach
- brand character
- anonymity
- service guarantees
- “подберём капельницу / состав”
- calm 103/112 logic
- context-based wording

Do not use it if it conflicts with the final TOV.

## Level 4 — Supporting UX copy pack

`Nadom Tone of Voice v3.md`

Use only when the final TOV lacks screen-level details:
- Mini App screens
- Telegram bot messages
- /start, /help, /privacy, /status
- empty / loading / error states
- clinic cards
- package copy
- statuses

Do not use it as a primary rule source.

## Level 5 — Safety / lint reference

`жесткие правила тут.md`

Use only as a small lint-check for:
- грубые стигматизирующие слова
- CTA
- categories
- SLA
- price lock
- privacy
- 103/112

Do not expand it into a big blacklist.

## Level 6 — Verbal identity / UX research

`compass_artifact_wf-c4feb38d-48e3-4e83-b2a1-91a8c216a5ad_text_markdown.md`

Use for:
- warm authority
- Telegram-native UX
- one decision per screen
- buttons over typing
- urgency without panic
- no-judgment language
- confirmation and fallback copy principles

## Level 7 — Market / positioning research

`compass_artifact_wf-9e2f084c-7c83-40ee-9eb5-ce66486baf15_text_markdown.md`

Use for:
- market positioning
- Russian anonymity layer
- taxi-like status tracking
- price transparency
- aggregator / marketplace logic

## Level 8 — UX features / motion / interface behavior

`02_DEEP_RESEARCH_REPORT_2026_06_05.md`

Use for:
- UX features
- microinteractions
- animations
- progress bars
- skeleton loading
- toasts
- expanded clinic card behavior
- admin / partner cabinet ideas

## Level 9 — Legacy archive

`nadom_tov_v2 2.md`  
`final_tone_of_voice_v2.md`, if not replaced

Use only for:
- migration history
- audit
- checking what old rules must not reappear

## Repository note

The supporting files named above may live outside the repository in the original handoff package. When imported into this repository, keep their names stable and add the supporting / archived reference warning required by this hierarchy.
