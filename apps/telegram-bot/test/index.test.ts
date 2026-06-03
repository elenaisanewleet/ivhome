import assert from "node:assert/strict";
import test from "node:test";

import {
  createCancelMessage,
  createFallbackMessage,
  createHelpMessage,
  createMessageForIncomingText,
  createNewRequestMessage,
  createStartMessage,
  createStatusCommandMessage,
  createStatusUpdateMessage,
  createSupportMessage,
  isCancelCommand,
  isHelpCommand,
  isNewCommand,
  isStartCommand,
  isStatusCommand,
  isSupportCommand,
} from "../src/index.js";

test("recognizes Telegram command variants", () => {
  assert.equal(isStartCommand("/start"), true);
  assert.equal(isStartCommand("/start payload"), true);
  assert.equal(isStartCommand("/start@nadom_bot"), true);
  assert.equal(isStartCommand("/status"), false);

  assert.equal(isHelpCommand("/help"), true);
  assert.equal(isSupportCommand("/support"), true);
  assert.equal(isStatusCommand("/status"), true);
  assert.equal(isNewCommand("/new"), true);
  assert.equal(isCancelCommand("/cancel"), true);
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

test("creates help and support messages without medical details", () => {
  assert.match(createHelpMessage().text, /что умеет Надом/u);
  assert.match(createSupportMessage().text, /не отправляйте в Telegram медицинские подробности/u);
  assert.doesNotMatch(createHelpMessage().text, /лечим|назначаем|диагностируем/u);
});

test("routes incoming text to command replies", () => {
  assert.match(createMessageForIncomingText("/start").text, /привет/u);
  assert.match(createMessageForIncomingText("/help").text, /что умеет/u);
  assert.match(createMessageForIncomingText("/support").text, /поддержка Надом/u);
  assert.match(createMessageForIncomingText("/status").text, /статус заявки/u);
  assert.match(createMessageForIncomingText("/new").text, /новый подбор/u);
  assert.match(createMessageForIncomingText("/cancel").text, /отмену заявки/u);
  assert.match(createMessageForIncomingText("hello").text, /всё основное/u);
});

test("creates utility command replies", () => {
  assert.match(createStatusCommandMessage().text, /не пишем детали заявки в Telegram/u);
  assert.match(createNewRequestMessage().text, /новый подбор/u);
  assert.match(createCancelMessage().text, /отмену заявки/u);
  assert.match(createFallbackMessage().text, /откройте Надом/u);
});

test("creates neutral protected status notifications without request details", () => {
  assert.deepEqual(createStatusUpdateMessage(), {
    text: "Статус заявки обновлён. Откройте Надом, чтобы посмотреть детали.",
    protect_content: true,
  });

  assert.equal(createStatusUpdateMessage("booked").protect_content, true);
  assert.match(createStatusUpdateMessage("en_route").text, /Специалист выбранной медслужбы выезжает/u);
});
