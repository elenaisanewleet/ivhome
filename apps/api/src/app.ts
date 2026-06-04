import { randomUUID } from "node:crypto";

import Fastify from "fastify";

import { PROJECT_NAME } from "@ivhome/shared";
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
    name: "Медицинская организация «Север»",
    status: "лицензия проверена",
    zone: "САО · СЗАО · рядом",
    responseTime: "~10 мин",
    arrivalTime: "~40 мин",
    price: "от 8 500 ₽",
    finalPrice: "9 200 ₽",
    rating: "4.8",
    conditions: ["выезд после подтверждения", "условия можно уточнить в чате"],
    note: "детали и стоимость подтверждает выбранная организация",
  },
  {
    id: "medservice-center",
    name: "Медицинская организация «Центр»",
    status: "лицензия проверена",
    zone: "ЦАО · ЗАО · ЮЗАО",
    responseTime: "~15 мин",
    arrivalTime: "~55 мин",
    price: "от 9 200 ₽",
    finalPrice: "10 400 ₽",
    rating: "4.7",
    conditions: ["работает по зонам выезда", "стоимость подтвердят до выезда"],
    note: "детали и стоимость подтверждает выбранная организация",
  },
  {
    id: "medservice-night",
    name: "Медицинская организация «Ночь»",
    status: "проверена · принимает заявки",
    zone: "Москва · по зонам выезда",
    responseTime: "~20 мин",
    arrivalTime: "~70 мин",
    price: "от 10 500 ₽",
    finalPrice: "11 300 ₽",
    rating: "4.6",
    conditions: ["доступна в позднее время", "время зависит от зоны выезда"],
    note: "детали и стоимость подтверждает выбранная организация",
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

const dbStatuses: MvpDbStatus[] = ["WAITING", "PRICE_LOCK", "DISPATCHED", "COMPLETED", "DECLINED"];

function isMvpDbStatus(value: unknown): value is MvpDbStatus {
  return typeof value === "string" && dbStatuses.includes(value as MvpDbStatus);
}

const dbRequestCreateFields = new Set(["offerId", "clinicId", "district", "desiredTime", "profile"]);

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
    (value.clinicId === undefined || isShortText(value.clinicId, 80))
  );
}

