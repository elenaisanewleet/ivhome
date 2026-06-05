import assert from "node:assert/strict";
import test from "node:test";

import {
  createFallbackMessage,
  createHelpMessage,
  createMessageForCallbackData,
  createMessageForIncomingText,
  createNeutralRequestNotification,
  createStartMessage,
  createStatusMessage,
  createSupportMessage,
  handleUpdate,
  TELEGRAM_ALLOWED_UPDATES,
  createStatusUpdateMessage,
  isHelpCommand,
  isStartCommand,
} from "../src/index.js";

test("recognizes Telegram /start and /help commands", () => {
  assert.equal(isStartCommand("/start"), true);
  assert.equal(isStartCommand("/start payload"), true);
  assert.equal(isStartCommand("/start@nadom_bot"), true);
  assert.equal(isStartCommand("/status"), false);

  assert.equal(isHelpCommand("/help"), true);
  assert.equal(isHelpCommand("/help@nadom_bot"), true);
  assert.equal(isHelpCommand("/support"), false);
});

test("creates a Nadom start message", () => {
  const message = createStartMessage();

  assert.match(message.text, /привет, я Надом/u);
  assert.doesNotMatch(message.text, /лицензирован/u);
});

test("uses callback buttons when TELEGRAM_WEBAPP_URL is not configured", () => {
  const message = createStartMessage();

  assert.deepEqual(message.reply_markup?.inline_keyboard.at(-1), [
    { text: "помощь", callback_data: "help" },
    { text: "статус", callback_data: "status" },
    { text: "поддержка", callback_data: "support" },
  ]);
});

test("creates help message without medical claims", () => {
  const message = createHelpMessage();

  assert.match(message.text, /что умеет Надом/u);
  assert.doesNotMatch(message.text, /лечим|назначаем|диагностируем/u);
});

test("routes incoming text to minimal replies", () => {
  assert.match(createMessageForIncomingText("/start").text, /привет/u);
  assert.match(createMessageForIncomingText("/help").text, /что умеет/u);
  assert.match(createMessageForIncomingText("/support").text, /всё основное/u);
  assert.match(createMessageForIncomingText("/status").text, /всё основное/u);
  assert.match(createMessageForIncomingText("hello").text, /всё основное/u);
});

test("creates fallback reply", () => {
  assert.match(createFallbackMessage().text, /откройте Надом/u);
});

test("creates callback replies", () => {
  assert.match(createMessageForCallbackData("help")?.text, /что умеет/u);
  assert.match(createMessageForCallbackData("status")?.text, /статус заявки/u);
  assert.match(createMessageForCallbackData("support")?.text, /поддержка Надом/u);
  assert.equal(createMessageForCallbackData("unknown"), undefined);

  assert.match(createStatusMessage().text, /медслужбы/u);
  assert.match(createSupportMessage().text, /поддержка/u);
});

test("creates neutral protected status notifications without request details", () => {
  const message = createStatusUpdateMessage();

  assert.equal(message.text, "Статус заявки обновлён. Откройте Nadom.");
  assert.equal(message.protect_content, true);
  assert.ok(message.reply_markup);
  assert.equal(createStatusUpdateMessage("booked").protect_content, true);
  assert.match(createStatusUpdateMessage("en_route").text, /Специалист в пути/u);
});

test("creates neutral request notifications without chat content", () => {
  const statusNotification = createNeutralRequestNotification("status_updated");
  const chatNotification = createNeutralRequestNotification("chat_message");

  assert.equal(statusNotification.text, "Статус заявки обновлён. Откройте Nadom.");
  assert.equal(statusNotification.protect_content, true);
  assert.ok(statusNotification.reply_markup);
  assert.equal(chatNotification.text, "Новое сообщение по заявке. Откройте Nadom.");
  assert.equal(chatNotification.protect_content, true);
  assert.ok(chatNotification.reply_markup);
});

test("handles Telegram callback queries and acknowledges the callback", async () => {
  const calls: Array<{ method: string; body: unknown }> = [];
  const apiCall = async <T>(method: string, body: unknown) => {
    calls.push({ method, body });
    return {} as T;
  };

  await handleUpdate({ update_id: 1, callback_query: { id: "cb-1", data: "status", message: { chat: { id: 123 } } } }, apiCall);

  assert.deepEqual(TELEGRAM_ALLOWED_UPDATES, ["message", "callback_query"]);
  assert.equal(calls[0]?.method, "answerCallbackQuery");
  assert.deepEqual(calls[0]?.body, { callback_query_id: "cb-1" });
  assert.equal(calls[1]?.method, "sendMessage");
  assert.match(JSON.stringify(calls[1]?.body), /статус заявки/u);
});

test("handles unknown Telegram callback queries without sending a message", async () => {
  const calls: Array<{ method: string; body: unknown }> = [];
  const apiCall = async <T>(method: string, body: unknown) => {
    calls.push({ method, body });
    return {} as T;
  };

  await handleUpdate({ update_id: 1, callback_query: { id: "cb-2", data: "unknown", message: { chat: { id: 123 } } } }, apiCall);

  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.method, "answerCallbackQuery");
});
