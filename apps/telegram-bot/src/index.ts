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

export type NeutralNotificationKind = "status_updated" | "chat_message";

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

export function createStartMessage() {
  return withOpenAppButton(
    [
      "привет, я Надом 🫧",
      "если нужен медицинский выезд на дом — помогу найти подходящий вариант",
      "детали, стоимость и возможность выезда подтверждает выбранная организация",
    ].join("\n\n"),
    "подобрать вариант",
  );
}

export function createHelpMessage() {
  return withOpenAppButton(
    [
      "что умеет Надом",
      "⋆ помогает выбрать организацию по району, условиям и времени",
      "⋆ показывает ответ организации и прибытие после подтверждения",
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

export function createStatusUpdateMessage(kind: StatusNotificationKind = "updated") {
  const texts: Record<StatusNotificationKind, string> = {
    updated: "статус заявки обновлён · детали в приложении",
    quote_provided: "стоимость уточнена · откройте, чтобы подтвердить",
    booked: "заявка подтверждена · выбранная организация взяла её в работу",
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
    status_updated: "Статус заявки обновлён. Откройте Надом.",
    chat_message: "Новое сообщение по заявке. Откройте Надом.",
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
