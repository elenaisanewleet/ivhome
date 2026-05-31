import { createHmac, timingSafeEqual } from "node:crypto";

export const TELEGRAM_INIT_DATA_DEFAULT_MAX_AGE_SECONDS = 24 * 60 * 60;

export type TelegramInitDataIdentity = {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  languageCode?: string;
};

export type TelegramInitDataValidationResult =
  | {
      valid: true;
      authDate: Date;
      identity?: TelegramInitDataIdentity;
    }
  | {
      valid: false;
      reason:
        | "missing_hash"
        | "malformed_hash"
        | "invalid_signature"
        | "missing_auth_date"
        | "malformed_auth_date"
        | "expired"
        | "future_auth_date"
        | "malformed_user";
    };

export type ValidateTelegramInitDataOptions = {
  now?: Date;
  maxAgeSeconds?: number;
};

type TelegramUserPayload = {
  id?: unknown;
  username?: unknown;
  first_name?: unknown;
  last_name?: unknown;
  language_code?: unknown;
};

const HASH_PATTERN = /^[a-f0-9]{64}$/i;

export function validateTelegramInitData(
  rawInitData: string,
  botToken: string,
  options: ValidateTelegramInitDataOptions = {},
): TelegramInitDataValidationResult {
  const params = new URLSearchParams(rawInitData);
  const receivedHash = params.get("hash");

  if (!receivedHash) {
    return { valid: false, reason: "missing_hash" };
  }

  if (!HASH_PATTERN.test(receivedHash)) {
    return { valid: false, reason: "malformed_hash" };
  }

  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const expectedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (!constantTimeEqualHex(receivedHash, expectedHash)) {
    return { valid: false, reason: "invalid_signature" };
  }

  const authDateRaw = params.get("auth_date");

  if (!authDateRaw) {
    return { valid: false, reason: "missing_auth_date" };
  }

  if (!/^\d+$/.test(authDateRaw)) {
    return { valid: false, reason: "malformed_auth_date" };
  }

  const authDateSeconds = Number(authDateRaw);
  const now = options.now ?? new Date();
  const nowSeconds = Math.floor(now.getTime() / 1000);

  if (!Number.isSafeInteger(authDateSeconds)) {
    return { valid: false, reason: "malformed_auth_date" };
  }

  if (authDateSeconds > nowSeconds) {
    return { valid: false, reason: "future_auth_date" };
  }

  const maxAgeSeconds = options.maxAgeSeconds ?? TELEGRAM_INIT_DATA_DEFAULT_MAX_AGE_SECONDS;

  if (nowSeconds - authDateSeconds > maxAgeSeconds) {
    return { valid: false, reason: "expired" };
  }

  const identityResult = parseIdentity(params.get("user"));

  if (identityResult === "malformed") {
    return { valid: false, reason: "malformed_user" };
  }

  return {
    valid: true,
    authDate: new Date(authDateSeconds * 1000),
    ...(identityResult ? { identity: identityResult } : {}),
  };
}

function constantTimeEqualHex(receivedHex: string, expectedHex: string): boolean {
  const received = Buffer.from(receivedHex, "hex");
  const expected = Buffer.from(expectedHex, "hex");

  if (received.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(received, expected);
}

function parseIdentity(rawUser: string | null): TelegramInitDataIdentity | "malformed" | undefined {
  if (!rawUser) {
    return undefined;
  }

  let user: TelegramUserPayload;

  try {
    user = JSON.parse(rawUser) as TelegramUserPayload;
  } catch {
    return "malformed";
  }

  if (typeof user.id !== "number" || !Number.isSafeInteger(user.id)) {
    return "malformed";
  }

  return {
    id: user.id,
    ...(typeof user.username === "string" ? { username: user.username } : {}),
    ...(typeof user.first_name === "string" ? { firstName: user.first_name } : {}),
    ...(typeof user.last_name === "string" ? { lastName: user.last_name } : {}),
    ...(typeof user.language_code === "string" ? { languageCode: user.language_code } : {}),
  };
}
