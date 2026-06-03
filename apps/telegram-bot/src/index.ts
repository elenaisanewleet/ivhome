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

export function isStartCommand(text: string | undefined) {
  return /^\/start(?:@\w+)?(?:\s|$)/u.test(text ?? "");
}

export function isHelpCommand(text: string | undefined) {
  return /^\/help(?:@\w+)?(?:\s|$)/u.test(text ?? "");
}

function webAppButton(label: string) {
  return webAppUrl
    ? {
        reply_markup: {
          inline_keyboard: [[{ text: label, web_app: { url: webAppUrl } }]],
        },
      }
    : {};
}

export function createStartMessage() {
  return {
    text: [
      "привет, я Надом 🫧",
      "покажу, кто приедет на дом, когда и за сколько — а вы выберете медслужбу",
      "<i>детали и стоимость подтверждает выбранная медслужба</i>",
    ].join("\n\n"),
    parse_mode: "HTML",
    ...webAppButton("подобрать вариант"),
  };
}

export function createFallbackMessage() {
  return {
    text: "всё здесь 🫧",
    ...webAppButton("открыть Надом"),
  };
}

export function createHelpMessage() {
  return {
    text: [
      "<b>что умею</b>",
      [
        "⋆ подобрать проверенную медслужбу для выезда — экстренно или планово",
        "⋆ показать условия: когда ответят, когда приедут, стоимость",
        "⋆ держать в курсе статуса заявки",
      ].join("\n"),
      "<i>анонимно · без лишних звонков</i>\n<i>при острых симптомах — 103 или 112</i>",
    ].join("\n\n"),
    parse_mode: "HTML",
    ...webAppButton("открыть Надом"),
  };
}

export function createStatusUpdateMessage() {
  return {
    text: "статус заявки обновлён · откройте Надом, чтобы посмотреть детали",
    ...webAppButton("открыть Надом"),
  };
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
  if (!update.message) {
    return;
  }

  const { text, chat } = update.message;

  if (isStartCommand(text)) {
    await callTelegramApi("sendMessage", {
      chat_id: chat.id,
      ...createStartMessage(),
    });
    return;
  }

  if (isHelpCommand(text)) {
    await callTelegramApi("sendMessage", {
      chat_id: chat.id,
      ...createHelpMessage(),
    });
    return;
  }

  // Any other message: gently point back to the Mini App without echoing content.
  await callTelegramApi("sendMessage", {
    chat_id: chat.id,
    ...createFallbackMessage(),
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
