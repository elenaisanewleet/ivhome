/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { buildApp, setPrismaForTesting } from "../src/app.js";

type RequestRow = {
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
  status: "WAITING" | "PRICE_LOCK" | "DISPATCHED" | "COMPLETED" | "DECLINED";
  priceMin: number | null;
  priceMax: number | null;
  priceCurrency: string;
  etaMinutes: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ClinicRow = {
  id: string;
  publicName: string;
  legalName: string;
  inn: string;
  status: "DRAFT" | "PENDING_REVIEW" | "ACTIVE" | "SUSPENDED" | "REJECTED";
  createdAt: Date;
  updatedAt: Date;
};

type ChatRow = {
  id: string;
  requestId: string;
  actorType: "USER" | "CLINIC" | "ADMIN";
  body: string;
  createdAt: Date;
};

function makeFakePrisma() {
  const now = () => new Date("2026-06-04T09:00:00.000Z");
  const clinics = new Map<string, ClinicRow>([
    [
      "medservice-north",
      {
        id: "medservice-north",
        publicName: "Медслужба «Север»",
        legalName: "ООО Север",
        inn: "INN-medservice-north",
        status: "ACTIVE",
        createdAt: now(),
        updatedAt: now(),
      },
    ],
    [
      "medservice-center",
      {
        id: "medservice-center",
        publicName: "Медслужба «Центр»",
        legalName: "ООО Центр",
        inn: "INN-medservice-center",
        status: "ACTIVE",
        createdAt: now(),
        updatedAt: now(),
      },
    ],
  ]);
  const requests: RequestRow[] = [];
  const messages: ChatRow[] = [];
  const accessTokens: any[] = [];
  const auditLogs: any[] = [];
  let requestCount = 0;
  let messageCount = 0;

  function clinicPayload(row: ClinicRow, include?: any) {
    return include?.mvpAccessTokens
      ? {
          ...row,
          mvpAccessTokens: accessTokens
            .filter((token) => token.clinicId === row.id)
            .map((token) => ({ status: token.status, revokedAt: token.revokedAt })),
        }
      : row;
  }

  return {
    __state: { accessTokens, auditLogs, clinics, requests },
    clinic: {
      findUnique: async ({ where, select }: { where: { id: string }; select?: Record<string, boolean> }) => {
        const row = clinics.get(where.id) ?? null;

        if (!row) return null;
        if (select) {
          return Object.fromEntries(Object.entries(select).filter(([, enabled]) => enabled).map(([key]) => [key, row[key as keyof ClinicRow]]));
        }

        return row;
      },
      findMany: async ({ include }: { where?: any; include?: any; orderBy?: any } = {}) =>
        [...clinics.values()]
          .filter((clinic) => clinic.status !== "REJECTED")
          .map((clinic) => clinicPayload(clinic, include)),
      create: async ({ data }: { data: any }) => {
        if (clinics.has(data.id) || [...clinics.values()].some((clinic) => clinic.inn === data.inn)) {
          throw { code: "P2002" };
        }

        const row: ClinicRow = { ...data, status: data.status ?? "ACTIVE", createdAt: now(), updatedAt: now() };
        clinics.set(row.id, row);

        return row;
      },
      update: async ({ where, data }: { where: { id: string }; data: any }) => {
        const row = clinics.get(where.id);

        if (!row) throw { code: "P2025" };

        const updated = { ...row, ...data, updatedAt: now() };
        clinics.set(where.id, updated);

        return updated;
      },
    },
    mvpClinicAccessToken: {
      create: async ({ data }: { data: any }) => {
        const row = {
          id: `tok-${accessTokens.length + 1}`,
          ...data,
          role: data.role ?? "OPERATOR",
          status: "ACTIVE",
          lastUsedAt: null,
          createdAt: now(),
          revokedAt: null,
        };
        accessTokens.push(row);
        return row;
      },
      findFirst: async ({ where, select }: { where?: any; select?: any }) => {
        const row = accessTokens.find((token) => token.id === where?.id && (!where?.clinicId || token.clinicId === where.clinicId)) ?? null;
        return row && select?.id ? { id: row.id } : row;
      },
      findMany: async ({ where, include, orderBy }: { where?: any; include?: any; orderBy?: any } = {}) => {
        const rows = accessTokens
          .filter((token) => (!where?.clinicId || token.clinicId === where.clinicId) && (!where?.status || token.status === where.status) && (where?.revokedAt === undefined || token.revokedAt === where.revokedAt))
          .map((token) => {
            const clinic = clinics.get(token.clinicId);
            return include?.clinic && clinic ? { ...token, clinic: { id: clinic.id, publicName: clinic.publicName, status: clinic.status } } : token;
          });

        return orderBy?.createdAt === "desc" ? rows.reverse() : rows;
      },
      update: async ({ where, data }: { where: { id: string }; data: any }) => {
        const row = accessTokens.find((token) => token.id === where.id);
        if (!row) throw { code: "P2025" };
        Object.assign(row, data);
        return row;
      },
    },
    auditLog: {
      create: async ({ data }: { data: any }) => {
        auditLogs.push({ id: `audit-${auditLogs.length + 1}`, ...data, createdAt: now() });
        return auditLogs.at(-1);
      },
      findMany: async () => auditLogs,
    },
    mvpRequest: {
      create: async ({ data }: { data: Pick<RequestRow, "offerId" | "clinicId" | "district" | "desiredTime" | "profile" | "serviceSlug" | "serviceLabel" | "servicePrice" | "customRequest" | "customImportant" | "budget" | "comment"> }) => {
        const row: RequestRow = {
          id: `req-${++requestCount}`,
          offerId: data.offerId,
          clinicId: data.clinicId,
          district: data.district,
          desiredTime: data.desiredTime,
          profile: data.profile,
          serviceSlug: data.serviceSlug,
          serviceLabel: data.serviceLabel,
          servicePrice: data.servicePrice,
          customRequest: data.customRequest,
          customImportant: data.customImportant,
          budget: data.budget,
          comment: data.comment,
          status: "WAITING",
          priceMin: null,
          priceMax: null,
          priceCurrency: "RUB",
          etaMinutes: null,
          notes: null,
          createdAt: now(),
          updatedAt: now(),
        };
        requests.push(row);
        return row;
      },
      findUnique: async ({ where, select }: { where: { id: string }; select?: { id?: boolean; clinicId?: boolean } }) => {
        const row = requests.find((request) => request.id === where.id) ?? null;
        if (!row) return null;
        if (select?.id && !select?.clinicId) return { id: row.id };
        if (select?.clinicId && !select?.id) return { clinicId: row.clinicId };
        if (select?.id && select?.clinicId) return { id: row.id, clinicId: row.clinicId };
        return row;
      },
      findFirst: async ({ where, select }: { where: { id: string; clinicId?: string }; select?: { id?: boolean } }) => {
        const row = requests.find((request) => request.id === where.id && (where.clinicId === undefined || request.clinicId === where.clinicId)) ?? null;
        return row && select?.id ? { id: row.id } : row;
      },
      findMany: async ({ where, orderBy }: { where?: { clinicId?: string }; orderBy?: { createdAt: "asc" | "desc" } } = {}) => {
        const filtered = where?.clinicId ? requests.filter((request) => request.clinicId === where.clinicId) : [...requests];
        return filtered.sort((left, right) => orderBy?.createdAt === "asc" ? left.createdAt.getTime() - right.createdAt.getTime() : right.createdAt.getTime() - left.createdAt.getTime());
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<RequestRow> }) => {
        const row = requests.find((request) => request.id === where.id);
        if (!row) throw { code: "P2025" };
        Object.assign(row, data, { updatedAt: now() });
        return row;
      },
    },
    mvpChatMessage: {
      create: async ({ data }: { data: Pick<ChatRow, "requestId" | "actorType" | "body"> }) => {
        const row: ChatRow = { id: `msg-${++messageCount}`, requestId: data.requestId, actorType: data.actorType, body: data.body, createdAt: now() };
        messages.push(row);
        return row;
      },
      findMany: async ({ where }: { where: { requestId: string }; orderBy?: { createdAt: "asc" } }) => messages.filter((message) => message.requestId === where.requestId),
    },
    mvpOnboarding: {
      findUnique: async () => null,
      upsert: async ({ where, create, update }: { where: { clinicId: string }; create: any; update: any }) => ({
        id: `onboarding-${where.clinicId}`,
        clinicId: where.clinicId,
        data: update.data ?? create.data,
        status: update.status ?? create.status,
        submittedAt: update.submittedAt ?? create.submittedAt ?? null,
        createdAt: now(),
        updatedAt: now(),
      }),
    },
  };
}

