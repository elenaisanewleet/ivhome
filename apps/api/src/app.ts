import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";

import Fastify from "fastify";
import type { FastifyReply } from "fastify";

import { MVP_SERVICE_CATALOG, PROJECT_NAME } from "@ivhome/shared";
import type {
  MvpChatActorType,
  MvpChatMessagePublicCreateInput,
  MvpChatMessagesResponse,
  MvpDbRequest,
  MvpDbRequestCreateInput,
  MvpDbRequestStatusUpdateInput,
  MvpDbStatus,
  MvpOffer,
  MvpOffersResponse,
  MvpRequestCreateInput,
  MvpRequestCreateResponse,
  MvpRequestListResponse,
  MvpRequestRecord,
  MvpRequestStatus,
  MvpRequestStatusResponse,
  MvpRequestStatusUpdateInput,
} from "@ivhome/shared";
import type {
  AuditAction,
  ClinicStatus,
  MvpClinicAccessRole,
  MvpClinicAccessTokenStatus,
  Prisma,
  PrismaClient,
} from "@prisma/client";

import { validateTelegramInitData } from "./telegram/init-data.js";

const service = `${PROJECT_NAME}-api`;
const allowedCorsOrigins = new Set(
  (process.env.CORS_ORIGINS ?? "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
);

const mvpOffers: MvpOffer[] = [
  {
    id: "medservice-north",
    name: "Медслужба «Север»",
    status: "лицензия проверена",
    zone: "САО · СЗАО · рядом",
    responseTime: "~10 мин",
    arrivalTime: "~40 мин",
    price: "от 8 500 ₽",
    finalPrice: "9 200 ₽",
    rating: "4.8",
    conditions: ["выезд после подтверждения", "условия можно уточнить в чате"],
    note: "детали и стоимость подтверждает выбранная медслужба",
  },
  {
    id: "medservice-center",
    name: "Медслужба «Центр»",
    status: "лицензия проверена",
    zone: "ЦАО · ЗАО · ЮЗАО",
    responseTime: "~15 мин",
    arrivalTime: "~55 мин",
    price: "от 9 200 ₽",
    finalPrice: "10 400 ₽",
    rating: "4.7",
    conditions: ["работает по зонам выезда", "стоимость подтвердят до выезда"],
    note: "детали и стоимость подтверждает выбранная медслужба",
  },
  {
    id: "medservice-night",
    name: "Медслужба «Ночь»",
    status: "проверена · принимает заявки",
    zone: "Москва · по зонам выезда",
    responseTime: "~20 мин",
    arrivalTime: "~70 мин",
    price: "от 10 500 ₽",
    finalPrice: "11 300 ₽",
    rating: "4.6",
    conditions: ["доступна в позднее время", "время зависит от зоны выезда"],
    note: "детали и стоимость подтверждает выбранная медслужба",
  },
];

// ─── In-memory store (dev preview, reset on restart) ────────────────────────

const requestStore = new Map<string, MvpRequestRecord>();
const requestFields = new Set(["offerId", "district", "desiredTime", "profile"]);
const requestStatusUpdateFields = new Set(["status"]);
const requestStatuses: MvpRequestStatus[] = ["waiting", "price-lock", "dispatched", "completed"];

function isMvpDevApiEnabled() {
  return process.env.ENABLE_MVP_DEV_API === "true";
}

function isClinicAuthEnabled() {
  return process.env.CLINIC_AUTH_ENABLED === "true";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isShortText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

function isMvpRequestStatus(value: unknown): value is MvpRequestStatus {
  return typeof value === "string" && requestStatuses.includes(value as MvpRequestStatus);
}

function isMvpRequestCreateInput(value: unknown): value is MvpRequestCreateInput {
  if (!isRecord(value) || Object.keys(value).some((key) => !requestFields.has(key))) {
    return false;
  }

  return (
    isShortText(value.offerId, 80) &&
    isShortText(value.district, 80) &&
    isShortText(value.desiredTime, 80) &&
    isShortText(value.profile, 120)
  );
}

function isMvpRequestStatusUpdateInput(value: unknown): value is MvpRequestStatusUpdateInput {
  if (!isRecord(value) || Object.keys(value).some((key) => !requestStatusUpdateFields.has(key))) {
    return false;
  }

  return isMvpRequestStatus(value.status);
}

function toStatusResponse(record: MvpRequestRecord): MvpRequestStatusResponse {
  return {
    requestId: record.requestId,
    status: record.status,
    updatedAt: record.updatedAt,
  };
}

// ─── DB-backed MVP helpers ───────────────────────────────────────────────────

const dbStatuses: MvpDbStatus[] = ["SUBMITTED", "WAITING", "PRICE_LOCK", "DISPATCHED", "COMPLETED", "DECLINED"];
const dbRequestCreateFields = new Set([
  "offerId",
  "clinicId",
  "district",
  "desiredTime",
  "profile",
  "serviceSlug",
  "serviceLabel",
  "servicePrice",
  "customRequest",
  "customImportant",
  "budget",
  "comment",
  "anonymousSessionId",
  "telegramUserId",
]);
const dbStatusUpdateAllowedFields = new Set(["status", "priceMin", "priceMax", "etaMinutes", "notes"]);
const clinicCreateAllowedFields = new Set(["id", "publicName", "legalName", "inn", "status"]);
const clinicUpdateAllowedFields = new Set(["publicName", "legalName", "inn", "status"]);
const clinicStatuses = new Set(["DRAFT", "PENDING_REVIEW", "ACTIVE", "SUSPENDED", "REJECTED"]);

function userFacingStatusText(status: MvpDbStatus) {
  switch (status) {
    case "SUBMITTED":
      return "Заявка создана";
    case "WAITING":
      return "Ждём ответ медслужбы";
    case "PRICE_LOCK":
      return "Стоимость подтверждена";
    case "DISPATCHED":
      return "Специалист выбранной медслужбы в пути";
    case "COMPLETED":
      return "Заявка завершена";
    case "DECLINED":
      return "Заявка отклонена";
  }
}

type MvpRequestOwner = { anonymousSessionId?: string; telegramUserId?: bigint };

function parseTelegramUserId(value: unknown): bigint | undefined {
  if (typeof value === "bigint") {
    return value;
  }

  if (typeof value === "number" && Number.isSafeInteger(value) && value > 0) {
    return BigInt(value);
  }

  if (typeof value === "string" && /^\d{1,20}$/u.test(value)) {
    return BigInt(value);
  }

  return undefined;
}

function parseMvpRequestOwner(value: unknown): MvpRequestOwner | null {
  if (!isRecord(value)) {
    return null;
  }

  const owner: MvpRequestOwner = {};

  if (isShortText(value.anonymousSessionId, 120)) {
    owner.anonymousSessionId = value.anonymousSessionId;
  }

  const telegramUserId = parseTelegramUserId(value.telegramUserId);

  if (telegramUserId !== undefined) {
    owner.telegramUserId = telegramUserId;
  }

  return owner.anonymousSessionId || owner.telegramUserId !== undefined ? owner : null;
}

function isMvpRequestOwnedBy(row: { anonymousSessionId?: string | null; telegramUserId?: bigint | number | string | null }, owner: MvpRequestOwner) {
  if (owner.anonymousSessionId && row.anonymousSessionId === owner.anonymousSessionId) {
    return true;
  }

  if (owner.telegramUserId !== undefined && row.telegramUserId !== null && row.telegramUserId !== undefined) {
    return parseTelegramUserId(row.telegramUserId) === owner.telegramUserId;
  }

  return false;
}

function isMvpDbStatus(value: unknown): value is MvpDbStatus {
  return typeof value === "string" && dbStatuses.includes(value as MvpDbStatus);
}

function isMvpDbRequestCreateInput(value: unknown): value is MvpDbRequestCreateInput {
  if (!isRecord(value)) {
    return false;
  }

  const keys = Object.keys(value);

  if (keys.some((key) => !dbRequestCreateFields.has(key))) {
    return false;
  }

  return (
    isShortText(value.offerId, 80) &&
    isShortText(value.district, 80) &&
    isShortText(value.desiredTime, 80) &&
    isShortText(value.profile, 120) &&
    (value.clinicId === undefined || isShortText(value.clinicId, 80)) &&
    (value.serviceSlug === undefined || isShortText(value.serviceSlug, 80)) &&
    (value.serviceLabel === undefined || isShortText(value.serviceLabel, 120)) &&
    (value.servicePrice === undefined || isShortText(value.servicePrice, 120)) &&
    (value.customRequest === undefined || isShortText(value.customRequest, 500)) &&
    (value.customImportant === undefined || isShortText(value.customImportant, 500)) &&
    (value.budget === undefined || isShortText(value.budget, 120)) &&
    (value.comment === undefined || isShortText(value.comment, 1000)) &&
    (value.anonymousSessionId === undefined || isShortText(value.anonymousSessionId, 120)) &&
    (value.telegramUserId === undefined || parseTelegramUserId(value.telegramUserId) !== undefined)
  );
}

function resolveMvpServiceContext(input: MvpDbRequestCreateInput) {
  const serviceSlug = input.serviceSlug ?? "custom";
  const catalogItem = MVP_SERVICE_CATALOG.find((item) => item.slug === serviceSlug);

  if (!catalogItem) {
    return null;
  }

  return {
    serviceSlug: catalogItem.slug,
    serviceLabel: catalogItem.label,
    servicePrice: catalogItem.price,
    customRequest: catalogItem.slug === "custom" ? input.customRequest ?? null : null,
    customImportant: catalogItem.slug === "custom" ? input.customImportant ?? null : null,
    budget: catalogItem.slug === "custom" ? input.budget ?? null : null,
    comment: catalogItem.slug === "custom" ? input.comment ?? null : null,
  };
}

function isMvpDbStatusUpdateInput(value: unknown): value is MvpDbRequestStatusUpdateInput {
  if (!isRecord(value)) {
    return false;
  }

  const keys = Object.keys(value);

  if (keys.some((key) => !dbStatusUpdateAllowedFields.has(key))) {
    return false;
  }

  if (!isMvpDbStatus(value.status)) {
    return false;
  }

  if (value.priceMin !== undefined && (typeof value.priceMin !== "number" || !Number.isFinite(value.priceMin) || value.priceMin < 0)) {
    return false;
  }

  if (value.priceMax !== undefined && (typeof value.priceMax !== "number" || !Number.isFinite(value.priceMax) || value.priceMax < 0)) {
    return false;
  }

  if (value.etaMinutes !== undefined && (typeof value.etaMinutes !== "number" || !Number.isFinite(value.etaMinutes) || value.etaMinutes < 0)) {
    return false;
  }

  if (value.notes !== undefined && !isShortText(value.notes, 1000)) {
    return false;
  }

  return true;
}

function isMvpChatMessagePublicCreateInput(value: unknown): value is MvpChatMessagePublicCreateInput {
  if (!isRecord(value)) {
    return false;
  }

  return Object.keys(value).every((key) => key === "body") && isShortText(value.body, 2000);
}

function isClinicStatus(value: unknown): value is ClinicStatus {
  return typeof value === "string" && clinicStatuses.has(value);
}

function isClinicCreateInput(value: unknown): value is { id: string; publicName: string; legalName: string; inn: string; status?: ClinicStatus } {
  if (!isRecord(value) || Object.keys(value).some((key) => !clinicCreateAllowedFields.has(key))) {
    return false;
  }

  return (
    isShortText(value.id, 80) &&
    /^[a-z0-9-]+$/u.test(value.id) &&
    isShortText(value.publicName, 120) &&
    isShortText(value.legalName, 180) &&
    isShortText(value.inn, 32) &&
    (value.status === undefined || isClinicStatus(value.status))
  );
}

function isClinicUpdateInput(value: unknown): value is { publicName?: string; legalName?: string; inn?: string; status?: ClinicStatus } {
  if (!isRecord(value) || Object.keys(value).some((key) => !clinicUpdateAllowedFields.has(key))) {
    return false;
  }

  return (
    (value.publicName === undefined || isShortText(value.publicName, 120)) &&
    (value.legalName === undefined || isShortText(value.legalName, 180)) &&
    (value.inn === undefined || isShortText(value.inn, 32)) &&
    (value.status === undefined || isClinicStatus(value.status))
  );
}

function isAccessTokenCreateInput(value: unknown): value is { label?: string; role?: MvpClinicAccessRole; expiresAt?: string } {
  if (value === undefined || value === null) {
    return true;
  }

  if (!isRecord(value) || Object.keys(value).some((key) => !["label", "role", "expiresAt"].includes(key))) {
    return false;
  }

  return (
    (value.label === undefined || isShortText(value.label, 80)) &&
    (value.role === undefined || value.role === "OPERATOR" || value.role === "ADMIN") &&
    (value.expiresAt === undefined || (typeof value.expiresAt === "string" && !Number.isNaN(Date.parse(value.expiresAt))))
  );
}

function isOnboardingStatus(value: unknown): value is "DRAFT" | "SUBMITTED" | "APPROVED" {
  return value === "DRAFT" || value === "SUBMITTED" || value === "APPROVED";
}

type ClinicRowForResponse = {
  id: string;
  publicName: string;
  legalName: string;
  inn: string;
  status: ClinicStatus;
  createdAt: Date;
  updatedAt: Date;
  mvpAccessTokens?: Array<{ status: MvpClinicAccessTokenStatus; revokedAt: Date | null }>;
};

function toClinicResponse(row: ClinicRowForResponse) {
  const activeAccessTokenCount = row.mvpAccessTokens?.filter((token) => token.status === "ACTIVE" && token.revokedAt === null).length ?? 0;

  return {
    id: row.id,
    publicName: row.publicName,
    legalName: row.legalName,
    inn: row.inn,
    status: row.status,
    activeAccessTokenCount,
    hasActiveAccessToken: activeAccessTokenCount > 0,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toAccessTokenResponse(row: {
  id: string;
  clinicId: string;
  label: string;
  role: MvpClinicAccessRole;
  status: MvpClinicAccessTokenStatus;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  revokedAt: Date | null;
}) {
  return {
    id: row.id,
    clinicId: row.clinicId,
    label: row.label,
    role: row.role,
    status: row.status,
    lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    revokedAt: row.revokedAt?.toISOString() ?? null,
  };
}

function hashSecret(secret: string): string {
  return createHash("sha256").update(secret, "utf8").digest("hex");
}

function generateClinicAccessToken(): string {
  return `nadom_msvc_${randomBytes(32).toString("base64url")}`;
}

function safeEqualHex(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

function bearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const match = /^Bearer (.+)$/u.exec(authHeader);

  return match?.[1] ?? null;
}

function auditMetadata(value: Record<string, unknown>): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function writeAuditLog(
  db: PrismaClient,
  data: {
    actorType: "CLINIC_MEMBER" | "PLATFORM_STAFF" | "SYSTEM";
    actorId?: string | null;
    action: AuditAction;
    entityType: string;
    entityId?: string | null;
    clinicId?: string | null;
    requestId?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  await db.auditLog.create({
    data: {
      actorType: data.actorType,
      actorId: data.actorId ?? null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId ?? null,
      clinicId: data.clinicId ?? null,
      requestId: data.requestId ?? null,
      metadata: data.metadata ? auditMetadata(data.metadata) : undefined,
    },
  });
}

type ClinicAccessContext = {
  clinicId: string;
  accessTokenId: string | null;
  role: MvpClinicAccessRole;
  publicName?: string;
};

async function authenticateClinicRequest(
  db: PrismaClient,
  headers: { authorization?: string; "x-clinic-id"?: string | string[]; "x-clinic-access-token"?: string | string[] },
): Promise<ClinicAccessContext | null> {
  const legacyClinicId = typeof headers["x-clinic-id"] === "string" ? headers["x-clinic-id"] : null;

  if (!isClinicAuthEnabled()) {
    if (!legacyClinicId) {
      return null;
    }

    const clinic = await db.clinic.findUnique({ where: { id: legacyClinicId }, select: { id: true, publicName: true, status: true } });

    return clinic ? { clinicId: clinic.id, accessTokenId: null, role: "OPERATOR", publicName: clinic.publicName } : null;
  }

  const suppliedToken = bearerToken(headers.authorization) ??
    (typeof headers["x-clinic-access-token"] === "string" ? headers["x-clinic-access-token"] : null);

  if (!suppliedToken) {
    return null;
  }

  const suppliedHash = hashSecret(suppliedToken);
  const rows = await db.mvpClinicAccessToken.findMany({
    where: {
      status: "ACTIVE",
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      ...(legacyClinicId ? { clinicId: legacyClinicId } : {}),
    },
    include: { clinic: { select: { id: true, publicName: true, status: true } } },
  });

  const matched = rows.find((row) => safeEqualHex(row.tokenHash, suppliedHash));

  if (!matched || matched.clinic.status !== "ACTIVE") {
    return null;
  }

  await db.mvpClinicAccessToken.update({ where: { id: matched.id }, data: { lastUsedAt: new Date() } });
  await writeAuditLog(db, {
    actorType: "CLINIC_MEMBER",
    actorId: matched.id,
    action: "MVP_CLINIC_ACCESS_TOKEN_USE",
    entityType: "MvpClinicAccessToken",
    entityId: matched.id,
    clinicId: matched.clinicId,
    metadata: { role: matched.role },
  });

  return { clinicId: matched.clinicId, accessTokenId: matched.id, role: matched.role, publicName: matched.clinic.publicName };
}

function checkAdminToken(authHeader: string | undefined): boolean {
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken && isMvpDevApiEnabled()) {
    return true;
  }

  if (!adminToken || !authHeader) {
    return false;
  }

  const match = /^Bearer (.+)$/u.exec(authHeader);

  return match?.[1] === adminToken;
}

// ─── Lazy Prisma client — only imported when DB routes are used ───────────────

let _prisma: PrismaClient | null = null;

async function getPrisma(): Promise<PrismaClient> {
  if (!_prisma) {
    const { PrismaClient } = await import("@prisma/client");

    _prisma = new PrismaClient();
  }

  return _prisma;
}

export function setPrismaForTesting(prisma: PrismaClient | null) {
  _prisma = prisma;
}

function errorBody(code: string, message: string) {
  return { error: code, code, message };
}

function isPrismaKnownRequestError(error: unknown, code: string) {
  return isRecord(error) && error.code === code;
}

type MvpRequestRow = {
  id: string;
  offerId: string;
  clinicId: string | null;
  district: string;
  desiredTime: string;
  profile: string;
  serviceSlug: string;
  serviceLabel: string;
  servicePrice: string;
  customRequest: string | null;
  customImportant: string | null;
  budget: string | null;
  comment: string | null;
  anonymousSessionId?: string | null;
  telegramUserId?: bigint | number | string | null;
  internalNote?: string | null;
  status: MvpDbStatus;
  priceMin: number | null;
  priceMax: number | null;
  priceCurrency: string;
  etaMinutes: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toMvpPublicRequest(row: MvpRequestRow): Omit<MvpDbRequest, "notes"> {
  return {
    id: row.id,
    offerId: row.offerId,
    clinicId: row.clinicId,
    district: row.district,
    desiredTime: row.desiredTime,
    profile: row.profile,
    serviceSlug: row.serviceSlug,
    serviceLabel: row.serviceLabel,
    servicePrice: row.servicePrice,
    customRequest: row.customRequest,
    customImportant: row.customImportant,
    budget: row.budget,
    comment: row.comment,
    status: row.status,
    userFacingStatusText: userFacingStatusText(row.status),
    priceMin: row.priceMin,
    priceMax: row.priceMax,
    priceCurrency: row.priceCurrency,
    etaMinutes: row.etaMinutes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toMvpAdminRequest(row: MvpRequestRow): MvpDbRequest {
  return {
    ...toMvpPublicRequest(row),
    notes: row.notes,
  };
}

function toMvpClinicRequest(row: MvpRequestRow): MvpDbRequest {
  return toMvpAdminRequest(row);
}

function toMvpChatMessage(row: {
  id: string;
  actorType: MvpChatActorType;
  body: string;
  createdAt: Date;
}) {
  return {
    id: row.id,
    actorType: row.actorType,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
  };
}

// ─── App factory ─────────────────────────────────────────────────────────────

export function buildApp() {
  const app = Fastify({ logger: true });

  app.addHook("onRequest", async (request, reply) => {
    const origin = request.headers.origin;

    if (origin && allowedCorsOrigins.has(origin)) {
      reply
        .header("Access-Control-Allow-Origin", origin)
        .header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Clinic-Id, X-Clinic-Access-Token")
        .header("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS")
        .header("Vary", "Origin");
    }
  });

  app.options("/*", async (_request, reply) => reply.code(204).send());

  app.get("/health/live", async () => ({ status: "ok", service }));
  app.get("/health/ready", async () => ({ status: "ok", service, checks: { process: "ok" } }));

  app.post<{ Body: { initData?: unknown } }>("/telegram/init-data/validate", async (request, reply) => {
    const initData = request.body?.initData;

    if (typeof initData !== "string") {
      return reply.code(400).send({ valid: false });
    }

    const result = validateTelegramInitData(initData, process.env.TELEGRAM_BOT_TOKEN ?? "");

    if (!result.valid) {
      return reply.code(401).send({ valid: false });
    }

    return { valid: true };
  });

  // ─── In-memory MVP dev routes (preview contract) ───────────────────────────

  app.get("/mvp/dev/offers", async (_request, reply) => {
    if (!isMvpDevApiEnabled()) {
      return reply.code(503).send({ error: "mvp_dev_api_disabled" });
    }

    return { offers: mvpOffers } satisfies MvpOffersResponse;
  });

  app.get("/mvp/dev/requests", async (_request, reply) => {
    if (!isMvpDevApiEnabled()) {
      return reply.code(503).send({ error: "mvp_dev_api_disabled" });
    }

    return { requests: [...requestStore.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt)) } satisfies MvpRequestListResponse;
  });

  app.post<{ Body: unknown }>("/mvp/dev/requests", async (request, reply) => {
    if (!isMvpDevApiEnabled()) {
      return reply.code(503).send({ error: "mvp_dev_api_disabled" });
    }

    if (!isMvpRequestCreateInput(request.body)) {
      return reply.code(400).send({ error: "invalid_request" });
    }

    const input = request.body;

    if (!mvpOffers.some((offer) => offer.id === input.offerId)) {
      return reply.code(400).send({ error: "unknown_offer" });
    }

    const now = new Date().toISOString();
    const record = {
      requestId: randomUUID(),
      offerId: input.offerId,
      district: input.district,
      desiredTime: input.desiredTime,
      profile: input.profile,
      status: "waiting",
      createdAt: now,
      updatedAt: now,
    } satisfies MvpRequestRecord;

    requestStore.set(record.requestId, record);

    return reply.code(201).send(toStatusResponse(record) satisfies MvpRequestCreateResponse);
  });

  app.get<{ Params: { requestId: string } }>("/mvp/dev/requests/:requestId/status", async (request, reply) => {
    if (!isMvpDevApiEnabled()) {
      return reply.code(503).send({ error: "mvp_dev_api_disabled" });
    }

    const record = requestStore.get(request.params.requestId);

    if (!record) {
      return reply.code(404).send({ error: "request_not_found" });
    }

    return toStatusResponse(record);
  });

  app.patch<{ Body: unknown; Params: { requestId: string } }>("/mvp/dev/requests/:requestId/status", async (request, reply) => {
    if (!isMvpDevApiEnabled()) {
      return reply.code(503).send({ error: "mvp_dev_api_disabled" });
    }

    if (!isMvpRequestStatusUpdateInput(request.body)) {
      return reply.code(400).send({ error: "invalid_request" });
    }

    const record = requestStore.get(request.params.requestId);

    if (!record) {
      return reply.code(404).send({ error: "request_not_found" });
    }

    const updatedRecord = { ...record, status: request.body.status, updatedAt: new Date().toISOString() } satisfies MvpRequestRecord;
    requestStore.set(updatedRecord.requestId, updatedRecord);

    return toStatusResponse(updatedRecord);
  });

  // ─── Public MVP routes ─────────────────────────────────────────────────────

  app.get("/mvp/offers", async () => ({ offers: mvpOffers } satisfies MvpOffersResponse));

  app.post<{ Body: unknown }>("/mvp/requests", async (request, reply) => {
    if (!isMvpDbRequestCreateInput(request.body)) {
      return reply.code(400).send(errorBody("invalid_request", "Request body is invalid."));
    }

    const input = request.body;
    const offer = mvpOffers.find((item) => item.id === input.offerId);
    const serviceContext = resolveMvpServiceContext(input);

    if (!serviceContext) {
      return reply.code(400).send(errorBody("unknown_service_slug", "Service slug was not found."));
    }

    if (!offer) {
      return reply.code(400).send(errorBody("unknown_offer", "Offer was not found."));
    }

    if (input.clinicId && input.clinicId !== offer.id) {
      return reply.code(400).send(errorBody("offer_clinic_mismatch", "Offer and medservice do not match."));
    }

    try {
      const db = await getPrisma();

      if (input.clinicId) {
        const clinic = await db.clinic.findUnique({ where: { id: input.clinicId }, select: { id: true } });

        if (!clinic) {
          return reply.code(404).send(errorBody("clinic_not_found", "Clinic was not found."));
        }
      }

      const row = await db.mvpRequest.create({
        data: {
          offerId: input.offerId,
          clinicId: input.clinicId ?? null,
          district: input.district,
          desiredTime: input.desiredTime,
          profile: input.profile,
          serviceSlug: serviceContext.serviceSlug,
          serviceLabel: serviceContext.serviceLabel,
          servicePrice: serviceContext.servicePrice,
          customRequest: serviceContext.customRequest,
          customImportant: serviceContext.customImportant,
          budget: serviceContext.budget,
          comment: serviceContext.comment,
          anonymousSessionId: input.anonymousSessionId ?? null,
          telegramUserId: input.telegramUserId !== undefined ? parseTelegramUserId(input.telegramUserId) : null,
          status: "SUBMITTED",
        },
      });

      return reply.code(201).send(toMvpPublicRequest(row));
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  async function findPublicOwnedRequest(db: PrismaClient, requestId: string, ownerSource: unknown, reply: FastifyReply) {
    const owner = parseMvpRequestOwner(ownerSource);

    if (!owner) {
      reply.code(403).send(errorBody("request_owner_required", "Request owner is required."));
      return null;
    }

    const row = await db.mvpRequest.findUnique({ where: { id: requestId } });

    if (!row || !isMvpRequestOwnedBy(row, owner)) {
      reply.code(404).send(errorBody("request_not_found", "Request was not found."));
      return null;
    }

    return row;
  }

  app.get<{ Params: { id: string }; Querystring: Record<string, unknown> }>("/mvp/requests/:id", async (request, reply) => {
    try {
      const db = await getPrisma();
      const row = await findPublicOwnedRequest(db, request.params.id, request.query, reply);

      if (!row) {
        return;
      }

      return toMvpPublicRequest(row);
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  app.get<{ Params: { id: string }; Querystring: Record<string, unknown> }>("/mvp/requests/:id/chat", async (request, reply) => {
    try {
      const db = await getPrisma();
      const row = await findPublicOwnedRequest(db, request.params.id, request.query, reply);

      if (!row) {
        return;
      }

      const rows = await db.mvpChatMessage.findMany({ where: { requestId: row.id }, orderBy: { createdAt: "asc" } });

      return { messages: rows.map((message) => toMvpChatMessage({ ...message, actorType: message.actorType as MvpChatActorType })) } satisfies MvpChatMessagesResponse;
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  async function createPublicSupportMessage(requestId: string, ownerSource: unknown, body: unknown, reply: FastifyReply) {
    if (!isMvpChatMessagePublicCreateInput(body)) {
      return reply.code(400).send(errorBody("invalid_request", "Request body is invalid."));
    }

    try {
      const db = await getPrisma();
      const requestRow = await findPublicOwnedRequest(db, requestId, ownerSource, reply);

      if (!requestRow) {
        return;
      }

      const row = await db.mvpChatMessage.create({ data: { requestId: requestRow.id, actorType: "USER", body: body.body } });

      return reply.code(201).send(toMvpChatMessage({ ...row, actorType: row.actorType as MvpChatActorType }));
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  }

  app.post<{ Body: unknown; Params: { id: string }; Querystring: Record<string, unknown> }>("/mvp/requests/:id/chat", async (request, reply) =>
    createPublicSupportMessage(request.params.id, request.query, request.body, reply),
  );

  app.post<{ Body: unknown; Params: { id: string }; Querystring: Record<string, unknown> }>("/mvp/requests/:id/support-message", async (request, reply) =>
    createPublicSupportMessage(request.params.id, request.query, request.body, reply),
  );

  // ─── Admin medservice access routes ────────────────────────────────────────

  app.get("/mvp/admin/clinics", async (request, reply) => {
    if (!checkAdminToken(request.headers.authorization)) {
      return reply.code(401).send(errorBody("unauthorized", "Admin authorization is required."));
    }

    try {
      const db = await getPrisma();
      const rows = await db.clinic.findMany({
        where: { status: { not: "REJECTED" } },
        include: { mvpAccessTokens: { select: { status: true, revokedAt: true } } },
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      });

      return { clinics: rows.map(toClinicResponse) };
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  app.post<{ Body: unknown }>("/mvp/admin/clinics", async (request, reply) => {
    if (!checkAdminToken(request.headers.authorization)) {
      return reply.code(401).send(errorBody("unauthorized", "Admin authorization is required."));
    }

    if (!isClinicCreateInput(request.body)) {
      return reply.code(400).send(errorBody("invalid_request", "Request body is invalid."));
    }

    try {
      const db = await getPrisma();
      const row = await db.clinic.create({
        data: {
          id: request.body.id,
          publicName: request.body.publicName,
          legalName: request.body.legalName,
          inn: request.body.inn,
          status: request.body.status ?? "ACTIVE",
        },
      });

      await writeAuditLog(db, {
        actorType: "PLATFORM_STAFF",
        action: "MVP_CLINIC_CREATE",
        entityType: "Clinic",
        entityId: row.id,
        clinicId: row.id,
        metadata: { status: row.status },
      });

      return reply.code(201).send(toClinicResponse(row));
    } catch (error) {
      if (isPrismaKnownRequestError(error, "P2002")) {
        return reply.code(409).send(errorBody("clinic_exists", "Clinic already exists."));
      }

      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  app.patch<{ Body: unknown; Params: { clinicId: string } }>("/mvp/admin/clinics/:clinicId", async (request, reply) => {
    if (!checkAdminToken(request.headers.authorization)) {
      return reply.code(401).send(errorBody("unauthorized", "Admin authorization is required."));
    }

    if (!isClinicUpdateInput(request.body)) {
      return reply.code(400).send(errorBody("invalid_request", "Request body is invalid."));
    }

    try {
      const db = await getPrisma();
      const row = await db.clinic.update({ where: { id: request.params.clinicId }, data: request.body });
      await writeAuditLog(db, {
        actorType: "PLATFORM_STAFF",
        action: "MVP_CLINIC_UPDATE",
        entityType: "Clinic",
        entityId: row.id,
        clinicId: row.id,
        metadata: { status: row.status },
      });

      return toClinicResponse(row);
    } catch (error) {
      if (isPrismaKnownRequestError(error, "P2025")) {
        return reply.code(404).send(errorBody("clinic_not_found", "Clinic was not found."));
      }

      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  app.post<{ Body: unknown; Params: { clinicId: string } }>("/mvp/admin/clinics/:clinicId/access-tokens", async (request, reply) => {
    if (!checkAdminToken(request.headers.authorization)) {
      return reply.code(401).send(errorBody("unauthorized", "Admin authorization is required."));
    }

    if (!isAccessTokenCreateInput(request.body)) {
      return reply.code(400).send(errorBody("invalid_request", "Request body is invalid."));
    }

    try {
      const db = await getPrisma();
      const clinic = await db.clinic.findUnique({ where: { id: request.params.clinicId }, select: { id: true, status: true } });

      if (!clinic) {
        return reply.code(404).send(errorBody("clinic_not_found", "Clinic was not found."));
      }

      if (clinic.status !== "ACTIVE") {
        return reply.code(409).send(errorBody("clinic_not_active", "Clinic must be active before access can be created."));
      }

      const rawToken = generateClinicAccessToken();
      const row = await db.mvpClinicAccessToken.create({
        data: {
          clinicId: request.params.clinicId,
          tokenHash: hashSecret(rawToken),
          label: request.body?.label ?? "Пилотный доступ",
          role: request.body?.role ?? "OPERATOR",
          expiresAt: request.body?.expiresAt ? new Date(request.body.expiresAt) : null,
        },
      });

      await writeAuditLog(db, {
        actorType: "PLATFORM_STAFF",
        action: "MVP_CLINIC_ACCESS_TOKEN_CREATE",
        entityType: "MvpClinicAccessToken",
        entityId: row.id,
        clinicId: row.clinicId,
        metadata: { role: row.role, expiresAt: row.expiresAt?.toISOString() ?? null },
      });

      return reply.code(201).send({ accessToken: toAccessTokenResponse(row), rawToken });
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  app.get<{ Params: { clinicId: string } }>("/mvp/admin/clinics/:clinicId/access-tokens", async (request, reply) => {
    if (!checkAdminToken(request.headers.authorization)) {
      return reply.code(401).send(errorBody("unauthorized", "Admin authorization is required."));
    }

    try {
      const db = await getPrisma();
      const rows = await db.mvpClinicAccessToken.findMany({ where: { clinicId: request.params.clinicId }, orderBy: { createdAt: "desc" } });

      return { accessTokens: rows.map(toAccessTokenResponse) };
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  app.post<{ Params: { clinicId: string; tokenId: string } }>("/mvp/admin/clinics/:clinicId/access-tokens/:tokenId/revoke", async (request, reply) => {
    if (!checkAdminToken(request.headers.authorization)) {
      return reply.code(401).send(errorBody("unauthorized", "Admin authorization is required."));
    }

    try {
      const db = await getPrisma();
      const existing = await db.mvpClinicAccessToken.findFirst({ where: { id: request.params.tokenId, clinicId: request.params.clinicId }, select: { id: true } });

      if (!existing) {
        return reply.code(404).send(errorBody("token_not_found", "Access token was not found."));
      }

      const row = await db.mvpClinicAccessToken.update({
        where: { id: request.params.tokenId },
        data: { status: "REVOKED", revokedAt: new Date() },
      });

      await writeAuditLog(db, {
        actorType: "PLATFORM_STAFF",
        action: "MVP_CLINIC_ACCESS_TOKEN_REVOKE",
        entityType: "MvpClinicAccessToken",
        entityId: row.id,
        clinicId: row.clinicId,
      });

      return toAccessTokenResponse(row);
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  app.post<{ Body: unknown }>("/mvp/admin/clinic-access/verify", async (request, reply) => {
    if (!checkAdminToken(request.headers.authorization)) {
      return reply.code(401).send(errorBody("unauthorized", "Admin authorization is required."));
    }

    if (!isRecord(request.body) || !isShortText(request.body.token, 200)) {
      return reply.code(400).send(errorBody("invalid_request", "Request body is invalid."));
    }

    try {
      const db = await getPrisma();
      const ctx = await authenticateClinicRequest(db, { authorization: `Bearer ${request.body.token}` });

      return { valid: Boolean(ctx), clinicId: ctx?.clinicId ?? null, publicName: ctx?.publicName ?? null };
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  app.post<{ Body: unknown }>("/mvp/clinic/auth", async (request, reply) => {
    if (!isRecord(request.body) || !isShortText(request.body.token, 200) || (request.body.clinicId !== undefined && !isShortText(request.body.clinicId, 80))) {
      return reply.code(400).send(errorBody("invalid_request", "Request body is invalid."));
    }

    try {
      const db = await getPrisma();
      const ctx = await authenticateClinicRequest(db, {
        authorization: `Bearer ${request.body.token}`,
        "x-clinic-id": typeof request.body.clinicId === "string" ? request.body.clinicId : undefined,
      });

      if (!ctx) {
        return reply.code(401).send(errorBody("unauthorized", "Clinic authorization is required."));
      }

      return { clinicId: ctx.clinicId, publicName: ctx.publicName ?? ctx.clinicId, role: ctx.role, tokenType: "Bearer" };
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  // ─── Admin request routes ──────────────────────────────────────────────────

  app.get("/mvp/admin/requests", async (request, reply) => {
    if (!checkAdminToken(request.headers.authorization)) {
      return reply.code(401).send(errorBody("unauthorized", "Admin authorization is required."));
    }

    try {
      const db = await getPrisma();
      const rows = await db.mvpRequest.findMany({ orderBy: { createdAt: "desc" } });
      await writeAuditLog(db, { actorType: "PLATFORM_STAFF", action: "MVP_REQUEST_LIST_VIEW", entityType: "MvpRequest", metadata: { scope: "admin", count: rows.length } });

      return { requests: rows.map(toMvpAdminRequest) };
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  app.patch<{ Body: unknown; Params: { id: string } }>("/mvp/admin/requests/:id/status", async (request, reply) => {
    if (!checkAdminToken(request.headers.authorization)) {
      return reply.code(401).send(errorBody("unauthorized", "Admin authorization is required."));
    }

    if (!isMvpDbStatusUpdateInput(request.body)) {
      return reply.code(400).send(errorBody("invalid_request", "Request body is invalid."));
    }

    const input = request.body;

    try {
      const db = await getPrisma();
      const row = await db.mvpRequest.update({
        where: { id: request.params.id },
        data: {
          status: input.status,
          ...(input.priceMin !== undefined ? { priceMin: input.priceMin } : {}),
          ...(input.priceMax !== undefined ? { priceMax: input.priceMax } : {}),
          ...(input.etaMinutes !== undefined ? { etaMinutes: input.etaMinutes } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
        },
      });

      await writeAuditLog(db, {
        actorType: "PLATFORM_STAFF",
        action: "MVP_REQUEST_STATUS_UPDATE",
        entityType: "MvpRequest",
        entityId: row.id,
        clinicId: row.clinicId,
        requestId: row.id,
        metadata: { status: row.status, hasPrice: row.priceMin !== null || row.priceMax !== null, hasEta: row.etaMinutes !== null },
      });

      return toMvpAdminRequest(row);
    } catch (error) {
      if (isPrismaKnownRequestError(error, "P2025")) {
        return reply.code(404).send(errorBody("request_not_found", "Request was not found."));
      }

      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  app.get<{ Params: { id: string } }>("/mvp/admin/requests/:id/chat", async (request, reply) => {
    if (!checkAdminToken(request.headers.authorization)) {
      return reply.code(401).send(errorBody("unauthorized", "Admin authorization is required."));
    }

    try {
      const db = await getPrisma();
      const exists = await db.mvpRequest.findUnique({ where: { id: request.params.id }, select: { id: true } });

      if (!exists) {
        return reply.code(404).send(errorBody("request_not_found", "Request was not found."));
      }

      const rows = await db.mvpChatMessage.findMany({ where: { requestId: request.params.id }, orderBy: { createdAt: "asc" } });

      return { messages: rows.map((row) => toMvpChatMessage({ ...row, actorType: row.actorType as MvpChatActorType })) } satisfies MvpChatMessagesResponse;
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  app.post<{ Body: unknown; Params: { id: string } }>("/mvp/admin/requests/:id/chat", async (request, reply) => {
    if (!checkAdminToken(request.headers.authorization)) {
      return reply.code(401).send(errorBody("unauthorized", "Admin authorization is required."));
    }

    if (!isMvpChatMessagePublicCreateInput(request.body)) {
      return reply.code(400).send(errorBody("invalid_request", "Request body is invalid."));
    }

    try {
      const db = await getPrisma();
      const exists = await db.mvpRequest.findUnique({ where: { id: request.params.id }, select: { id: true } });

      if (!exists) {
        return reply.code(404).send(errorBody("request_not_found", "Request was not found."));
      }

      const row = await db.mvpChatMessage.create({ data: { requestId: request.params.id, actorType: "ADMIN", body: request.body.body } });
      const req = await db.mvpRequest.findUnique({ where: { id: request.params.id }, select: { clinicId: true } });
      await writeAuditLog(db, { actorType: "PLATFORM_STAFF", action: "MVP_CHAT_MESSAGE_SEND", entityType: "MvpChatMessage", entityId: row.id, clinicId: req?.clinicId ?? null, requestId: request.params.id, metadata: { actorType: "ADMIN" } });

      return reply.code(201).send(toMvpChatMessage({ ...row, actorType: row.actorType as MvpChatActorType }));
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  // ─── Clinic routes ─────────────────────────────────────────────────────────

  app.get("/mvp/clinic/requests", async (request, reply) => {
    try {
      const db = await getPrisma();
      const clinic = await authenticateClinicRequest(db, request.headers);

      if (!clinic) {
        return reply.code(401).send(errorBody("unauthorized", "Clinic authorization is required."));
      }

      const rows = await db.mvpRequest.findMany({ where: { clinicId: clinic.clinicId }, orderBy: { createdAt: "desc" } });
      await writeAuditLog(db, { actorType: "CLINIC_MEMBER", actorId: clinic.accessTokenId, action: "MVP_REQUEST_LIST_VIEW", entityType: "MvpRequest", clinicId: clinic.clinicId, metadata: { count: rows.length } });

      return { clinic: { id: clinic.clinicId, publicName: clinic.publicName ?? clinic.clinicId }, requests: rows.map(toMvpClinicRequest) };
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  app.patch<{ Body: unknown; Params: { id: string } }>("/mvp/clinic/requests/:id/status", async (request, reply) => {
    if (!isMvpDbStatusUpdateInput(request.body)) {
      return reply.code(400).send(errorBody("invalid_request", "Request body is invalid."));
    }

    const input = request.body;

    try {
      const db = await getPrisma();
      const clinic = await authenticateClinicRequest(db, request.headers);

      if (!clinic) {
        return reply.code(401).send(errorBody("unauthorized", "Clinic authorization is required."));
      }

      const exists = await db.mvpRequest.findFirst({ where: { id: request.params.id, clinicId: clinic.clinicId }, select: { id: true } });

      if (!exists) {
        return reply.code(404).send(errorBody("request_not_found", "Request was not found."));
      }

      const row = await db.mvpRequest.update({
        where: { id: request.params.id },
        data: {
          status: input.status,
          ...(input.priceMin !== undefined ? { priceMin: input.priceMin } : {}),
          ...(input.priceMax !== undefined ? { priceMax: input.priceMax } : {}),
          ...(input.etaMinutes !== undefined ? { etaMinutes: input.etaMinutes } : {}),
          ...(input.notes !== undefined ? { notes: input.notes } : {}),
        },
      });

      await writeAuditLog(db, {
        actorType: "CLINIC_MEMBER",
        actorId: clinic.accessTokenId,
        action: "MVP_REQUEST_STATUS_UPDATE",
        entityType: "MvpRequest",
        entityId: row.id,
        clinicId: clinic.clinicId,
        requestId: row.id,
        metadata: { status: row.status, hasPrice: row.priceMin !== null || row.priceMax !== null, hasEta: row.etaMinutes !== null },
      });

      return toMvpClinicRequest(row);
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  app.get<{ Params: { id: string } }>("/mvp/clinic/requests/:id/chat", async (request, reply) => {
    try {
      const db = await getPrisma();
      const clinic = await authenticateClinicRequest(db, request.headers);

      if (!clinic) {
        return reply.code(401).send(errorBody("unauthorized", "Clinic authorization is required."));
      }

      const exists = await db.mvpRequest.findFirst({ where: { id: request.params.id, clinicId: clinic.clinicId }, select: { id: true } });

      if (!exists) {
        return reply.code(404).send(errorBody("request_not_found", "Request was not found."));
      }

      const rows = await db.mvpChatMessage.findMany({ where: { requestId: request.params.id }, orderBy: { createdAt: "asc" } });

      return { messages: rows.map((row) => toMvpChatMessage({ ...row, actorType: row.actorType as MvpChatActorType })) } satisfies MvpChatMessagesResponse;
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  app.post<{ Body: unknown; Params: { id: string } }>("/mvp/clinic/requests/:id/chat", async (request, reply) => {
    if (!isMvpChatMessagePublicCreateInput(request.body)) {
      return reply.code(400).send(errorBody("invalid_request", "Request body is invalid."));
    }

    try {
      const db = await getPrisma();
      const clinic = await authenticateClinicRequest(db, request.headers);

      if (!clinic) {
        return reply.code(401).send(errorBody("unauthorized", "Clinic authorization is required."));
      }

      const exists = await db.mvpRequest.findFirst({ where: { id: request.params.id, clinicId: clinic.clinicId }, select: { id: true } });

      if (!exists) {
        return reply.code(404).send(errorBody("request_not_found", "Request was not found."));
      }

      const row = await db.mvpChatMessage.create({ data: { requestId: request.params.id, actorType: "CLINIC", body: request.body.body } });
      await writeAuditLog(db, { actorType: "CLINIC_MEMBER", actorId: clinic.accessTokenId, action: "MVP_CHAT_MESSAGE_SEND", entityType: "MvpChatMessage", entityId: row.id, clinicId: clinic.clinicId, requestId: request.params.id, metadata: { actorType: "CLINIC" } });

      return reply.code(201).send(toMvpChatMessage({ ...row, actorType: row.actorType as MvpChatActorType }));
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  // ─── Onboarding ────────────────────────────────────────────────────────────

  app.get<{ Params: { clinicId: string } }>("/mvp/admin/onboarding/:clinicId", async (request, reply) => {
    if (!checkAdminToken(request.headers.authorization)) {
      return reply.code(401).send(errorBody("unauthorized", "Admin authorization is required."));
    }

    try {
      const db = await getPrisma();
      const row = await db.mvpOnboarding.findUnique({ where: { clinicId: request.params.clinicId } });

      if (!row) {
        return reply.code(404).send(errorBody("onboarding_not_found", "Onboarding form was not found."));
      }

      return {
        id: row.id,
        clinicId: row.clinicId,
        data: row.data,
        status: row.status,
        submittedAt: row.submittedAt?.toISOString() ?? null,
        updatedAt: row.updatedAt.toISOString(),
      };
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  app.post<{ Body: unknown; Params: { clinicId: string } }>("/mvp/admin/onboarding/:clinicId", async (request, reply) => {
    if (!checkAdminToken(request.headers.authorization)) {
      return reply.code(401).send(errorBody("unauthorized", "Admin authorization is required."));
    }

    if (!isRecord(request.body)) {
      return reply.code(400).send(errorBody("invalid_request", "Request body is invalid."));
    }

    const { status: submittedStatus, ...formData } = request.body;
    const onboardingStatus = isOnboardingStatus(submittedStatus) ? submittedStatus : "DRAFT";
    const submittedAt = onboardingStatus === "SUBMITTED" || onboardingStatus === "APPROVED" ? new Date() : undefined;
    const jsonData = formData as Prisma.InputJsonValue;

    try {
      const db = await getPrisma();
      const clinic = await db.clinic.findUnique({ where: { id: request.params.clinicId }, select: { id: true } });

      if (!clinic) {
        return reply.code(404).send(errorBody("clinic_not_found", "Clinic was not found."));
      }

      const row = await db.mvpOnboarding.upsert({
        where: { clinicId: request.params.clinicId },
        update: { data: jsonData, status: onboardingStatus, ...(submittedAt ? { submittedAt } : {}) },
        create: { clinicId: request.params.clinicId, data: jsonData, status: onboardingStatus, submittedAt: submittedAt ?? null },
      });

      await writeAuditLog(db, {
        actorType: "PLATFORM_STAFF",
        action: onboardingStatus === "DRAFT" ? "MVP_ONBOARDING_SAVE" : "MVP_ONBOARDING_SUBMIT",
        entityType: "MvpOnboarding",
        entityId: row.id,
        clinicId: row.clinicId,
        metadata: { status: row.status },
      });

      return {
        id: row.id,
        clinicId: row.clinicId,
        data: row.data,
        status: row.status,
        submittedAt: row.submittedAt?.toISOString() ?? null,
        updatedAt: row.updatedAt.toISOString(),
      };
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  return app;
}
