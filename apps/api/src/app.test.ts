import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";

import { buildApp } from "./app.js";

const BOT_TOKEN = "123456:test-token";

function signedInitData() {
  const params = new URLSearchParams({
    auth_date: String(Math.floor(Date.now() / 1_000)),
    user: JSON.stringify({ id: 42, first_name: "Demo", language_code: "ru" }),
  });
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  params.set("hash", createHmac("sha256", secretKey).update(dataCheckString).digest("hex"));
  return params.toString();
}

test("returns minimal identity for valid initData", async () => {
  const app = buildApp({ telegramBotToken: BOT_TOKEN });
  const response = await app.inject({
    method: "POST",
    url: "/telegram/validate-init-data",
    payload: { initData: signedInitData() },
  });
  await app.close();

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { valid: true, identity: { id: 42, firstName: "Demo" } });
});

test("returns a generic invalid response for invalid initData", async () => {
  const app = buildApp({ telegramBotToken: BOT_TOKEN });
  const response = await app.inject({
    method: "POST",
    url: "/telegram/validate-init-data",
    payload: { initData: "auth_date=1&hash=invalid" },
  });
  await app.close();

  assert.equal(response.statusCode, 401);
  assert.deepEqual(response.json(), { valid: false });
});

test("returns 503 when the bot token is not configured", async () => {
  const previousToken = process.env.TELEGRAM_BOT_TOKEN;
  delete process.env.TELEGRAM_BOT_TOKEN;
  const app = buildApp();
  if (previousToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
  else process.env.TELEGRAM_BOT_TOKEN = previousToken;

  const response = await app.inject({
    method: "POST",
    url: "/telegram/validate-init-data",
    payload: { initData: signedInitData() },
  });
  await app.close();

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.json(), { valid: false });
});
