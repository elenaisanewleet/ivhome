/* eslint-disable @typescript-eslint/no-explicit-any */
import assert from "node:assert/strict";
import test from "node:test";

import { buildApp, setPrismaForTesting } from "../src/app.js";

type RequestRow = {
  id: string;
  offerId: string;
  clinicId: string | null;
  district: string;
  desiredTime: string;
  profile: string;
  status: "WAITING" | "PRICE_LOCK" | "DISPATCHED" | "COMPLETED" | "DECLINED";
  priceMin: number | null;
  priceMax: number | null;
  priceCurrency: string;
  etaMinutes: number | null;
  notes: string | null;
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
  const clinics = new Set(["medservice-north", "medservice-center"]);
  const requests: RequestRow[] = [];
  const messages: ChatRow[] = [];
  const accessTokens: any[] = [];
  const auditLogs: any[] = [];
  let requestCount = 0;
  let messageCount = 0;

  const now = () => new Date("2026-06-04T09:00:00.000Z");

  return {
    __state: { accessTokens, auditLogs },
    clinic: {
      findUnique: async ({ where, select }: { where: { id: string }; select?: Record<string, boolean> }) =>
        clinics.has(where.id)
          ? select?.publicName
            ? { id: where.id, publicName: `Медслужба ${where.id}`, status: "ACTIVE" }
            : { id: where.id }
          : null,
      findMany: async () => [...clinics].map((id) => ({ id, publicName: `Медслужба ${id}`, legalName: `ООО ${id}`, inn: `INN-${id}`, status: "ACTIVE", createdAt: now(), updatedAt: now() })),
      create: async ({ data }: { data: any }) => { clinics.add(data.id); return { ...data, ogrn: null, ratingAverage: null, ratingCount: 0, createdAt: now(), updatedAt: now() }; },
      update: async ({ where, data }: { where: { id: string }; data: any }) => { if (!clinics.has(where.id)) throw { code: "P2025" }; return { id: where.id, publicName: data.publicName ?? `Медслужба ${where.id}`, legalName: data.legalName ?? `ООО ${where.id}`, inn: data.inn ?? `INN-${where.id}`, status: data.status ?? "ACTIVE", createdAt: now(), updatedAt: now() }; },
    },
    mvpClinicAccessToken: {
      create: async ({ data }: { data: any }) => {
        const row = { id: `tok-${accessTokens.length + 1}`, ...data, role: data.role ?? "OPERATOR", status: "ACTIVE", lastUsedAt: null, createdAt: now(), revokedAt: null };
        accessTokens.push(row);
        return row;
      },
      findMany: async ({ where, include }: { where?: any; include?: any }) => accessTokens
        .filter((token) => (!where?.clinicId || token.clinicId === where.clinicId) && (!where?.status || token.status === where.status) && token.revokedAt === null)
        .map((token) => include?.clinic ? { ...token, clinic: { id: token.clinicId, publicName: `Медслужба ${token.clinicId}`, status: "ACTIVE" } } : token),
      update: async ({ where, data }: { where: { id: string }; data: any }) => {
        const row = accessTokens.find((token) => token.id === where.id);
        if (!row) throw { code: "P2025" };
        Object.assign(row, data);
        return row;
      },
    },
    auditLog: {
      create: async ({ data }: { data: any }) => { auditLogs.push({ id: `audit-${auditLogs.length + 1}`, ...data, createdAt: now() }); return auditLogs.at(-1); },
      findMany: async () => auditLogs,
    },
    mvpRequest: {
      create: async ({ data }: { data: Pick<RequestRow, "offerId" | "clinicId" | "district" | "desiredTime" | "profile"> }) => {
        const row: RequestRow = {
          id: `req-${++requestCount}`,
          offerId: data.offerId,
          clinicId: data.clinicId,
          district: data.district,
          desiredTime: data.desiredTime,
          profile: data.profile,
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
      findUnique: async ({ where, select }: { where: { id: string }; select?: { id?: boolean } }) => {
        const row = requests.find((request) => request.id === where.id) ?? null;

        return row && select?.id ? { id: row.id } : row;
      },
      findFirst: async ({ where, select }: { where: { id: string; clinicId?: string }; select?: { id?: boolean } }) => {
        const row =
          requests.find((request) => request.id === where.id && (where.clinicId === undefined || request.clinicId === where.clinicId)) ??
          null;

        return row && select?.id ? { id: row.id } : row;
      },
      findMany: async ({ where, orderBy }: { where?: { clinicId?: string }; orderBy?: { createdAt: "asc" | "desc" } }) => {
        const filtered = where?.clinicId ? requests.filter((request) => request.clinicId === where.clinicId) : [...requests];

        return filtered.sort((left, right) =>
          orderBy?.createdAt === "asc"
            ? left.createdAt.getTime() - right.createdAt.getTime()
            : right.createdAt.getTime() - left.createdAt.getTime(),
        );
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<RequestRow> }) => {
        const row = requests.find((request) => request.id === where.id);

        if (!row) {
          throw { code: "P2025" };
        }

        Object.assign(row, data, { updatedAt: now() });

        return row;
      },
    },
    mvpChatMessage: {
      create: async ({ data }: { data: Pick<ChatRow, "requestId" | "actorType" | "body"> }) => {
        const row: ChatRow = {
          id: `msg-${++messageCount}`,
          requestId: data.requestId,
          actorType: data.actorType,
          body: data.body,
          createdAt: now(),
        };

        messages.push(row);

        return row;
      },
      findMany: async ({ where }: { where: { requestId: string }; orderBy?: { createdAt: "asc" } }) =>
        messages.filter((message) => message.requestId === where.requestId),
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

    if (previousAdminToken === undefined) {
      delete process.env.ADMIN_TOKEN;
    } else {
      process.env.ADMIN_TOKEN = previousAdminToken;
    }

    if (previousClinicAuth === undefined) {
      delete process.env.CLINIC_AUTH_ENABLED;
    } else {
      process.env.CLINIC_AUTH_ENABLED = previousClinicAuth;
    }
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
    payload: {
      offerId: clinicId,
      clinicId,
      district: "САО",
      desiredTime: "Сегодня",
      profile: "Сравнить условия выезда",
    },
  });

  assert.equal(response.statusCode, 201);

  return response.json() as RequestRow;
}

test("creates a persistent request and rejects unknown or mismatched offers", async () => {
  await withDbApi(async (app) => {
    const created = await createPersistentRequest(app);

    assert.equal(created.status, "WAITING");
    assert.equal(created.clinicId, "medservice-north");

    const unknownOffer = await app.inject({
      method: "POST",
      url: "/mvp/requests",
      payload: {
        offerId: "missing",
        district: "САО",
        desiredTime: "Сегодня",
        profile: "Сравнить условия выезда",
      },
    });

    assert.equal(unknownOffer.statusCode, 400);
    assert.equal(unknownOffer.json().code, "unknown_offer");

    const mismatchedClinic = await app.inject({
      method: "POST",
      url: "/mvp/requests",
      payload: {
        offerId: "medservice-north",
        clinicId: "medservice-center",
        district: "САО",
        desiredTime: "Сегодня",
        profile: "Сравнить условия выезда",
      },
    });

    assert.equal(mismatchedClinic.statusCode, 400);
    assert.equal(mismatchedClinic.json().code, "offer_clinic_mismatch");

    const unknownClinic = await app.inject({
      method: "POST",
      url: "/mvp/requests",
      payload: {
        offerId: "medservice-night",
        clinicId: "medservice-night",
        district: "САО",
        desiredTime: "Сегодня",
        profile: "Сравнить условия выезда",
      },
    });

    assert.equal(unknownClinic.statusCode, 404);
    assert.equal(unknownClinic.json().code, "clinic_not_found");
  });
});

test("supports public user chat and admin read/reply", async () => {
  await withDbApi(async (app) => {
    const created = await createPersistentRequest(app);

    const userMessage = await app.inject({
      method: "POST",
      url: `/mvp/requests/${created.id}/chat`,
      payload: { body: "Здравствуйте, можно уточнить время?" },
    });

    assert.equal(userMessage.statusCode, 201);
    assert.equal(userMessage.json().actorType, "USER");

    const adminRead = await app.inject({
      method: "GET",
      url: `/mvp/admin/requests/${created.id}/chat`,
      headers: { Authorization: "Bearer test-admin-token" },
    });

    assert.equal(adminRead.statusCode, 200);
    assert.equal(adminRead.json().messages.length, 1);

    const adminReply = await app.inject({
      method: "POST",
      url: `/mvp/admin/requests/${created.id}/chat`,
      headers: { Authorization: "Bearer test-admin-token" },
      payload: { body: "Передали выбранной организации." },
    });

    assert.equal(adminReply.statusCode, 201);
    assert.equal(adminReply.json().actorType, "ADMIN");
  });
});

test("scopes clinic chat and requests to the current clinic", async () => {
  await withDbApi(async (app) => {
    const northRequest = await createPersistentRequest(app, "medservice-north");
    await createPersistentRequest(app, "medservice-center");

    const northList = await app.inject({
      method: "GET",
      url: "/mvp/clinic/requests",
      headers: { Authorization: `Bearer ${await createClinicToken(app, "medservice-north")}` },
    });

    assert.equal(northList.statusCode, 200);
    assert.equal(northList.json().requests.length, 1);
    assert.equal(northList.json().requests[0].id, northRequest.id);

    const otherClinicRead = await app.inject({
      method: "GET",
      url: `/mvp/clinic/requests/${northRequest.id}/chat`,
      headers: { Authorization: `Bearer ${await createClinicToken(app, "medservice-center")}` },
    });

    assert.equal(otherClinicRead.statusCode, 404);

    const ownReply = await app.inject({
      method: "POST",
      url: `/mvp/clinic/requests/${northRequest.id}/chat`,
      headers: { Authorization: `Bearer ${await createClinicToken(app, "medservice-north")}` },
      payload: { body: "Подтверждаем получение заявки." },
    });

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

test("creates one-time clinic access token, authenticates, rejects invalid/revoked tokens, and keeps audit metadata sanitized", async () => {
  await withDbApi(async (app, prisma) => {
    const unauthorizedAdmin = await app.inject({ method: "GET", url: "/mvp/admin/clinics" });
    assert.equal(unauthorizedAdmin.statusCode, 401);

    const createToken = await app.inject({
      method: "POST",
      url: "/mvp/admin/clinics/medservice-north/access-tokens",
      headers: { Authorization: "Bearer test-admin-token" },
      payload: { label: "Pilot operator" },
    });

    assert.equal(createToken.statusCode, 201);
    const created = createToken.json();
    assert.match(created.rawToken, /^nadom_msvc_/u);
    assert.equal(created.accessToken.label, "Pilot operator");

    const listTokens = await app.inject({
      method: "GET",
      url: "/mvp/admin/clinics/medservice-north/access-tokens",
      headers: { Authorization: "Bearer test-admin-token" },
    });

    assert.equal(listTokens.statusCode, 200);
    assert.equal(listTokens.json().accessTokens.length, 1);
    assert.equal(JSON.stringify(listTokens.json()).includes(created.rawToken), false);

    const validAuth = await app.inject({
      method: "POST",
      url: "/mvp/clinic/auth",
      payload: { token: created.rawToken },
    });

    assert.equal(validAuth.statusCode, 200);
    assert.equal(validAuth.json().clinicId, "medservice-north");

    const invalidAuth = await app.inject({
      method: "POST",
      url: "/mvp/clinic/auth",
      payload: { token: "nadom_msvc_invalid" },
    });

    assert.equal(invalidAuth.statusCode, 401);

    const revoked = await app.inject({
      method: "POST",
      url: `/mvp/admin/clinics/medservice-north/access-tokens/${created.accessToken.id}/revoke`,
      headers: { Authorization: "Bearer test-admin-token" },
    });

    assert.equal(revoked.statusCode, 200);

    const revokedAuth = await app.inject({
      method: "POST",
      url: "/mvp/clinic/auth",
      payload: { token: created.rawToken },
    });

    assert.equal(revokedAuth.statusCode, 401);
    assert.equal(JSON.stringify(prisma.__state.auditLogs).includes(created.rawToken), false);
    assert.equal(JSON.stringify(prisma.__state.auditLogs).includes("Здравствуйте"), false);
  });
});
