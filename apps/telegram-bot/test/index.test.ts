import assert from "node:assert/strict";
import test from "node:test";

import {
  createFallbackMessage,
  createHelpMessage,
  createMessageForIncomingText,
  createNeutralRequestNotification,
  createStartMessage,
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

test("omits Mini App button when TELEGRAM_WEBAPP_URL is not configured", () => {
  const message = createStartMessage();

  assert.equal("reply_markup" in message, false);
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

test("creates neutral protected status notifications without request details", () => {
  assert.deepEqual(createStatusUpdateMessage(), {
    text: "статус заявки обновлён · детали в приложении",
    protect_content: true,
  });

  assert.equal(createStatusUpdateMessage("booked").protect_content, true);
  assert.match(createStatusUpdateMessage("en_route").text, /специалист выехал/u);
});

test("creates neutral request notifications without chat content", () => {
  assert.deepEqual(createNeutralRequestNotification("status_updated"), {
    text: "Статус заявки обновлён. Откройте Надом.",
    protect_content: true,
  });
  assert.deepEqual(createNeutralRequestNotification("chat_message"), {
    text: "Новое сообщение по заявке. Откройте Надом.",
    protect_content: true,
  });
});
