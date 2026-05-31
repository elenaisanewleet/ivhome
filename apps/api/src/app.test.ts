import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";

import { buildApp } from "./app.js";

const botToken = "123456:test-token";
const authDate = Math.floor(Date.now() / 1000);

function signedInitData(entries: Record<string, string>): string {
  const params = new URLSearchParams(entries);
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  params.set("hash", hash);
  return params.toString();
}

function validInitData(): string {
  return signedInitData({
    auth_date: String(authDate),
    query_id: "demo-query-id",
    user: JSON.stringify({
      id: 900000001,
      username: "demo_user",
      first_name: "Demo",
      language_code: "ru",
    }),
  });
}

afterEach(() => {
  delete process.env.TELEGRAM_BOT_TOKEN;
});

describe("POST /telegram/validate-init-data", () => {
  it("returns minimal identity for valid initData", async () => {
    process.env.TELEGRAM_BOT_TOKEN = botToken;
    const app = buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/telegram/validate-init-data",
      payload: { initData: validInitData() },
    });

    assert.equal(response.statusCode, 200);
    assert.deepEqual(response.json().identity, {
      id: 900000001,
      username: "demo_user",
      firstName: "Demo",
      languageCode: "ru",
    });

    await app.close();
  });

  it("returns a generic invalid response for invalid initData", async () => {
    process.env.TELEGRAM_BOT_TOKEN = botToken;
    const app = buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/telegram/validate-init-data",
      payload: { initData: `${validInitData()}tampered=true` },
    });

    assert.equal(response.statusCode, 401);
    assert.deepEqual(response.json(), {
      valid: false,
      error: "invalid_telegram_init_data",
    });

    await app.close();
  });

  it("returns 503 when Telegram validation is not configured", async () => {
    const app = buildApp();

    const response = await app.inject({
      method: "POST",
      url: "/telegram/validate-init-data",
      payload: { initData: validInitData() },
    });

    assert.equal(response.statusCode, 503);
    assert.deepEqual(response.json(), {
      valid: false,
      error: "telegram_validation_not_configured",
    });

    await app.close();
  });
});
