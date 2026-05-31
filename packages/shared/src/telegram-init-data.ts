import { createHmac, timingSafeEqual } from "node:crypto";

export const DEFAULT_TELEGRAM_INIT_DATA_MAX_AGE_SECONDS = 24 * 60 * 60;

export interface TelegramIdentity {
  id: number;
  firstName?: string;
  lastName?: string;
  username?: string;
}

export type TelegramInitDataValidationError =
  | "missing_hash"
  | "malformed_hash"
  | "invalid_signature"
  | "missing_auth_date"
  | "malformed_auth_date"
  | "expired_auth_date"
  | "future_auth_date"
  | "malformed_user";

export type TelegramInitDataValidationResult =
  | {
      valid: true;
      authDate: number;
      identity: TelegramIdentity | null;
    }
  | {
      valid: false;
      error: TelegramInitDataValidationError;
    };

export interface ValidateTelegramInitDataOptions {
  botToken: string;
  maxAgeSeconds?: number;
  now?: Date;
}

function invalid(error: TelegramInitDataValidationError): TelegramInitDataValidationResult {
  return { valid: false, error };
}

function parseIdentity(rawUser: string | null): TelegramIdentity | null | undefined {
  if (rawUser === null) {
    return null;
  }

  let user: unknown;
  try {
    user = JSON.parse(rawUser);
  } catch {
    return undefined;
  }

  if (typeof user !== "object" || user === null) {
    return undefined;
  }

  const candidate = user as Record<string, unknown>;
  if (!Number.isSafeInteger(candidate.id)) {
    return undefined;
  }

  const identity: TelegramIdentity = { id: candidate.id as number };
  if (typeof candidate.first_name === "string") identity.firstName = candidate.first_name;
  if (typeof candidate.last_name === "string") identity.lastName = candidate.last_name;
  if (typeof candidate.username === "string") identity.username = candidate.username;

  return identity;
}

export function validateTelegramInitData(
  initData: string,
  options: ValidateTelegramInitDataOptions,
): TelegramInitDataValidationResult {
  const params = new URLSearchParams(initData);
  const hashes = params.getAll("hash");
  if (hashes.length !== 1) {
    return invalid("missing_hash");
  }

  const hash = hashes[0];
  if (hash === undefined || !/^[a-f\d]{64}$/i.test(hash)) {
    return invalid("malformed_hash");
  }

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(options.botToken).digest();
  const expectedHash = createHmac("sha256", secretKey).update(dataCheckString).digest();
  const suppliedHash = Buffer.from(hash, "hex");

  if (suppliedHash.length !== expectedHash.length || !timingSafeEqual(suppliedHash, expectedHash)) {
    return invalid("invalid_signature");
  }

  const authDates = params.getAll("auth_date");
  if (authDates.length !== 1) {
    return invalid("missing_auth_date");
  }

  const rawAuthDate = authDates[0];
  if (rawAuthDate === undefined || !/^\d+$/.test(rawAuthDate)) {
    return invalid("malformed_auth_date");
  }

  const authDate = Number(rawAuthDate);
  if (!Number.isSafeInteger(authDate)) {
    return invalid("malformed_auth_date");
  }

  const nowSeconds = Math.floor((options.now ?? new Date()).getTime() / 1000);
  const maxAgeSeconds = options.maxAgeSeconds ?? DEFAULT_TELEGRAM_INIT_DATA_MAX_AGE_SECONDS;
  if (authDate > nowSeconds) {
    return invalid("future_auth_date");
  }
  if (nowSeconds - authDate > maxAgeSeconds) {
    return invalid("expired_auth_date");
  }

  const identity = parseIdentity(params.get("user"));
  if (identity === undefined) {
    return invalid("malformed_user");
  }

  return { valid: true, authDate, identity };
}