async function withDbApi(callback: (app: ReturnType<typeof buildApp>, prisma: ReturnType<typeof makeFakePrisma>) => Promise<void>) {
  const previousAdminToken = process.env.ADMIN_TOKEN;
  const previousClinicAuth = process.env.CLINIC_AUTH_ENABLED;
  process.env.ADMIN_TOKEN = "test-admin-token";
  process.env.CLINIC_AUTH_ENABLED = "true";
  const prisma = makeFakePrisma();
  setPrismaForTesting(prisma as never);
  const app = buildApp();

  try {
    await callback(app, prisma);
  } finally {
    await app.close();
    setPrismaForTesting(null);

    if (previousAdminToken === undefined) delete process.env.ADMIN_TOKEN;
    else process.env.ADMIN_TOKEN = previousAdminToken;

    if (previousClinicAuth === undefined) delete process.env.CLINIC_AUTH_ENABLED;
    else process.env.CLINIC_AUTH_ENABLED = previousClinicAuth;
  }
}

async function createClinicToken(app: ReturnType<typeof buildApp>, clinicId = "medservice-north") {
  const response = await app.inject({
    method: "POST",
    url: `/mvp/admin/clinics/${clinicId}/access-tokens`,
    headers: { Authorization: "Bearer test-admin-token" },
    payload: { label: "Test token" },
  });

  assert.equal(response.statusCode, 201);
  return response.json().rawToken as string;
}

