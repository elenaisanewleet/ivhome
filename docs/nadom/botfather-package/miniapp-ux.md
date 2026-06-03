# Mini App + Bot — Best Practices для Надом

Выжимка из официальной документации Telegram + типовых паттернов для медицинских / сервисных Mini App.

---

## Bot

### 1. Menu Button вместо команд

Настроить через BotFather → `/setmenubutton` → Web App.
Пользователь жмёт кнопку — сразу открывается Mini App.
Не нужно вспоминать `/start`.

```
BotFather → /setmenubutton → Web App
Текст: Надом
URL: <TELEGRAM_WEBAPP_URL>
```

### 2. parse_mode HTML

Надёжнее Markdown в edge cases (апострофы, дефисы, кириллица).

```typescript
parse_mode: 'HTML'
// Теги: <b> <i> <a href="..."> — только они в сообщениях
```

### 3. protect_content для уведомлений

Медицинские данные не пересылаются.

```typescript
protect_content: true  // в sendMessage для статус-уведомлений
```

### 4. Notification text ≤ 140 символов

Telegram показывает превью ~140 символов в lock screen и notification bar.
Ключевой факт — в первые 80 символов.

```
✓  "заявка подтверждена · детали в приложении"
✗  "Уважаемый пользователь! Ваша заявка на медицинский выезд на дом была успешно..."
```

### 5. Deep links для разных точек входа

```
t.me/nadom_bot?start=new        → сразу на форму нового запроса
t.me/nadom_bot?start=status     → на статус активной заявки
t.me/nadom_bot?start=repeat     → повторный запрос
```

Реализация в боте: парсить параметр после `/start`, передавать в Mini App через startParam.

### 6. Privacy Mode — Enabled

Бот не читает все сообщения чата (только команды `/`).
Важно для групп и конфиденциальности.

---

## Mini App

### 7. expand() при запуске

Открывать Mini App на весь экран сразу — не оставлять половинчатый вид.

```javascript
// В начале app, до любого рендера
Telegram.WebApp.expand()
Telegram.WebApp.ready()
```

### 8. Telegram Theme Params

Читать цвета из Telegram — адаптировать под тему пользователя (светлая / тёмная).

```javascript
const tg = Telegram.WebApp
const bg = tg.backgroundColor        // цвет фона Telegram
const textColor = tg.themeParams.text_color

// Передать в CSS custom properties
document.documentElement.style.setProperty('--tg-bg', bg)
```

Для Надом: кремовый фон (`#F2F1EB`) в светлой теме, тёмный void в тёмной — проверить, что переключается корректно.

### 9. MainButton для CTA

Основная кнопка — нативная кнопка Telegram внизу экрана.
Не нужно рисовать свою кнопку поверх контента — она встроена в chrome.

```javascript
const btn = Telegram.WebApp.MainButton
btn.setText('подобрать вариант')
btn.color = '#3D7AB5'
btn.textColor = '#FAFAF4'
btn.show()
btn.onClick(() => {
  // отправить запрос
})

// Во время загрузки:
btn.showProgress(false)  // spinner без скрытия текста

// После успеха:
btn.hideProgress()
btn.hide()
```

### 10. BackButton — нативная навигация

Не рисовать кастомные "← Назад". Использовать Telegram BackButton.

```javascript
const back = Telegram.WebApp.BackButton
back.show()
back.onClick(() => {
  // вернуться на предыдущий экран
  back.hide()
})
```

### 11. HapticFeedback на ключевых действиях

```javascript
const haptic = Telegram.WebApp.HapticFeedback

// Лёгкое нажатие (выбор пункта):
haptic.impactOccurred('light')

// Успешное действие (отправка заявки):
haptic.notificationOccurred('success')

// Ошибка:
haptic.notificationOccurred('error')

// Предупреждение (экстренный экран):
haptic.notificationOccurred('warning')
```

### 12. Safe Area Insets

На iPhone с "чёлкой" нижняя панель перекрывает контент.

```javascript
// iOS safe area
const safeArea = Telegram.WebApp.safeAreaInset
// bottom — отступ снизу для контента

// В CSS:
.footer {
  padding-bottom: calc(env(safe-area-inset-bottom) + 12px);
}
```

### 13. sendData vs HTTP API

Для MVP: Mini App отправляет запросы напрямую в свой HTTP API (Fastify).
`sendData()` — только если нужно передать данные в бот без сервера (не наш случай).

```javascript
// Наш путь: Mini App → HTTP API → PostgreSQL
// Не использовать sendData для медицинских данных
```

### 14. isVersionAtLeast — проверка поддержки

```javascript
if (Telegram.WebApp.isVersionAtLeast('6.7')) {
  // CloudStorage, ClosingConfirmation
}
if (Telegram.WebApp.isVersionAtLeast('7.2')) {
  // SafeAreaInset
}
```

### 15. ClosingConfirmation на форме

Если пользователь заполнил форму и случайно жмёт назад — показать нативный диалог.

```javascript
Telegram.WebApp.enableClosingConfirmation()
// показывает системный попап "Закрыть приложение?"
// при свайпе вниз или нажатии ✕
```

Отключать на экранах без введённых данных (список медслужб, главная).

---

## Архитектурные решения для MVP

### Данные и приватность

```
[Mini App] → HTTP API (initData валидация) → PostgreSQL
               ↑
        [Fastify, TLS]

Telegram Bot → sendMessage (статусы) → [User TG Chat]
```

- initData валидируется на сервере **каждый запрос**
- Адрес и медданные только в API, никогда в bot message
- Токены только в env (не в коде)

### Структура экранов (рекомендованный порядок)

```
Splash (expand + ready)
  └→ Онбординг (если новый)
       └→ Согласие (consent)
            └→ Экстренный слой (103/112)
                 └→ Профиль запроса (что нужно)
                      └→ Район (не адрес)
                           └→ Время
                                └→ Список медслужб
                                     └→ Карточка медслужбы
                                          └→ Чат со специалистом
                                               └→ Подтверждение заявки
                                                    └→ Статус-трекер
                                                         └→ Ценовой замок
                                                              └→ Завершение
                                                                   └→ Оценка
```

### Состояния загрузки

Каждый запрос к API: показывать нативный spinner через MainButton.showProgress().
Не блокировать весь экран — только кнопку действия.

### Обработка offline

```javascript
// При ошибке сети:
Telegram.WebApp.HapticFeedback.notificationOccurred('error')
// Показать inline-ошибку под кнопкой, не toast
// Предложить retry в той же кнопке
```

---

## Чеклист перед публикацией Mini App

| # | Проверка |
|---|---|
| ☐ | expand() + ready() вызывается при запуске |
| ☐ | MainButton используется для основного CTA |
| ☐ | BackButton работает на всех вложенных экранах |
| ☐ | HapticFeedback на submit / success / error |
| ☐ | ClosingConfirmation включён на форме запроса |
| ☐ | initData валидируется на каждом API запросе |
| ☐ | Safe area учтена на iOS (нижний отступ) |
| ☐ | Светлая и тёмная тема — проверить оба |
| ☐ | Нет медданных в URL параметрах |
| ☐ | Нет console.log с чувствительными полями |
| ☐ | Приложение не крашится без интернета |
| ☐ | Mini App работает на Android и iOS |
