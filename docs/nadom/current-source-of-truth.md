# Nadom Current Source of Truth

Updated: May 31, 2026.

This file is the active product, legal, privacy, terminology, and MVP-flow reference for future Nadom work. For design implementation priority and the visual source map, read `docs/nadom/design-config.md` first.

## Product frame

`Надом / Nadom` is the public brand. `IVhome` is an internal repository and technical codename only.

Надом is an aggregator, marketplace, and matching service for arranging a medical home visit. It is not a clinic and does not provide medical services. It does not diagnose, prescribe treatment, recommend medications, recommend IV composition, recommend therapy schemes, or promise medical results.

The selected medservice, clinic, or medical organization confirms medical possibility, details, format, visit, and final price.

## MVP flow

Use this flow as the product baseline:

`/start → onboarding → consent → calm 103/112 recommendation layer → help profile → district/geozone → desired time → medservice list → medservice card → chat with selected medservice specialist → final request confirmation → confirmation/status → price lock → specialist en route → completion → rating/support → empty/error/repeat states`

Chat with the selected medservice specialist is mandatory after the medservice card and before final request confirmation.

## Emergency layer

Use `103/112` as a calm recommendation layer rather than a panic screen or a hard-stop. Do not use alarmist copy or panic visuals.

## SLA and price lifecycle

Keep these SLA metrics separate everywhere:

1. `Ответ` — response or confirmation time.
2. `Прибытие` — expected arrival time after confirmation.

Price is indicative before confirmation. The selected medservice confirms and locks the final price.

## Medservice card

Each medservice card should be compact and include:

* medservice name;
* calm rating badge;
* verification or license context where applicable;
* two separate SLA blocks for `Ответ` and `Прибытие`;
* indicative price before confirmation;
* short conditions;
* note: `Детали и возможность выезда подтверждает медслужба`.

## Terminology

Use `медслужба` as the main user-facing compact term. Do not use `партнёр` in UI. Do not use `IVhome` in public UI. Do not use `Домой`.

When a more formal legal clarification is useful, use `медицинская организация`, `выбранная организация`, or `специалист выбранной организации`.

## Visual direction

Use the graphite + milk direction documented in `docs/nadom/design-config.md`. Keep the interface calm, private, compact, and premium. Do not introduce hospital visuals, red crosses, sirens, doctor photos, generic SaaS gradients, bright green checkmarks, or aggressive warning visuals.

## Privacy and security

* Collect the minimum necessary data.
* Ask for district/geozone before exact address.
* Do not collect phone number or exact address too early.
* Do not log tokens, addresses, phone numbers, personal data, or medical data.
* Do not put medical details in Telegram notifications.
* Validate Telegram `initData` server-side.
* Never commit `.env`, tokens, or secrets.
