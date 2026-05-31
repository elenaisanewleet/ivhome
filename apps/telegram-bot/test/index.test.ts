import assert from "node:assert/strict";
import test from "node:test";

import { createStartMessage, isStartCommand } from "../src/index.js";

test("recognizes Telegram /start commands", () => {
  assert.equal(isStartCommand("/start"), true);
  assert.equal(isStartCommand("/start payload"), true);
  assert.equal(isStartCommand("/start@nadom_bot"), true);
  assert.equal(isStartCommand("/status"), false);
});

test("creates a Nadom start message", () => {
  const message = createStartMessage();

  assert.match(message.text, /привет, я Надом/u);
});

test("omits Mini App button when TELEGRAM_WEBAPP_URL is not configured", () => {
  const message = createStartMessage();

  assert.equal("reply_markup" in message, false);
});
