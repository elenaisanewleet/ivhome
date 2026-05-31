const API_ROOT = "https://api.telegram.org/";

const START_MESSAGE = [
  "привет, я Надом 🫧",
  "",
  "если нужен медицинский выезд на дом — помогу быстро найти подходящий вариант",
  "",
  "без 20 сайтов, лишних звонков и непонятных цен",
  "",
  "сравниваем по:",
  "⋆ времени",
  "⋆ цене",
  "⋆ району",
  "⋆ условиям",
  "",
  "дальше детали подтверждает выбранная медицинская организация 🩵",
  "",
  "при экстренных симптомах обратитесь в 103/112",
  "сервис не заменяет очную медицинскую консультацию",
].join("\n");

type TelegramUpdate = {
  update_id: number;
  message?: {
    chat?: { id?: number | string };
    text?: string;
  };
};

type TelegramGetUpdatesResponse = {
  ok: boolean;
  result?: TelegramUpdate[];
};

const telegramSecret = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.TELEGRAM_WEBAPP_URL;

if (!telegramSecret) {
  console.error("Telegram bot is not configured. Set TELEGRAM_BOT_TOKEN.");
  process.exit(1);
}

let updateOffset = 0;

function methodUrl(method: string): string {
  const url = new URL(API_ROOT);
  url.pathname = `${["bot", telegramSecret].join("")}/${method}`;
  return url.toString();
}

async function callTelegram(method: string, body: unknown): Promise<unknown> {
  const response = await fetch(methodUrl(method), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Telegram request failed with status ${response.status}`);
  }

  return response.json() as Promise<unknown>;
}

async function getUpdates(): Promise<TelegramUpdate[]> {
  const response = (await callTelegram("getUpdates", {
    offset: updateOffset,
    timeout: 30,
    allowed_updates: ["message"],
  })) as TelegramGetUpdatesResponse;

  if (!response.ok || !Array.isArray(response.result)) {
    return [];
  }

  return response.result;
}

async function sendStartMessage(chatId: number | string): Promise<void> {
  const replyMarkup = webAppUrl
    ? {
        inline_keyboard: [
          [
            {
              text: "Открыть Надом",
              web_app: { url: webAppUrl },
            },
          ],
        ],
      }
    : undefined;

  await callTelegram("sendMessage", {
    chat_id: chatId,
    text: START_MESSAGE,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

async function processUpdate(update: TelegramUpdate): Promise<void> {
  updateOffset = update.update_id + 1;

  if (update.message?.text !== "/start") {
    return;
  }

  const chatId = update.message.chat?.id;

  if (chatId === undefined) {
    return;
  }

  await sendStartMessage(chatId);
}

async function poll(): Promise<void> {
  console.log("Nadom Telegram bot started.");

  while (true) {
    try {
      const updates = await getUpdates();

      for (const update of updates) {
        await processUpdate(update);
      }
    } catch {
      console.error("Telegram polling iteration failed.");
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }
}

void poll();