async function createPersistentRequest(app: ReturnType<typeof buildApp>, clinicId = "medservice-north") {
  const response = await app.inject({
    method: "POST",
    url: "/mvp/requests",
    payload: { offerId: clinicId, clinicId, district: "САО", desiredTime: "Сегодня", profile: "Сравнить условия выезда" },
  });

  assert.equal(response.statusCode, 201);
  return response.json() as RequestRow;
}

test("admin creates a medservice and GET /mvp/admin/clinics returns the persisted DB row", async () => {
  await withDbApi(async (app) => {
    const create = await app.inject({
      method: "POST",
      url: "/mvp/admin/clinics",
      headers: { Authorization: "Bearer test-admin-token" },
      payload: {
        id: "pilot-east",
        publicName: "Медслужба «Восток»",
        legalName: "ООО Восток",
        inn: "PILOT-INN-EAST-001",
        status: "ACTIVE",
      },
    });

    assert.equal(create.statusCode, 201);
    assert.equal(create.json().id, "pilot-east");

    const list = await app.inject({ method: "GET", url: "/mvp/admin/clinics", headers: { Authorization: "Bearer test-admin-token" } });

    assert.equal(list.statusCode, 200);
    assert.equal(list.json().clinics.some((clinic: any) => clinic.id === "pilot-east" && clinic.publicName === "Медслужба «Восток»"), true);
  });
});

test("admin updates a medservice and reloading clinics returns updated fields", async () => {
  await withDbApi(async (app) => {
    await app.inject({
      method: "POST",
      url: "/mvp/admin/clinics",
      headers: { Authorization: "Bearer test-admin-token" },
      payload: { id: "pilot-west", publicName: "Медслужба W", legalName: "ООО W", inn: "PILOT-INN-WEST-001", status: "ACTIVE" },
    });

    const update = await app.inject({
      method: "PATCH",
      url: "/mvp/admin/clinics/pilot-west",
      headers: { Authorization: "Bearer test-admin-token" },
      payload: { publicName: "Медслужба «Запад»", legalName: "ООО Запад", inn: "PILOT-INN-WEST-001", status: "SUSPENDED" },
    });

    assert.equal(update.statusCode, 200);
    assert.equal(update.json().status, "SUSPENDED");

    const list = await app.inject({ method: "GET", url: "/mvp/admin/clinics", headers: { Authorization: "Bearer test-admin-token" } });
    const reloaded = list.json().clinics.find((clinic: any) => clinic.id === "pilot-west");

    assert.equal(reloaded.publicName, "Медслужба «Запад»");
    assert.equal(reloaded.status, "SUSPENDED");
  });
});

