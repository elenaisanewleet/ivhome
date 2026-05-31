import Fastify from "fastify";

import { PROJECT_NAME, validateTelegramInitData } from "@ivhome/shared";

const service = `${PROJECT_NAME}-api`;

interface BuildAppOptions {
  telegramBotToken?: string;
}

export function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({
    logger: true,
  });
  const telegramBotToken = options.telegramBotToken ?? process.env.TELEGRAM_BOT_TOKEN;

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

  app.post<{ Body: { initData?: unknown } }>("/telegram/validate-init-data", async (request, reply) => {
    if (!telegramBotToken) {
      return reply.code(503).send({ valid: false });
    }

    if (typeof request.body?.initData !== "string") {
      return reply.code(400).send({ valid: false });
    }

    const result = validateTelegramInitData(request.body.initData, { botToken: telegramBotToken });
    if (!result.valid) {
      return reply.code(401).send({ valid: false });
    }

    return { valid: true, identity: result.identity };
  });

  return app;
}
