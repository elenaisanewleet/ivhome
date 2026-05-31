import { createHmac } from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";

import { validateTelegramInitData } from "./telegram-init-data.js";

const BOT_TOKEN = "123456:test-token";
const NOW_SECONDS = 1_750_000_000;
const NOW = new Date(NOW_SECONDS * 1_000);

function signedInitData(entries: Record<string, string>, token = BOT_TOKEN) {
  const params = new URLSearchParams(entries);
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(token).digest();
  const hash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  params.set("hash", hash);
  return params.toString();
}

function fixture(authDate = NOW_SECONDS) {
  return signedInitData({
    auth_date: String(authDate),
    query_id: "AAHdF6IQAAAAAN0XohDhrOrc",
    user: JSON.stringify({
      id: 42,
      first_name: "Demo",
      last_name: "User",
      username: "demo_user",
      language_code: "ru",
      allows_write_to_pm: true,
    }),
  });
}

test("accepts a valid initData fixture and exposes only minimal identity", () => {
  assert.deepEqual(validateTelegramInitData(fixture(), { botToken: BOT_TOKEN, now: NOW }), {
    valid: true,
    authDate: NOW_SECONDS,
    identity: { id: 42, firstName: "Demo", lastName: "User", username: "demo_user" },
  });
});

test("rejects missing hash", () => {
  assert.deepEqual(validateTelegramInitData("auth_date=1750000000", { botToken: BOT_TOKEN, now: NOW }), {
    valid: false,
    error: "missing_hash",
  });
});

test("rejects malformed hash", () => {
  assert.deepEqual(validateTelegramInitData("auth_date=1750000000&hash=not-a-hash", { botToken: BOT_TOKEN, now: NOW }), {
    valid: false,
    error: "malformed_hash",
  });
});

test("rejects tampered initData", () => {
  const tampered = fixture().replace("demo_user", "tampered_user");
  assert.deepEqual(validateTelegramInitData(tampered, { botToken: BOT_TOKEN, now: NOW }), {
    valid: false,
    error: "invalid_signature",
  });
});

test("rejects expired auth_date", () => {
  assert.deepEqual(validateTelegramInitData(fixture(NOW_SECONDS - 86_401), { botToken: BOT_TOKEN, now: NOW }), {
    valid: false,
    error: "expired_auth_date",
  });
});

test("allows a configurable max age", () => {
  assert.equal(validateTelegramInitData(fixture(NOW_SECONDS - 60), {
    botToken: BOT_TOKEN,
    maxAgeSeconds: 60,
    now: NOW,
  }).valid, true);
});

test("rejects future auth_date", () => {
  assert.deepEqual(validateTelegramInitData(fixture(NOW_SECONDS + 1), { botToken: BOT_TOKEN, now: NOW }), {
    valid: false,
    error: "future_auth_date",
  });
});
