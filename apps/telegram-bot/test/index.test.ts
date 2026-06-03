import assert from "node:assert/strict";
import test from "node:test";

import {
  createHelpMessage,
  createStartMessage,
  createStatusUpdateMessage,
  isHelpCommand,
  isStartCommand,
} from "../src/index.js";

test("recognizes Telegram /start commands", () => {
  assert.equal(isStartCommand("/start"), true);
  assert.equal(isStartCommand("/start payload"), true);
  assert.equal(isStartCommand("/start@nadom_bot"), true);
  assert.equal(isStartCommand("/status"), false);
});

test("recognizes Telegram /help commands", () => {
  assert.equal(isHelpCommand("/help"), true);
  assert.equal(isHelpCommand("/help@nadom_bot"), true);
  assert.equal(isHelpCommand("/start"), false);
});

test("creates a Nadom start message", () => {
  const message = createStartMessage();

  assert.match(message.text, /привет, я Надом/u);
  assert.match(message.text, /медслужба/u);
});

test("creates a help message describing what Nadom can do", () => {
  const message = createHelpMessage();

  assert.match(message.text, /проверенную медслужбу/u);
  assert.match(message.text, /103 или 112/u);
});

test("omits Mini App button when TELEGRAM_WEBAPP_URL is not configured", () => {
  const message = createStartMessage();

  assert.equal("reply_markup" in message, false);
});

test("creates a neutral status notification without request details", () => {
  const message = createStatusUpdateMessage();

  assert.equal(
    message.text,
    "статус заявки обновлён · откройте Надом, чтобы посмотреть детали",
  );
  assert.equal("reply_markup" in message, false);
});
