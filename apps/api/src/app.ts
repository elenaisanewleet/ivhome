import { randomUUID } from "node:crypto";

import Fastify from "fastify";

import { PROJECT_NAME } from "@ivhome/shared";
import type {
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
    name: "Медслужба Север",
    status: "Лицензия проверена",
    zone: "САО · СЗАО · рядом",
    responseTime: "5–10 минут",
    arrivalTime: "от 40 минут",
    price: "от 8 500 ₽",
    finalPrice: "9 200 ₽",
    rating: "4.8",
    conditions: ["Выезд после подтверждения", "Условия можно уточнить в чате"],
    note: "Детали и возможность выезда подтверждает медслужба.",
  },
  {
    id: "medservice-center",
    name: "Медслужба Центр",
    status: "Лицензия проверена",
    zone: "ЦАО · ЗАО · ЮЗАО",
    responseTime: "10–15 минут",
    arrivalTime: "от 55 минут",
    price: "от 9 200 ₽",
    finalPrice: "10 400 ₽",
    rating: "4.7",
    conditions: ["Работает по зонам выезда", "Стоимость подтверждается до выезда"],
    note: "Детали и возможность выезда подтверждает медслужба.",
  },
  {
    id: "medservice-night",
    name: "Медслужба Ночь",
    status: "Проверена · принимает заявки",
    zone: "Москва · по зонам выезда",
    responseTime: "до 20 минут",
    arrivalTime: "от 70 минут",
    price: "от 10 500 ₽",
    finalPrice: "11 300 ₽",
    rating: "4.6",
    conditions: ["Доступна в позднее время", "Время зависит от зоны выезда"],
    note: "Детали и возможность выезда подтверждает медслужба.",
  },
];

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

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.addHook("onRequest", async (request, reply) => {
    const origin = request.headers.origin;

    if (origin && allowedCorsOrigins.has(origin)) {
      reply
        .header("Access-Control-Allow-Origin", origin)
        .header("Access-Control-Allow-Headers", "Content-Type")
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

  return app;
}
