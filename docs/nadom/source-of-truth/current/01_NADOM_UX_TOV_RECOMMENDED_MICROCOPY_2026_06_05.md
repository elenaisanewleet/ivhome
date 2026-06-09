> Supporting / archived reference.
> This file is a supporting UX/TOV microcopy reference for Nadom / Надом. Use it only in the support area described in `docs/tone-of-voice/README.md` and only where it does not conflict with the final TOV.

# Nadom UX, Tone of Voice, and recommended microcopy

Updated: 2026-06-05.

## Current priority

For Nadom / Надом Tone of Voice and copy tasks, read first:

1. `docs/tone-of-voice/final_tone_of_voice.md`
2. `docs/tone-of-voice/README.md`

Then use this file only as a supporting reference in the hierarchy area assigned to it. Older docs are archive/reference only unless explicitly requested.

## Core feeling

The current core feeling is:

> Быстро. Удобно. Анонимно.

Use it as a product direction: fast selection, convenient flow, privacy-first experience. Do not turn it into a legal or absolute-anonymity promise.

## TOV review list

No new hard Tone of Voice bans should be added beyond the final TOV. Use `docs/tone-of-voice/final_tone_of_voice.md` as the primary active TOV source instead of expanding old blacklists.

Public-facing copy should be checked for responsibility framing, not treated as a broad ban on medical wording.

Medical service wording is allowed when it is clear that:

- Nadom helps the user choose a clinic / medservice;
- the selected clinic / medservice confirms the service, procedure format, prescriptions, composition where applicable, final price, and visit possibility;
- Nadom itself is not presented as the clinic, doctor, prescriber, or medical provider.

Also review public-facing copy for:

- absolute anonymity promises;
- panic, shame, fear, pressure, urgency, or FOMO;
- unclear responsibility for price, arrival, medical feasibility, and visit conditions;
- collection of personal data before it is needed;
- sensitive information in Telegram notifications.

If copy triggers one of these review points, rewrite it calmly instead of adding a broader banned-word list.

## First-screen categories

Use these first-screen categories:

- `Вывод из запоя — помощь при длительном употреблении алкоголя`
- `Капельница после алкоголя — если плохо после алкоголя или тяжёлое похмелье`
- `Нарколог на дом — консультация и выезд специалиста`
- `Детокс — восстановление после интоксикации`
- `Описать ситуацию — какую услугу ищите`

Use `Описать ситуацию`, not `Свой запрос`.

## Recommended privacy microcopy

Recommended formula:

> Для подбора не нужны ваши данные, паспорт, точный адрес. Когда выберете клинику и подтвердите выезд, понадобится адрес — его увидит только выбранная клиника.

Short variants may use:

- `Для подбора не нужны паспорт и точный адрес.`
- `Точный адрес понадобится только после выбора клиники и подтверждения выезда.`
- `Адрес увидит только выбранная клиника.`
- `Без лишних звонков.`
- `Приватно и спокойно.`

Use these as practical privacy statements. Do not imply that a confirmed medical visit can happen without the data the selected medservice or clinic needs.

## SLA and waiting microcopy

Always separate:

- `Ответ медслужбы`
- `Прибытие после подтверждения`

Recommended labels:

- `Ждём ответ медслужбы`
- `Медслужба проверяет возможность выезда`
- `Прибытие после подтверждения`
- `После подтверждения покажем время прибытия`
- `Можно написать выбранной медслужбе в чате`

Avoid collapsing response and arrival into one timer.

## Price microcopy

Recommended price lifecycle labels:

- `Ориентир по стоимости`
- `Стоимость подтверждена`
- `Цена зафиксирована`
- `Цена не изменится, если условия заявки остаются прежними`

Recommended helper copy:

- `До подтверждения это ориентир.`
- `Итоговую стоимость подтверждает выбранная медслужба.`
- `После подтверждения цена зафиксирована.`
- `Цена не изменится, если условия заявки остаются прежними.`

## Medservice / clinic card microcopy

Recommended card elements:

- `Карточка медслужбы`
- `Ответ медслужбы`
- `Прибытие после подтверждения`
- `Условия выезда`
- `Ориентир по стоимости`
- `Детали и стоимость подтверждает выбранная медслужба`
- `Написать выбранной медслужбе`
- `Подтвердить выезд`

A flagship expanded medservice card should feel calm, clear, and trust-building. It should show verification/license context where relevant without overstating guarantees.

## Chat microcopy

Recommended chat labels:

- `Чат с выбранной медслужбой`
- `Задайте вопрос перед подтверждением`
- `Медслужба уточнит детали, если это нужно для выезда`
- `Не отправляйте лишние персональные данные до подтверждения выезда`

Do not include sensitive medical details in Telegram notification previews.

## Trust chips

Recommended trust-chip directions:

- `Проверка документов`
- `Лицензия / реквизиты`
- `Без лишних звонков`
- `Данные — только выбранной клинике после подтверждения`
- `Цена фиксируется после подтверждения`

Use chips as concise trust cues, not as legal guarantees.

## Emergency microcopy

Use 103/112 calmly where needed.

Recommended pattern:

- `Если есть острые симптомы или состояние быстро ухудшается, обратитесь в 103/112.`
- `Надом не оценивает тяжесть состояния. При острых симптомах лучше обратиться в 103/112.`

Do not add siren-like, shame-based, or panic copy.

## Bot command copy

Recommended commands:

- `/start` — открыть Надом
- `/help` — как это работает
- `/status` — статус моей заявки
- `/support` — написать в поддержку

Bot messages should be neutral, useful, and short.
