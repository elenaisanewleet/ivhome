import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import { validateTelegramInitData } from "../src/telegram/init-data.js";

const botToken = "123456:fake-test-token";
const now = new Date("2026-05-31T12:00:00.000Z");
const authDate = Math.floor(now.getTime() / 1000);

function signInitData(values: Record<string, string>) {
  const dataCheckString = Object.entries(values)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const hash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  return new URLSearchParams({ ...values, hash }).toString();
}

test("accepts signed and current Telegram initData", () => {
  const initData = signInitData({
    auth_date: String(authDate),
    query_id: "test-query",
    user: JSON.stringify({ id: 42, first_name: "Test" }),
  });

  assert.deepEqual(validateTelegramInitData(initData, botToken, { now }), {
    valid: true,
    authDate,
  });
});

test("rejects a signature created with another bot token", () => {
  const initData = signInitData({ auth_date: String(authDate) });

  assert.deepEqual(validateTelegramInitData(initData, "different-token", { now }), {
    valid: false,
    reason: "hash_mismatch",
  });
});

test("rejects expired initData", () => {
  const initData = signInitData({ auth_date: String(authDate - 3_601) });

  assert.deepEqual(validateTelegramInitData(initData, botToken, { now }), {
    valid: false,
    reason: "auth_date_expired",
  });
});

test("rejects initData with an auth_date too far in the future", () => {
  const initData = signInitData({ auth_date: String(authDate + 61) });

  assert.deepEqual(validateTelegramInitData(initData, botToken, { now }), {
    valid: false,
    reason: "auth_date_in_future",
  });
});

test("validation endpoint accepts signed initData without returning Telegram data", async () => {
  const previousBotToken = process.env.TELEGRAM_BOT_TOKEN;
  process.env.TELEGRAM_BOT_TOKEN = botToken;

  try {
    const { buildApp } = await import("../src/app.js");
    const app = buildApp();
    const initData = signInitData({
      auth_date: String(Math.floor(Date.now() / 1000)),
      query_id: "test-query",
      user: JSON.stringify({ id: 42, first_name: "Test" }),
    });
    const response = await app.inject({
      method: "POST",
      url: "/telegram/init-data/validate",
      payload: { initData },
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json(), { valid: true });

    await app.close();
  } finally {
    if (previousBotToken === undefined) {
      delete process.env.TELEGRAM_BOT_TOKEN;
    } else {
      process.env.TELEGRAM_BOT_TOKEN = previousBotToken;
    }
  }
});

test("validation endpoint rejects malformed input without exposing a reason", async () => {
  const { buildApp } = await import("../src/app.js");
  const app = buildApp();
  const response = await app.inject({
    method: "POST",
    url: "/telegram/init-data/validate",
    payload: { initData: "not-signed" },
  });

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.json(), { valid: false });

  await app.close();
});
