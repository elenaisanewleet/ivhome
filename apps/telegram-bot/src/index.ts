const botToken = process.env.TELEGRAM_BOT_TOKEN ?? "";
const webAppUrl = process.env.TELEGRAM_WEBAPP_URL;
const telegramApiUrl = `https://api.telegram.org/bot${botToken}`;

type TelegramUpdate = {
  update_id: number;
  message?: {
    chat: { id: number };
    text?: string;
  };
  callback_query?: {
    id: string;
    data?: string;
    message?: {
      chat: { id: number };
    };
  };
};

type TelegramResponse<T> = {
  ok: boolean;
  result: T;
};

type TelegramInlineButton =
  | { text: string; web_app: { url: string } }
  | { text: string; callback_data: "help" | "status" | "support" };

type TelegramMessagePayload = {
  text: string;
  protect_content?: boolean;
  reply_markup?: {
    inline_keyboard: TelegramInlineButton[][];
  };
};

export const TELEGRAM_ALLOWED_UPDATES = ["message", "callback_query"] as const;

export type StatusNotificationKind =
  | "updated"
  | "quote_provided"
  | "booked"
  | "en_route"
  | "completed";

export type NeutralNotificationKind = "status_updated" | "chat_message";

function isCommand(text: string | undefined, command: string) {
  return new RegExp(`^/${command}(?:@\\w+)?(?:\\s|$)`, "u").test(text ?? "");
}

function createWebAppKeyboard(label: string): TelegramMessagePayload["reply_markup"] | undefined {
  const inline_keyboard: TelegramInlineButton[][] = [];

  if (webAppUrl) {
    inline_keyboard.push([{ text: label, web_app: { url: webAppUrl } }]);
  }

  inline_keyboard.push([
    { text: "помощь", callback_data: "help" },
    { text: "статус", callback_data: "status" },
    { text: "поддержка", callback_data: "support" },
  ]);

  return { inline_keyboard };
}

function withOpenAppButton(text: string, buttonLabel = "открыть Надом"): TelegramMessagePayload {
  const replyMarkup = createWebAppKeyboard(buttonLabel);

  return {
    text,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  };
}

export function isStartCommand(text: string | undefined) {
  return isCommand(text, "start");
}

export function isHelpCommand(text: string | undefined) {
  return isCommand(text, "help");
}

export function createStartMessage() {
  return withOpenAppButton(
    [
      "привет, я Надом 🫧",
      "Надом помогает анонимно подобрать клинику или медслужбу с выездом на дом — без лишних данных на старте.",
      "детали, стоимость и возможность выезда подтверждает выбранная медицинская организация",
    ].join("\n\n"),
    "подобрать клинику",
  );
}

export function createHelpMessage() {
  return withOpenAppButton(
    [
      "что умеет Надом",
      "⋆ помогает выбрать медицинскую организацию по району, условиям и времени",
      "⋆ показывает ответ медицинской организации и прибытие после подтверждения",
      "⋆ открывает заявку и статус в приложении",
      "при экстренных симптомах — 103 или 112",
    ].join("\n\n"),
  );
}

export function createFallbackMessage() {
  return withOpenAppButton(
    [
      "всё основное — в приложении",
      "откройте Надом кнопкой ниже",
    ].join("\n\n"),
  );
}

export function createStatusMessage() {
  return withOpenAppButton(
    [
      "статус заявки — в приложении",
      "там видно ответ медицинской организации и следующие шаги",
    ].join("\n\n"),
  );
}

export function createSupportMessage() {
  return withOpenAppButton(
    [
      "поддержка Надом 🩵",
      "если что-то не открывается, напишите сюда коротко, что случилось",
    ].join("\n\n"),
  );
}

export function createStatusUpdateMessage(kind: StatusNotificationKind = "updated") {
  const texts: Record<StatusNotificationKind, string> = {
    updated: "статус заявки обновлён · детали в приложении",
    quote_provided: "стоимость уточнена · откройте, чтобы подтвердить",
    booked: "заявка подтверждена · медицинская организация взяла её в работу",
    en_route: "специалист выехал · время приезда в приложении",
    completed: "готово · можно оставить оценку в приложении",
  };

  return {
    ...withOpenAppButton(texts[kind]),
    protect_content: true,
  };
}

export function createNeutralRequestNotification(kind: NeutralNotificationKind) {
  const texts: Record<NeutralNotificationKind, string> = {
    status_updated: "Статус заявки обновлён. Откройте Надом, чтобы посмотреть детали.",
    chat_message: "Новое сообщение по заявке. Откройте Надом, чтобы ответить.",
  };

  return {
    ...withOpenAppButton(texts[kind]),
    protect_content: true,
  };
}

export function createMessageForIncomingText(text: string | undefined) {
  if (isStartCommand(text)) {
    return createStartMessage();
  }

  if (isHelpCommand(text)) {
    return createHelpMessage();
  }

  return createFallbackMessage();
}

export function createMessageForCallbackData(data: string | undefined) {
  switch (data) {
    case "help":
      return createHelpMessage();
    case "status":
      return createStatusMessage();
    case "support":
      return createSupportMessage();
    default:
      return undefined;
  }
}

async function callTelegramApi<T>(method: string, body: unknown) {
  const response = await fetch(`${telegramApiUrl}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Telegram API request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as TelegramResponse<T>;

  if (!payload.ok) {
    throw new Error("Telegram API request failed");
  }

  return payload.result;
}

type TelegramApiCaller = <T>(method: string, body: unknown) => Promise<T>;

export async function handleUpdate(update: TelegramUpdate, telegramApiCall: TelegramApiCaller = callTelegramApi) {
  if (update.callback_query) {
    await telegramApiCall("answerCallbackQuery", { callback_query_id: update.callback_query.id });

    const message = createMessageForCallbackData(update.callback_query.data);
    const chatId = update.callback_query.message?.chat.id;

    if (message && chatId) {
      await telegramApiCall("sendMessage", {
        chat_id: chatId,
        ...message,
      });
    }

    return;
  }

  if (!update.message?.text) {
    return;
  }

  await telegramApiCall("sendMessage", {
    chat_id: update.message.chat.id,
    ...createMessageForIncomingText(update.message.text),
  });
}

async function pollUpdates() {
  let offset = 0;

  while (true) {
    try {
      const updates = await callTelegramApi<TelegramUpdate[]>("getUpdates", {
        offset,
        timeout: 30,
        allowed_updates: TELEGRAM_ALLOWED_UPDATES,
      });

      for (const update of updates) {
        offset = update.update_id + 1;
        await handleUpdate(update);
      }
    } catch {
      console.error("Telegram polling failed; retrying without sensitive logs.");
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }
}

if (!botToken) {
  console.warn("Telegram bot is disabled because TELEGRAM_BOT_TOKEN is not set.");
} else {
  void pollUpdates();
}
