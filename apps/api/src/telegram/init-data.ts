import { createHmac, timingSafeEqual } from "node:crypto";

const DEFAULT_MAX_AGE_SECONDS = 60 * 60;
const MAX_FUTURE_SKEW_SECONDS = 60;

export type TelegramInitDataValidationResult =
  | { valid: true; authDate: number }
  | {
      valid: false;
      reason:
        | "missing_bot_token"
        | "missing_init_data"
        | "missing_hash"
        | "invalid_hash"
        | "missing_auth_date"
        | "invalid_auth_date"
        | "auth_date_in_future"
        | "auth_date_expired"
        | "hash_mismatch";
    };

type TelegramInitDataValidationOptions = {
  maxAgeSeconds?: number;
  now?: Date;
};

export function validateTelegramInitData(
  initData: string,
  botToken: string,
  options: TelegramInitDataValidationOptions = {},
): TelegramInitDataValidationResult {
  if (!botToken) {
    return { valid: false, reason: "missing_bot_token" };
  }

  if (!initData) {
    return { valid: false, reason: "missing_init_data" };
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");

  if (!hash) {
    return { valid: false, reason: "missing_hash" };
  }

  if (!/^[a-f\d]{64}$/iu.test(hash)) {
    return { valid: false, reason: "invalid_hash" };
  }

  const authDateValue = params.get("auth_date");

  if (!authDateValue) {
    return { valid: false, reason: "missing_auth_date" };
  }

  if (!/^\d+$/u.test(authDateValue)) {
    return { valid: false, reason: "invalid_auth_date" };
  }

  const authDate = Number(authDateValue);
  const nowSeconds = Math.floor((options.now ?? new Date()).getTime() / 1000);
  const maxAgeSeconds = options.maxAgeSeconds ?? DEFAULT_MAX_AGE_SECONDS;

  if (!Number.isSafeInteger(authDate)) {
    return { valid: false, reason: "invalid_auth_date" };
  }

  if (authDate > nowSeconds + MAX_FUTURE_SKEW_SECONDS) {
    return { valid: false, reason: "auth_date_in_future" };
  }

  if (nowSeconds - authDate > maxAgeSeconds) {
    return { valid: false, reason: "auth_date_expired" };
  }

  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();
  const expectedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest();
  const actualHash = Buffer.from(hash, "hex");

  if (
    actualHash.length !== expectedHash.length ||
    !timingSafeEqual(actualHash, expectedHash)
  ) {
    return { valid: false, reason: "hash_mismatch" };
  }

  return { valid: true, authDate };
}
