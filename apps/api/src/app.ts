import Fastify from "fastify";

import { PROJECT_NAME, validateTelegramInitData } from "@ivhome/shared";

const service = `${PROJECT_NAME}-api`;

type TelegramValidateInitDataBody = {
  initData?: unknown;
};

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

  app.post<{ Body: TelegramValidateInitDataBody }>("/telegram/validate-init-data", async (request, reply) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    if (!botToken) {
      return reply.code(503).send({
        valid: false,
        error: "telegram_validation_not_configured",
      });
    }

    if (typeof request.body?.initData !== "string" || request.body.initData.length === 0) {
      return reply.code(400).send({
        valid: false,
        error: "invalid_request",
      });
    }

    const result = validateTelegramInitData(request.body.initData, botToken);

    if (!result.valid) {
      return reply.code(401).send({
        valid: false,
        error: "invalid_telegram_init_data",
      });
    }

    return reply.send({
      valid: true,
      authDate: result.authDate.toISOString(),
      ...(result.identity ? { identity: result.identity } : {}),
    });
  });

  return app;
}
