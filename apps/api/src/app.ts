import Fastify from "fastify";

import { PROJECT_NAME } from "@ivhome/shared";

const service = `${PROJECT_NAME}-api`;

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

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

  return app;
}
