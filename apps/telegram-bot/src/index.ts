const START_MESSAGE = `привет, я IVhome 🫧

если нужен медицинский выезд на дом — помогу быстро найти подходящий вариант

без 20 сайтов, лишних звонков и непонятных цен

сравниваем по:
⋆ времени
⋆ цене
⋆ району
⋆ условиям

дальше детали подтверждает медпартнёр 🩺

при экстренных симптомах обратитесь в 103/112
сервис не заменяет очную медицинскую консультацию`;

interface TelegramUpdate {
  update_id: number;
  message?: {
    chat: { id: number };
    text?: string;
  };
}

interface TelegramResponse<T> {
  ok: boolean;
  result: T;
}

function telegramApiUrl(token: string, method: string) {
  return `https://api.telegram.org/bot${token}/${method}`;
}

async function callTelegram<T>(token: string, method: string, body: object): Promise<T> {
  const response = await fetch(telegramApiUrl(token, method), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error("Telegram API request failed");
  }

  const payload = (await response.json()) as TelegramResponse<T>;
  if (!payload.ok) {
    throw new Error("Telegram API rejected request");
  }
  return payload.result;
}

async function sendStartMessage(token: string, chatId: number, webAppUrl: string | undefined) {
  const replyMarkup = webAppUrl
    ? { inline_keyboard: [[{ text: "открыть IVhome", web_app: { url: webAppUrl } }]] }
    : undefined;

  await callTelegram(token, "sendMessage", {
    chat_id: chatId,
    text: START_MESSAGE,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

async function runBot(token: string, webAppUrl: string | undefined) {
  let offset = 0;
  while (true) {
    try {
      const updates = await callTelegram<TelegramUpdate[]>(token, "getUpdates", {
        offset,
        timeout: 30,
        allowed_updates: ["message"],
      });
      for (const update of updates) {
        offset = Math.max(offset, update.update_id + 1);
        if (update.message?.text?.split(" ", 1)[0] === "/start") {
          await sendStartMessage(token, update.message.chat.id, webAppUrl);
        }
      }
    } catch {
      console.error("Telegram polling request failed; retrying.");
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }
}

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is required to run the Telegram Bot.");
  process.exit(1);
}

await runBot(token, process.env.TELEGRAM_WEBAPP_URL);