test("seed file uses idempotent upserts and does not delete manual clinics or reset access tokens", () => {
  const seed = readFileSync(new URL("../../../prisma/seed.ts", import.meta.url), "utf8");

  assert.match(seed, /tx\.clinic\.upsert/u);
  assert.doesNotMatch(seed, /clinic\.deleteMany/u);
  assert.doesNotMatch(seed, /mvpClinicAccessToken\.deleteMany/u);
  assert.doesNotMatch(seed, /mvpClinicAccessToken\.update/u);
  assert.doesNotMatch(seed, /mvpClinicAccessToken\.upsert/u);
});

test("creates a persistent request with server-derived service catalog fields and rejects unknown or mismatched offers", async () => {
  await withDbApi(async (app) => {
    const created = await createPersistentRequest(app);

    assert.equal(created.status, "WAITING");
    assert.equal(created.clinicId, "medservice-north");
    assert.equal(created.serviceSlug, "custom");
    assert.equal(created.serviceLabel, "Свой запрос");
    assert.equal(created.servicePrice, "по описанию запроса");
    assert.equal(created.customRequest, null);
    assert.equal(created.customImportant, null);
    assert.equal(created.budget, null);
    assert.equal(created.comment, null);

    const derivedService = await app.inject({
      method: "POST",
      url: "/mvp/requests",
      payload: {
        offerId: "medservice-north",
        clinicId: "medservice-north",
        district: "САО",
        desiredTime: "Сегодня",
        profile: "Сравнить условия выезда",
        serviceSlug: "urgent_visit",
        serviceLabel: "Поддельная услуга",
        servicePrice: "1 ₽",
        customRequest: "Поддельное описание",
        customImportant: "Поддельная важность",
        budget: "1 ₽",
        comment: "Поддельный комментарий",
      },
    });

    assert.equal(derivedService.statusCode, 201);
    assert.equal(derivedService.json().serviceSlug, "urgent_visit");
    assert.equal(derivedService.json().serviceLabel, "Нужен выезд сегодня");
    assert.equal(derivedService.json().servicePrice, "от 9 900 ₽");
    assert.equal(derivedService.json().customRequest, null);
    assert.equal(derivedService.json().customImportant, null);
    assert.equal(derivedService.json().budget, null);
    assert.equal(derivedService.json().comment, null);

    const customService = await app.inject({
      method: "POST",
      url: "/mvp/requests",
      payload: {
        offerId: "medservice-north",
        clinicId: "medservice-north",
        district: "САО",
        desiredTime: "Сегодня",
        profile: "Сравнить условия выезда",
        serviceSlug: "custom",
        serviceLabel: "Поддельная услуга",
        servicePrice: "1 ₽",
        customRequest: "Нужно подобрать формат",
        customImportant: "Есть ограничения по времени",
        budget: "до 12 000 ₽",
        comment: "Связаться через приложение",
      },
    });

    assert.equal(customService.statusCode, 201);
    assert.equal(customService.json().serviceSlug, "custom");
    assert.equal(customService.json().serviceLabel, "Свой запрос");
    assert.equal(customService.json().servicePrice, "по описанию запроса");
    assert.equal(customService.json().customRequest, "Нужно подобрать формат");
    assert.equal(customService.json().customImportant, "Есть ограничения по времени");
    assert.equal(customService.json().budget, "до 12 000 ₽");
    assert.equal(customService.json().comment, "Связаться через приложение");

    const unknownService = await app.inject({
      method: "POST",
      url: "/mvp/requests",
      payload: { offerId: "medservice-north", district: "САО", desiredTime: "Сегодня", profile: "Сравнить условия выезда", serviceSlug: "missing-service" },
    });

    assert.equal(unknownService.statusCode, 400);
    assert.equal(unknownService.json().code, "unknown_service_slug");

    const unknownOffer = await app.inject({
      method: "POST",
      url: "/mvp/requests",
      payload: { offerId: "missing", district: "САО", desiredTime: "Сегодня", profile: "Сравнить условия выезда" },
    });

    assert.equal(unknownOffer.statusCode, 400);
    assert.equal(unknownOffer.json().code, "unknown_offer");

    const mismatchedClinic = await app.inject({
      method: "POST",
      url: "/mvp/requests",
      payload: { offerId: "medservice-north", clinicId: "medservice-center", district: "САО", desiredTime: "Сегодня", profile: "Сравнить условия выезда" },
    });

    assert.equal(mismatchedClinic.statusCode, 400);
    assert.equal(mismatchedClinic.json().code, "offer_clinic_mismatch");
  });
});

