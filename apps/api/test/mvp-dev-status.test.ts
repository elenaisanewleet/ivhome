import assert from "node:assert/strict";
import test from "node:test";

import { buildApp } from "../src/app.js";

async function withApi(callback: (app: ReturnType<typeof buildApp>) => Promise<void>) {
  const previousValue = process.env.ENABLE_MVP_DEV_API;
  process.env.ENABLE_MVP_DEV_API = "true";
  const app = buildApp();

  try {
    await callback(app);
  } finally {
    await app.close();

    if (previousValue === undefined) {
      delete process.env.ENABLE_MVP_DEV_API;
    } else {
      process.env.ENABLE_MVP_DEV_API = previousValue;
    }
  }
}

async function createRequest(app: ReturnType<typeof buildApp>) {
  const response = await app.inject({
    method: "POST",
    url: "/mvp/dev/requests",
    payload: {
      offerId: "medservice-north",
      district: "САО",
      desiredTime: "Сегодня",
      profile: "Сравнить условия выезда",
    },
  });

  assert.equal(response.statusCode, 201);

  return response.json().requestId as string;
}

test("lists preview requests", async () => {
  await withApi(async (app) => {
    const requestId = await createRequest(app);
    const response = await app.inject({ method: "GET", url: "/mvp/dev/requests" });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().requests.length, 1);
    assert.equal(response.json().requests[0].requestId, requestId);
    assert.equal(response.json().requests[0].status, "waiting");
  });
});

test("updates preview request status", async () => {
  await withApi(async (app) => {
    const requestId = await createRequest(app);
    const response = await app.inject({
      method: "PATCH",
      url: `/mvp/dev/requests/${requestId}/status`,
      payload: { status: "price-lock" },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.json().status, "price-lock");
  });
});

test("rejects unknown preview request status update", async () => {
  await withApi(async (app) => {
    const response = await app.inject({
      method: "PATCH",
      url: "/mvp/dev/requests/missing/status",
      payload: { status: "completed" },
    });

    assert.equal(response.statusCode, 404);
  });
});
