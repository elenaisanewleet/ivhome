# Ассеты @nadom_bot

Готовые файлы для загрузки в BotFather. PNG — основной формат. SVG — только для splash.

---

## Что куда грузить в BotFather

| BotFather | Файл | Формат |
|---|---|---|
| `/setuserpic` (аватар) | один из `png/av-*.png` | PNG 512×512 |
| Welcome Message → Set Welcome Picture | `png/welcome-640x360.png` | PNG 640×360 |
| Mini App → Launch Screen → Set Splash Icon | `splash-icon.svg` | SVG, один `<path>`, 512×512 |

---

## Аватарки — концепты

Смотрите общий обзор: `png/preview-avatars.png`.

| Концепт | Файлы | Идея |
|---|---|---|
| **Капельница** (drip chamber) | `av-drip-void/cream/signal` | Камера капельницы + капля. Капельница неочевидна — видна на второй взгляд. |
| **Капля в кольцах** | `av-dropring-void/cream/signal` | Капля в кольцах сигнала — маршрут к точке. |
| **Метка-капля** | `av-pindrop-void/cream/signal` | Гео-метка, внутри негативом — капля. |
| **Маршрут** | `av-node-void/cream` | Приватная доставка к точке (дому). |
| **Монограмма Н** | `av-mono-void/cream/signal` | Буква «н» в Unbounded + точка. |
| Ранние (drop/H/IV) | `iv-*`, `h-*`, `drop-*`, `rings-*`, `icon-*` | Первые итерации. |

Колорвеи:
- `void` — тёмный фон, синий символ (премиально, тёмная тема)
- `cream` — тёплый кремовый фон, тёмный символ (светлая тема)
- `signal` — синий градиент, белый символ (яркий, контрастный)

---

## Welcome picture

`png/welcome-640x360.png` — основной (рекомендованный Telegram размер).
Также: `welcome-960x540.png` (hi-res), `welcome-320x180.png` (мелкий).

Текст минимальный: символ + надом + «выездная медицинская помощь» + три слова
**анонимно · быстро · удобно**.

---

## Splash icon (Mini App)

`splash-icon.svg` — строго один `<path>`, 512×512, по спеке Telegram.
Цвет символа: `#3D7AB5`. Фон и header настраиваются отдельно в BotFather
(рекомендую фон cream `#F2F1EB` для light, void `#17212B` для dark).

Превью: `png/splash-preview-light.png`, `png/splash-preview-dark.png`.

---

## Экспорт / пересборка

Все PNG собраны из SVG скриптами (cairosvg + Pillow), шрифты — Unbounded + Onest.
Палитра — v2 (Void · Signal · Sage). Если нужно пересобрать в другом размере —
исходные SVG лежат в `icons/`, splash — в корне `assets/`.
