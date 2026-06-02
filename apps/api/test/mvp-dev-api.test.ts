import assert from "node:assert/strict";
import test from "node:test";

import { buildApp } from "../src/app.js";

test("keeps the MVP dev contract disabled by default", async () => {
  const previousValue = process.env.ENABLE_MVP_DEV_API;
  delete process.env.ENABLE_MVP_DEV_API;
  const app = buildApp();

  try {
    const response = await app.inject({
      method: "GET",
      url: "/mvp/dev/offers",
    });

    assert.equal(response.statusCode, 503);
    assert.deepEqual(response.json(), { error: "mvp_dev_api_disabled" });
  } finally {
    await app.close();

    if (previousValue !== undefined) {
      process.env.ENABLE_MVP_DEV_API = previousValue;
    }
  }
});

test("creates a privacy-minimized in-memory request and returns its status", async () => {
  const previousValue = process.env.ENABLE_MVP_DEV_API;
  process.env.ENABLE_MVP_DEV_API = "true";
  const app = buildApp();

  try {
    const offersResponse = await app.inject({
      method: "GET",
      url: "/mvp/dev/offers",
    });

    assert.equal(offersResponse.statusCode, 200);
    const [offer] = offersResponse.json().offers;
    assert.equal(offer.id, "medservice-north");

    const createResponse = await app.inject({
      method: "POST",
      url: "/mvp/dev/requests",
      payload: {
        offerId: offer.id,
        district: "САО",
        desiredTime: "Сегодня",
        profile: "Сравнить условия выезда",
      },
    });

    assert.equal(createResponse.statusCode, 201);
    assert.equal(createResponse.json().status, "waiting");

    const statusResponse = await app.inject({
      method: "GET",
      url: `/mvp/dev/requests/${createResponse.json().requestId}/status`,
    });

    assert.equal(statusResponse.statusCode, 200);
    assert.deepEqual(statusResponse.json(), createResponse.json());
  } finally {
    await app.close();

    if (previousValue === undefined) {
      delete process.env.ENABLE_MVP_DEV_API;
    } else {
      process.env.ENABLE_MVP_DEV_API = previousValue;
    }
  }
});

test("rejects extra request fields instead of accepting sensitive details", async () => {
  const previousValue = process.env.ENABLE_MVP_DEV_API;
  process.env.ENABLE_MVP_DEV_API = "true";
  const app = buildApp();

  try {
    const response = await app.inject({
      method: "POST",
      url: "/mvp/dev/requests",
      payload: {
        offerId: "medservice-north",
        district: "САО",
        desiredTime: "Сегодня",
        profile: "Сравнить условия выезда",
        comment: "must not be accepted",
      },
    });

    assert.equal(response.statusCode, 400);
    assert.deepEqual(response.json(), { error: "invalid_request" });
  } finally {
    await app.close();

    if (previousValue === undefined) {
      delete process.env.ENABLE_MVP_DEV_API;
    } else {
      process.env.ENABLE_MVP_DEV_API = previousValue;
    }
  }
});