const dbStatusUpdateAllowedFields = new Set(["status", "priceMin", "priceMax", "etaMinutes", "notes"]);

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

  if (value.priceMin !== undefined && typeof value.priceMin !== "number") {
    return false;
  }

  if (value.priceMax !== undefined && typeof value.priceMax !== "number") {
    return false;
  }

  if (value.etaMinutes !== undefined && typeof value.etaMinutes !== "number") {
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

// ─── Token auth helpers ──────────────────────────────────────────────────────

function checkAdminToken(authHeader: string | undefined): boolean {
  const adminToken = process.env.ADMIN_TOKEN;

  // If no token configured and MVP dev API is enabled, allow without auth (local dev)
  if (!adminToken && isMvpDevApiEnabled()) {
    return true;
  }

  if (!adminToken) {
    return false;
  }

  if (!authHeader) {
    return false;
  }

  const match = /^Bearer (.+)$/u.exec(authHeader);

  if (!match) {
    return false;
  }

  return match[1] === adminToken;
}

// ─── Lazy Prisma client — only imported when DB routes are used ───────────────

let _prisma: import("@prisma/client").PrismaClient | null = null;

async function getPrisma(): Promise<import("@prisma/client").PrismaClient> {
  if (!_prisma) {
    const { PrismaClient } = await import("@prisma/client");

    _prisma = new PrismaClient();
  }

  return _prisma;
}

export function setPrismaForTesting(prisma: import("@prisma/client").PrismaClient | null) {
  _prisma = prisma;
}

function errorBody(code: string, message: string) {
  return { error: code, code, message };
}

function isPrismaKnownRequestError(error: unknown, code: string) {
  return isRecord(error) && error.code === code;
}

// ─── DB row → API shape ───────────────────────────────────────────────────────

function toMvpDbRequest(row: {
  id: string;
  offerId: string;
  clinicId: string | null;
  district: string;
  desiredTime: string;
  profile: string;
  status: MvpDbStatus;
  priceMin: number | null;
  priceMax: number | null;
  priceCurrency: string;
  etaMinutes: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): MvpDbRequest {
  return {
    id: row.id,
    offerId: row.offerId,
    clinicId: row.clinicId,
    district: row.district,
    desiredTime: row.desiredTime,
    profile: row.profile,
    status: row.status,
    priceMin: row.priceMin,
    priceMax: row.priceMax,
    priceCurrency: row.priceCurrency,
    etaMinutes: row.etaMinutes,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
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
  const app = Fastify({
    logger: true,
  });

  app.addHook("onRequest", async (request, reply) => {
    const origin = request.headers.origin;

    if (origin && allowedCorsOrigins.has(origin)) {
      reply
        .header("Access-Control-Allow-Origin", origin)
        .header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Clinic-Id")
        .header("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS")
        .header("Vary", "Origin");
    }
  });

  app.options("/*", async (_request, reply) => reply.code(204).send());

  app.get("/health/live", async () => ({
    status: "ok",
    service,
  }));

  app.get("/health/ready", async () => ({
    status: "ok",
    service,
    checks: {
      process: "ok",
    },
  }));

  app.post<{ Body: { initData?: unknown } }>(
    "/telegram/init-data/validate",
    async (request, reply) => {
      const initData = request.body?.initData;

      if (typeof initData !== "string") {
        return reply.code(400).send({ valid: false });
      }

      const result = validateTelegramInitData(
        initData,
        process.env.TELEGRAM_BOT_TOKEN ?? "",
      );

      if (!result.valid) {
        return reply.code(401).send({ valid: false });
      }

      return { valid: true };
    },
  );

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

    return {
      requests: [...requestStore.values()].sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    } satisfies MvpRequestListResponse;
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

    // In-memory preview contract only. Do not add chat, medical, contact, or Telegram data here.
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

    const updatedRecord = {
      ...record,
      status: request.body.status,
      updatedAt: new Date().toISOString(),
    } satisfies MvpRequestRecord;

    requestStore.set(updatedRecord.requestId, updatedRecord);

    return toStatusResponse(updatedRecord);
  });

  // ─── Postgres-backed MVP routes ────────────────────────────────────────────

  // Public: list offers (from static data — DB offers sync is a follow-up)
  app.get("/mvp/offers", async () => {
    return { offers: mvpOffers } satisfies MvpOffersResponse;
  });

  // Public (MVP): create a request persisted to Postgres
  app.post<{ Body: unknown }>("/mvp/requests", async (request, reply) => {
    if (!isMvpDbRequestCreateInput(request.body)) {
      return reply.code(400).send(errorBody("invalid_request", "Request body is invalid."));
    }

    const input = request.body;

    try {
      const db = await getPrisma();
      if (input.clinicId) {
        const clinic = await db.clinic.findUnique({
          where: { id: input.clinicId },
          select: { id: true },
        });

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
        },
      });

      return reply.code(201).send(toMvpDbRequest(row));
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  // Public (MVP): get request status — no sensitive data exposed
  app.get<{ Params: { id: string } }>("/mvp/requests/:id", async (request, reply) => {
    try {
      const db = await getPrisma();
      const row = await db.mvpRequest.findUnique({
        where: { id: request.params.id },
      });

      if (!row) {
        return reply.code(404).send(errorBody("request_not_found", "Request was not found."));
      }

      // Return only non-sensitive fields
      return {
        id: row.id,
        offerId: row.offerId,
        status: row.status as MvpDbStatus,
        priceMin: row.priceMin,
        priceMax: row.priceMax,
        priceCurrency: row.priceCurrency,
        etaMinutes: row.etaMinutes,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
      };
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  // Chat: get messages for a request (body only, no phone/address)
  app.get<{ Params: { id: string } }>("/mvp/requests/:id/chat", async (request, reply) => {
    try {
      const db = await getPrisma();
      const exists = await db.mvpRequest.findUnique({
        where: { id: request.params.id },
        select: { id: true },
      });

      if (!exists) {
        return reply.code(404).send(errorBody("request_not_found", "Request was not found."));
      }

      const rows = await db.mvpChatMessage.findMany({
        where: { requestId: request.params.id },
        orderBy: { createdAt: "asc" },
      });

      return {
        messages: rows.map((row) => toMvpChatMessage({ ...row, actorType: row.actorType as MvpChatActorType })),
      } satisfies MvpChatMessagesResponse;
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  // Chat: add a user message. Dashboards use scoped admin/clinic chat routes below.
  app.post<{ Body: unknown; Params: { id: string } }>("/mvp/requests/:id/chat", async (request, reply) => {
    if (!isMvpChatMessagePublicCreateInput(request.body)) {
      return reply.code(400).send(errorBody("invalid_request", "Request body is invalid."));
    }

    const input = request.body;

    try {
      const db = await getPrisma();
      const exists = await db.mvpRequest.findUnique({
        where: { id: request.params.id },
        select: { id: true },
      });

      if (!exists) {
        return reply.code(404).send(errorBody("request_not_found", "Request was not found."));
      }

      const row = await db.mvpChatMessage.create({
        data: {
          requestId: request.params.id,
          actorType: "USER",
          body: input.body,
        },
      });

      return reply.code(201).send(toMvpChatMessage({ ...row, actorType: row.actorType as MvpChatActorType }));
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  // Admin: list all DB requests (requires ADMIN_TOKEN or local dev)
  app.get("/mvp/admin/requests", async (request, reply) => {
    if (!checkAdminToken(request.headers.authorization)) {
      return reply.code(401).send(errorBody("unauthorized", "Admin authorization is required."));
    }

    try {
      const db = await getPrisma();
      const rows = await db.mvpRequest.findMany({
        orderBy: { createdAt: "desc" },
      });

      return { requests: rows.map(toMvpDbRequest) };
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  // Admin: update request status
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

      return toMvpDbRequest(row);
    } catch (error) {
      if (isPrismaKnownRequestError(error, "P2025")) {
        return reply.code(404).send(errorBody("request_not_found", "Request was not found."));
      }

      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  // Admin: read request chat
  app.get<{ Params: { id: string } }>("/mvp/admin/requests/:id/chat", async (request, reply) => {
    if (!checkAdminToken(request.headers.authorization)) {
      return reply.code(401).send(errorBody("unauthorized", "Admin authorization is required."));
    }

    try {
      const db = await getPrisma();
      const exists = await db.mvpRequest.findUnique({
        where: { id: request.params.id },
        select: { id: true },
      });

      if (!exists) {
        return reply.code(404).send(errorBody("request_not_found", "Request was not found."));
      }

      const rows = await db.mvpChatMessage.findMany({
        where: { requestId: request.params.id },
        orderBy: { createdAt: "asc" },
      });

      return {
        messages: rows.map((row) => toMvpChatMessage({ ...row, actorType: row.actorType as MvpChatActorType })),
      } satisfies MvpChatMessagesResponse;
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  // Admin: reply to request chat
  app.post<{ Body: unknown; Params: { id: string } }>("/mvp/admin/requests/:id/chat", async (request, reply) => {
    if (!checkAdminToken(request.headers.authorization)) {
      return reply.code(401).send(errorBody("unauthorized", "Admin authorization is required."));
    }

    if (!isMvpChatMessagePublicCreateInput(request.body)) {
      return reply.code(400).send(errorBody("invalid_request", "Request body is invalid."));
    }

    try {
      const db = await getPrisma();
      const exists = await db.mvpRequest.findUnique({
        where: { id: request.params.id },
        select: { id: true },
      });

      if (!exists) {
        return reply.code(404).send(errorBody("request_not_found", "Request was not found."));
      }

      const row = await db.mvpChatMessage.create({
        data: {
          requestId: request.params.id,
          actorType: "ADMIN",
          body: request.body.body,
        },
      });

      return reply.code(201).send(toMvpChatMessage({ ...row, actorType: row.actorType as MvpChatActorType }));
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  // Clinic: list requests for a clinic (requires X-Clinic-Id header)
  app.get("/mvp/clinic/requests", async (request, reply) => {
    const clinicId = request.headers["x-clinic-id"];

    if (typeof clinicId !== "string" || !clinicId) {
      return reply.code(401).send(errorBody("unauthorized", "Clinic authorization is required."));
    }

    const clinicAuthEnabled = process.env.CLINIC_AUTH_ENABLED === "true";

    try {
      const db = await getPrisma();

      // Validate clinic exists if auth is enabled
      if (clinicAuthEnabled) {
        const clinic = await db.clinic.findUnique({
          where: { id: clinicId },
          select: { id: true },
        });

        if (!clinic) {
          return reply.code(404).send(errorBody("clinic_not_found", "Clinic was not found."));
        }
      }

      const rows = await db.mvpRequest.findMany({
        where: { clinicId },
        orderBy: { createdAt: "desc" },
      });

      return { requests: rows.map(toMvpDbRequest) };
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  // Clinic: update only own request status
  app.patch<{ Body: unknown; Params: { id: string } }>("/mvp/clinic/requests/:id/status", async (request, reply) => {
    const clinicId = request.headers["x-clinic-id"];

    if (typeof clinicId !== "string" || !clinicId) {
      return reply.code(401).send(errorBody("unauthorized", "Clinic authorization is required."));
    }

    if (!isMvpDbStatusUpdateInput(request.body)) {
      return reply.code(400).send(errorBody("invalid_request", "Request body is invalid."));
    }

    const input = request.body;

    try {
      const db = await getPrisma();
      const exists = await db.mvpRequest.findFirst({
        where: { id: request.params.id, clinicId },
        select: { id: true },
      });

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

      return toMvpDbRequest(row);
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  // Clinic: read only own request chat
  app.get<{ Params: { id: string } }>("/mvp/clinic/requests/:id/chat", async (request, reply) => {
    const clinicId = request.headers["x-clinic-id"];

    if (typeof clinicId !== "string" || !clinicId) {
      return reply.code(401).send(errorBody("unauthorized", "Clinic authorization is required."));
    }

    try {
      const db = await getPrisma();
      const exists = await db.mvpRequest.findFirst({
        where: { id: request.params.id, clinicId },
        select: { id: true },
      });

      if (!exists) {
        return reply.code(404).send(errorBody("request_not_found", "Request was not found."));
      }

      const rows = await db.mvpChatMessage.findMany({
        where: { requestId: request.params.id },
        orderBy: { createdAt: "asc" },
      });

      return {
        messages: rows.map((row) => toMvpChatMessage({ ...row, actorType: row.actorType as MvpChatActorType })),
      } satisfies MvpChatMessagesResponse;
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  // Clinic: reply only to own request chat
  app.post<{ Body: unknown; Params: { id: string } }>("/mvp/clinic/requests/:id/chat", async (request, reply) => {
    const clinicId = request.headers["x-clinic-id"];

    if (typeof clinicId !== "string" || !clinicId) {
      return reply.code(401).send(errorBody("unauthorized", "Clinic authorization is required."));
    }

    if (!isMvpChatMessagePublicCreateInput(request.body)) {
      return reply.code(400).send(errorBody("invalid_request", "Request body is invalid."));
    }

    try {
      const db = await getPrisma();
      const exists = await db.mvpRequest.findFirst({
        where: { id: request.params.id, clinicId },
        select: { id: true },
      });

      if (!exists) {
        return reply.code(404).send(errorBody("request_not_found", "Request was not found."));
      }

      const row = await db.mvpChatMessage.create({
        data: {
          requestId: request.params.id,
          actorType: "CLINIC",
          body: request.body.body,
        },
      });

      return reply.code(201).send(toMvpChatMessage({ ...row, actorType: row.actorType as MvpChatActorType }));
    } catch {
      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  // Onboarding: save/update onboarding form for a clinic
  app.post<{ Body: unknown; Params: { clinicId: string } }>("/mvp/admin/onboarding/:clinicId", async (request, reply) => {
    if (!checkAdminToken(request.headers.authorization)) {
      return reply.code(401).send(errorBody("unauthorized", "Admin authorization is required."));
    }

    if (!isRecord(request.body)) {
      return reply.code(400).send(errorBody("invalid_request", "Request body is invalid."));
    }

    const { clinicId } = request.params;
    const { status: submittedStatus, ...formData } = request.body;
    const onboardingStatus =
      submittedStatus === "SUBMITTED" || submittedStatus === "APPROVED" ? submittedStatus : "DRAFT";
    // Prisma requires InputJsonValue; formData is a plain object and is safe to cast.
    const jsonData = formData as import("@prisma/client").Prisma.InputJsonValue;

    try {
      const db = await getPrisma();
      const row = await db.mvpOnboarding.upsert({
        where: { clinicId },
        update: {
          data: jsonData,
          status: onboardingStatus,
          submittedAt: onboardingStatus === "SUBMITTED" || onboardingStatus === "APPROVED" ? new Date() : undefined,
        },
        create: {
          clinicId,
          data: jsonData,
          status: onboardingStatus,
          submittedAt: onboardingStatus === "SUBMITTED" || onboardingStatus === "APPROVED" ? new Date() : null,
        },
      });

      return {
        id: row.id,
        clinicId: row.clinicId,
        status: row.status,
        submittedAt: row.submittedAt?.toISOString() ?? null,
        updatedAt: row.updatedAt.toISOString(),
      };
    } catch (error) {
      if (isPrismaKnownRequestError(error, "P2003")) {
        return reply.code(404).send(errorBody("clinic_not_found", "Clinic was not found."));
      }

      return reply.code(503).send(errorBody("db_unavailable", "Database is unavailable."));
    }
  });

  app.get<{ Params: { clinicId: string } }>("/mvp/admin/onboarding/:clinicId", async (request, reply) => {
    if (!checkAdminToken(request.headers.authorization)) {
      return reply.code(401).send(errorBody("unauthorized", "Admin authorization is required."));
    }

    try {
      const db = await getPrisma();
      const row = await db.mvpOnboarding.findUnique({
        where: { clinicId: request.params.clinicId },
      });

      if (!row) {
        return reply.code(404).send(errorBody("not_found", "Resource was not found."));
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

  return app;
}
