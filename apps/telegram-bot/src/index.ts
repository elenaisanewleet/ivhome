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

export function createStartMessage() {
  return {
    text: [
      "привет, я Надом 🫧",
      "если нужен медицинский выезд на дом — помогу найти подходящий вариант",
      "детали подтверждает выбранная организация",
    ].join("\n\n"),
    ...(webAppUrl
      ? {
          reply_markup: {
            inline_keyboard: [
              [{ text: "подобрать вариант", web_app: { url: webAppUrl } }],
            ],
          },
        }
      : {}),
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
  if (!update.message || !isStartCommand(update.message.text)) {
    return;
  }

  await callTelegramApi("sendMessage", {
    chat_id: update.message.chat.id,
    ...createStartMessage(),
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
