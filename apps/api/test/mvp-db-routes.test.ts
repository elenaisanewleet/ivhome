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
  let requestCount = 0;
  let messageCount = 0;

  const now = () => new Date("2026-06-04T09:00:00.000Z");

  return {
    clinic: {
      findUnique: async ({ where }: { where: { id: string } }) => (clinics.has(where.id) ? { id: where.id } : null),
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

async function withDbApi(callback: (app: ReturnType<typeof buildApp>) => Promise<void>) {
  const previousAdminToken = process.env.ADMIN_TOKEN;
  const previousClinicAuth = process.env.CLINIC_AUTH_ENABLED;
  process.env.ADMIN_TOKEN = "test-admin-token";
  process.env.CLINIC_AUTH_ENABLED = "true";
  setPrismaForTesting(makeFakePrisma() as never);
  const app = buildApp();

  try {
    await callback(app);
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

test("creates a persistent request and rejects an unknown clinic", async () => {
  await withDbApi(async (app) => {
    const created = await createPersistentRequest(app);

    assert.equal(created.status, "WAITING");
    assert.equal(created.clinicId, "medservice-north");

    const unknownClinic = await app.inject({
      method: "POST",
      url: "/mvp/requests",
      payload: {
        offerId: "missing",
        clinicId: "missing",
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
      headers: { "X-Clinic-Id": "medservice-north" },
    });

    assert.equal(northList.statusCode, 200);
    assert.equal(northList.json().requests.length, 1);
    assert.equal(northList.json().requests[0].id, northRequest.id);

    const otherClinicRead = await app.inject({
      method: "GET",
      url: `/mvp/clinic/requests/${northRequest.id}/chat`,
      headers: { "X-Clinic-Id": "medservice-center" },
    });

    assert.equal(otherClinicRead.statusCode, 404);

    const ownReply = await app.inject({
      method: "POST",
      url: `/mvp/clinic/requests/${northRequest.id}/chat`,
      headers: { "X-Clinic-Id": "medservice-north" },
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
      headers: { "X-Clinic-Id": "medservice-north" },
      payload: { status: "DISPATCHED", etaMinutes: 30 },
    });

    assert.equal(clinicUpdate.statusCode, 200);
    assert.equal(clinicUpdate.json().status, "DISPATCHED");
    assert.equal(clinicUpdate.json().etaMinutes, 30);
  });
});
