import assert from "node:assert/strict";
import test from "node:test";

import { createStartMessage, isStartCommand } from "../src/index.js";

test("recognizes Telegram /start commands", () => {
  assert.equal(isStartCommand("/start"), true);
  assert.equal(isStartCommand("/start payload"), true);
  assert.equal(isStartCommand("/start@nadom_bot"), true);
  assert.equal(isStartCommand("/status"), false);
});

test("creates a Nadom start message with a Mini App button", () => {
  const message = createStartMessage();

  assert.match(message.text, /привет, я Надом/u);
  assert.equal(
    message.reply_markup.inline_keyboard[0]?.[0]?.web_app.url,
    "http://localhost:5173",
  );
});