test("supports public user chat and admin read/reply", async () => {
  await withDbApi(async (app) => {
    const created = await createPersistentRequest(app);

    const userMessage = await app.inject({ method: "POST", url: `/mvp/requests/${created.id}/chat`, payload: { body: "Здравствуйте, можно уточнить время?" } });
    assert.equal(userMessage.statusCode, 201);
    assert.equal(userMessage.json().actorType, "USER");

    const adminRead = await app.inject({ method: "GET", url: `/mvp/admin/requests/${created.id}/chat`, headers: { Authorization: "Bearer test-admin-token" } });
    assert.equal(adminRead.statusCode, 200);
    assert.equal(adminRead.json().messages.length, 1);

    const adminReply = await app.inject({ method: "POST", url: `/mvp/admin/requests/${created.id}/chat`, headers: { Authorization: "Bearer test-admin-token" }, payload: { body: "Передали выбранной медслужбе." } });
    assert.equal(adminReply.statusCode, 201);
    assert.equal(adminReply.json().actorType, "ADMIN");
  });
});

test("creates access token for newly created medservice and authenticates invite-link token", async () => {
  await withDbApi(async (app) => {
    await app.inject({
      method: "POST",
      url: "/mvp/admin/clinics",
      headers: { Authorization: "Bearer test-admin-token" },
      payload: { id: "pilot-south", publicName: "Медслужба «Юг»", legalName: "ООО Юг", inn: "PILOT-INN-SOUTH-001", status: "ACTIVE" },
    });

    const createToken = await app.inject({
      method: "POST",
      url: "/mvp/admin/clinics/pilot-south/access-tokens",
      headers: { Authorization: "Bearer test-admin-token" },
      payload: { label: "Оператор пилота" },
    });

    assert.equal(createToken.statusCode, 201);
    assert.match(createToken.json().rawToken, /^nadom_msvc_/u);

    const list = await app.inject({ method: "GET", url: "/mvp/admin/clinics", headers: { Authorization: "Bearer test-admin-token" } });
    const reloaded = list.json().clinics.find((clinic: any) => clinic.id === "pilot-south");
    assert.equal(reloaded.hasActiveAccessToken, true);

    const auth = await app.inject({ method: "POST", url: "/mvp/clinic/auth", payload: { clinicId: "pilot-south", token: createToken.json().rawToken } });
    assert.equal(auth.statusCode, 200);
    assert.equal(auth.json().clinicId, "pilot-south");
  });
});

test("scopes clinic chat and requests to the current clinic", async () => {
  await withDbApi(async (app) => {
    const northRequest = await createPersistentRequest(app, "medservice-north");
    await createPersistentRequest(app, "medservice-center");

    const northList = await app.inject({ method: "GET", url: "/mvp/clinic/requests", headers: { Authorization: `Bearer ${await createClinicToken(app, "medservice-north")}` } });
    assert.equal(northList.statusCode, 200);
    assert.equal(northList.json().requests.length, 1);
    assert.equal(northList.json().requests[0].id, northRequest.id);

    const otherClinicRead = await app.inject({ method: "GET", url: `/mvp/clinic/requests/${northRequest.id}/chat`, headers: { Authorization: `Bearer ${await createClinicToken(app, "medservice-center")}` } });
    assert.equal(otherClinicRead.statusCode, 404);

    const ownReply = await app.inject({ method: "POST", url: `/mvp/clinic/requests/${northRequest.id}/chat`, headers: { Authorization: `Bearer ${await createClinicToken(app, "medservice-north")}` }, payload: { body: "Подтверждаем получение заявки." } });
    assert.equal(ownReply.statusCode, 201);
    assert.equal(ownReply.json().actorType, "CLINIC");
  });
});

