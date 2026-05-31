import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { validateTelegramInitData } from "./telegram-init-data.js";

const botToken = "123456:test-token";
const now = new Date("2026-05-31T12:00:00.000Z");
const authDate = Math.floor(now.getTime() / 1000);

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

function validInitData(overrides: Record<string, string> = {}): string {
  return signedInitData({
    auth_date: String(authDate),
    query_id: "demo-query-id",
    user: JSON.stringify({
      id: 900000001,
      username: "demo_user",
      first_name: "Demo",
      language_code: "ru",
    }),
    ...overrides,
  });
}

describe("validateTelegramInitData", () => {
  it("accepts valid initData and returns minimal identity", () => {
    const result = validateTelegramInitData(validInitData(), botToken, { now });

    assert.equal(result.valid, true);

    if (!result.valid) {
      throw new Error("Expected valid initData");
    }

    assert.equal(result.identity?.id, 900000001);
    assert.equal(result.identity?.username, "demo_user");
    assert.equal(result.identity?.firstName, "Demo");
    assert.equal(result.identity?.languageCode, "ru");
  });

  it("rejects missing hash", () => {
    const result = validateTelegramInitData(`auth_date=${authDate}`, botToken, { now });

    assert.deepEqual(result, { valid: false, reason: "missing_hash" });
  });

  it("rejects malformed hash", () => {
    const result = validateTelegramInitData(`auth_date=${authDate}&hash=not-a-hash`, botToken, { now });

    assert.deepEqual(result, { valid: false, reason: "malformed_hash" });
  });

  it("rejects tampered initData", () => {
    const raw = validInitData().replace("demo_user", "attacker");
    const result = validateTelegramInitData(raw, botToken, { now });

    assert.deepEqual(result, { valid: false, reason: "invalid_signature" });
  });

  it("rejects expired auth_date", () => {
    const raw = validInitData({ auth_date: String(authDate - 90_000) });
    const result = validateTelegramInitData(raw, botToken, { now });

    assert.deepEqual(result, { valid: false, reason: "expired" });
  });

  it("rejects future auth_date", () => {
    const raw = validInitData({ auth_date: String(authDate + 10) });
    const result = validateTelegramInitData(raw, botToken, { now });

    assert.deepEqual(result, { valid: false, reason: "future_auth_date" });
  });

  it("uses configurable max age", () => {
    const raw = validInitData({ auth_date: String(authDate - 30) });
    const result = validateTelegramInitData(raw, botToken, { now, maxAgeSeconds: 10 });

    assert.deepEqual(result, { valid: false, reason: "expired" });
  });
});
