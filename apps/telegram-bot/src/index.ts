const botToken = process.env.TELEGRAM_BOT_TOKEN ?? "";
const webAppUrl = process.env.TELEGRAM_WEBAPP_URL;
const telegramApiUrl = `https://api.telegram.org/bot${botToken}`;

type TelegramUpdate = {
  update_id: number;
  message?: {
    chat: { id: number };
    text?: string;
  };
};

type TelegramResponse<T> = {
  ok: boolean;
  result: T;
};

type TelegramMessagePayload = {
  text: string;
  protect_content?: boolean;
  reply_markup?: {
    inline_keyboard: Array<Array<{ text: string; web_app: { url: string } }>>;
  };
};

export type StatusNotificationKind =
  | "updated"
  | "quote_provided"
  | "booked"
  | "en_route"
  | "completed";

function isCommand(text: string | undefined, command: string) {
  return new RegExp(`^/${command}(?:@\\w+)?(?:\\s|$)`, "u").test(text ?? "");
}

function createWebAppKeyboard(label: string): TelegramMessagePayload["reply_markup"] | undefined {
  if (!webAppUrl) {
    return undefined;
  }

  return {
    inline_keyboard: [[{ text: label, web_app: { url: webAppUrl } }]],
  };
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

export function isSupportCommand(text: string | undefined) {
  return isCommand(text, "support");
}

export function isStatusCommand(text: string | undefined) {
  return isCommand(text, "status");
}

export function isNewCommand(text: string | undefined) {
  return isCommand(text, "new");
}

export function isCancelCommand(text: string | undefined) {
  return isCommand(text, "cancel");
}

export function createStartMessage() {
  return withOpenAppButton(
    [
      "привет, я Надом 🫧",
      "если нужен медицинский выезд на дом — помогу найти подходящий вариант",
      "детали, стоимость и возможность выезда подтверждает выбранная медслужба",
    ].join("\n\n"),
    "подобрать вариант",
  );
}

export function createHelpMessage() {
  return withOpenAppButton(
    [
      "что умеет Надом",
      "⋆ помогает выбрать медслужбу по району, условиям и времени",
      "⋆ показывает ответ медслужбы и прибытие после подтверждения",
      "⋆ открывает заявку и статус в приложении",
      "при экстренных симптомах — 103 или 112",
    ].join("\n\n"),
  );
}

export function createSupportMessage() {
  return withOpenAppButton(
    [
      "поддержка Надом",
      "по вопросам работы сервиса откройте приложение — там можно вернуться к заявке или начать новый подбор",
      "не отправляйте в Telegram медицинские подробности, адреса и данные документов",
      "при экстренных симптомах — 103 или 112",
    ].join("\n\n"),
  );
}

export function createStatusCommandMessage() {
  return withOpenAppButton(
    [
      "статус заявки — в приложении",
      "мы не пишем детали заявки в Telegram, чтобы сохранить приватность",
    ].join("\n\n"),
  );
}

export function createNewRequestMessage() {
  return withOpenAppButton("новый подбор можно начать в приложении", "начать подбор");
}

export function createCancelMessage() {
  return withOpenAppButton(
    [
      "отмену заявки лучше открыть в приложении",
      "там видны актуальные условия и статус выбранной медслужбы",
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

export function createStatusUpdateMessage(kind: StatusNotificationKind = "updated") {
  const texts: Record<StatusNotificationKind, string> = {
    updated: "Статус заявки обновлён. Откройте Надом, чтобы посмотреть детали.",
    quote_provided: "Стоимость уточнена. Откройте Надом, чтобы подтвердить.",
    booked: "Заявка подтверждена. Откройте Надом, чтобы посмотреть детали.",
    en_route: "Специалист выбранной медслужбы выезжает. Откройте Надом.",
    completed: "Визит завершён. Откройте Надом, чтобы оставить оценку.",
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

  if (isSupportCommand(text)) {
    return createSupportMessage();
  }

  if (isStatusCommand(text)) {
    return createStatusCommandMessage();
  }

  if (isNewCommand(text)) {
    return createNewRequestMessage();
  }

  if (isCancelCommand(text)) {
    return createCancelMessage();
  }

  return createFallbackMessage();
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

async function handleUpdate(update: TelegramUpdate) {
  if (!update.message?.text) {
    return;
  }

  await callTelegramApi("sendMessage", {
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
        allowed_updates: ["message"],
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