test("updates request status and quote fields from admin and clinic routes", async () => {
  await withDbApi(async (app) => {
    const created = await createPersistentRequest(app);

    const adminUpdate = await app.inject({
      method: "PATCH",
      url: `/mvp/admin/requests/${created.id}/status`,
      headers: { Authorization: "Bearer test-admin-token" },
      payload: { status: "PRICE_LOCK", priceMin: 9000, priceMax: 11000, etaMinutes: 45, notes: "Пилотная проверка" },
    });

    assert.equal(adminUpdate.statusCode, 200);
    assert.equal(adminUpdate.json().status, "PRICE_LOCK");
    assert.equal(adminUpdate.json().priceMin, 9000);

    const clinicUpdate = await app.inject({
      method: "PATCH",
      url: `/mvp/clinic/requests/${created.id}/status`,
      headers: { Authorization: `Bearer ${await createClinicToken(app, "medservice-north")}` },
      payload: { status: "DISPATCHED", etaMinutes: 30 },
    });

    assert.equal(clinicUpdate.statusCode, 200);
    assert.equal(clinicUpdate.json().status, "DISPATCHED");
    assert.equal(clinicUpdate.json().etaMinutes, 30);

    const invalidQuote = await app.inject({
      method: "PATCH",
      url: `/mvp/admin/requests/${created.id}/status`,
      headers: { Authorization: "Bearer test-admin-token" },
      payload: { status: "PRICE_LOCK", priceMin: -1 },
    });

    assert.equal(invalidQuote.statusCode, 400);
    assert.equal(invalidQuote.json().code, "invalid_request");
  });
});

test("authenticates, rejects invalid/revoked tokens, and keeps audit metadata sanitized", async () => {
  await withDbApi(async (app, prisma) => {
    const unauthorizedAdmin = await app.inject({ method: "GET", url: "/mvp/admin/clinics" });
    assert.equal(unauthorizedAdmin.statusCode, 401);

    const createToken = await app.inject({ method: "POST", url: "/mvp/admin/clinics/medservice-north/access-tokens", headers: { Authorization: "Bearer test-admin-token" }, payload: { label: "Pilot operator" } });
    assert.equal(createToken.statusCode, 201);

    const created = createToken.json();
    assert.match(created.rawToken, /^nadom_msvc_/u);
    assert.equal(created.accessToken.label, "Pilot operator");

    const listTokens = await app.inject({ method: "GET", url: "/mvp/admin/clinics/medservice-north/access-tokens", headers: { Authorization: "Bearer test-admin-token" } });
    assert.equal(listTokens.statusCode, 200);
    assert.equal(listTokens.json().accessTokens.length, 1);
    assert.equal(JSON.stringify(listTokens.json()).includes(created.rawToken), false);

    const validAuth = await app.inject({ method: "POST", url: "/mvp/clinic/auth", payload: { token: created.rawToken } });
    assert.equal(validAuth.statusCode, 200);
    assert.equal(validAuth.json().clinicId, "medservice-north");

    const invalidAuth = await app.inject({ method: "POST", url: "/mvp/clinic/auth", payload: { token: "nadom_msvc_invalid" } });
    assert.equal(invalidAuth.statusCode, 401);

    const revoked = await app.inject({ method: "POST", url: `/mvp/admin/clinics/medservice-north/access-tokens/${created.accessToken.id}/revoke`, headers: { Authorization: "Bearer test-admin-token" } });
    assert.equal(revoked.statusCode, 200);

    const revokedAuth = await app.inject({ method: "POST", url: "/mvp/clinic/auth", payload: { token: created.rawToken } });
    assert.equal(revokedAuth.statusCode, 401);
    assert.equal(JSON.stringify(prisma.__state.auditLogs).includes(created.rawToken), false);
    assert.equal(JSON.stringify(prisma.__state.auditLogs).includes("Здравствуйте"), false);
  });
});
