const botToken = process.env.TELEGRAM_BOT_TOKEN ?? "";
const webAppUrl = process.env.TELEGRAM_WEBAPP_URL;
const telegramApiUrl = `https://api.telegram.org/bot${botToken}`;

type TelegramUpdate = { update_id: number; message?: { chat: { id: number }; text?: string } };
type TelegramResponse<T> = { ok: boolean; result: T };
type InlineButton = { text: string; web_app?: { url: string }; callback_data?: string };
type TelegramMessagePayload = { text: string; protect_content?: boolean; reply_markup?: { inline_keyboard: InlineButton[][] } };

export type StatusNotificationKind = "updated" | "quote_provided" | "booked" | "en_route" | "completed";
export type NeutralNotificationKind = "status_updated" | "chat_message";

function isCommand(text: string | undefined, command: string) { return new RegExp(`^/${command}(?:@\\w+)?(?:\\s|$)`, "u").test(text ?? ""); }
function appButton(label = "Открыть Надом"): InlineButton | null { return webAppUrl ? { text: label, web_app: { url: webAppUrl } } : null; }
function keyboard(rows: InlineButton[][]): TelegramMessagePayload["reply_markup"] | undefined { const clean = rows.map((row) => row.filter(Boolean)).filter((row) => row.length > 0); return clean.length ? { inline_keyboard: clean } : undefined; }
function withOpenAppButton(text: string, buttonLabel = "Открыть Надом"): TelegramMessagePayload { const button = appButton(buttonLabel); return { text, ...(button ? { reply_markup: keyboard([[button]]) } : {}) }; }

export function isStartCommand(text: string | undefined) { return isCommand(text, "start"); }
export function isHelpCommand(text: string | undefined) { return isCommand(text, "help"); }
export function isSupportCommand(text: string | undefined) { return isCommand(text, "support"); }
export function isStatusCommand(text: string | undefined) { return isCommand(text, "status"); }

export function createStartMessage() {
  return {
    text: ["привет, я Надом 🫧", "Помогу конфиденциально подобрать медслужбу с выездом на дом.", "Детали и стоимость подтверждает выбранная медслужба."].join("\n\n"),
    reply_markup: keyboard([[appButton("Открыть Надом")].filter(Boolean) as InlineButton[], [{ text: "Как это работает", callback_data: "help" }, { text: "Статус заявки", callback_data: "status" }], [{ text: "Поддержка", callback_data: "support" }]]),
  } satisfies TelegramMessagePayload;
}

export function createHelpMessage() {
  return withOpenAppButton(["Как это работает", "1. выберите район, время и условия;", "2. сравните медслужбы по ответу, ETA и цене;", "3. выберите услугу или свой запрос;", "4. медслужба подтверждает детали и стоимость."].join("\n"));
}

export function createSupportMessage() {
  return withOpenAppButton("Поможем с работой сервиса. Медицинские вопросы решает специалист выбранной медслужбы.", "Открыть Надом");
}

export function createStatusMessage(hasActiveRequest = false) {
  return withOpenAppButton(hasActiveRequest ? "Статус активной заявки доступен в Надом. Откройте приложение." : "Активной заявки пока нет. Откройте Надом, чтобы начать подбор.");
}

export function createFallbackMessage() { return withOpenAppButton(["всё основное — в приложении", "откройте Надом кнопкой ниже"].join("\n\n")); }
export function createStatusUpdateMessage(kind: StatusNotificationKind = "updated") { const texts: Record<StatusNotificationKind, string> = { updated: "статус заявки обновлён · детали в приложении", quote_provided: "стоимость уточнена · откройте Надом", booked: "заявка подтверждена · выбранная медслужба взяла её в работу", en_route: "специалист выехал · время приезда в приложении", completed: "готово · можно оставить оценку в приложении" }; return { ...withOpenAppButton(texts[kind]), protect_content: true }; }
export function createNeutralRequestNotification(kind: NeutralNotificationKind) { const texts: Record<NeutralNotificationKind, string> = { status_updated: "Статус заявки обновлён. Откройте Надом.", chat_message: "Новое сообщение по заявке. Откройте Надом." }; return { ...withOpenAppButton(texts[kind]), protect_content: true }; }

export function createMessageForIncomingText(text: string | undefined) { if (isStartCommand(text)) return createStartMessage(); if (isHelpCommand(text)) return createHelpMessage(); if (isSupportCommand(text)) return createSupportMessage(); if (isStatusCommand(text)) return createStatusMessage(false); return createFallbackMessage(); }

async function callTelegramApi<T>(method: string, body: unknown) { const response = await fetch(`${telegramApiUrl}/${method}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); if (!response.ok) throw new Error(`Telegram API request failed with status ${response.status}`); const payload = (await response.json()) as TelegramResponse<T>; if (!payload.ok) throw new Error("Telegram API request failed"); return payload.result; }
async function handleUpdate(update: TelegramUpdate) { if (!update.message?.text) return; await callTelegramApi("sendMessage", { chat_id: update.message.chat.id, ...createMessageForIncomingText(update.message.text) }); }
async function pollUpdates() { let offset = 0; while (true) { try { const updates = await callTelegramApi<TelegramUpdate[]>("getUpdates", { offset, timeout: 30, allowed_updates: ["message"] }); for (const update of updates) { offset = update.update_id + 1; await handleUpdate(update); } } catch { console.error("Telegram polling failed; retrying without sensitive logs."); await new Promise((resolve) => setTimeout(resolve, 1_000)); } } }

if (!botToken) console.warn("Telegram bot is disabled because TELEGRAM_BOT_TOKEN is not set."); else void pollUpdates();
