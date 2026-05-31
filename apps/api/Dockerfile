FROM node:22-alpine

WORKDIR /app

RUN npm install --global pnpm@10.12.4

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN pnpm install --frozen-lockfile --filter @ivhome/api...

COPY apps/api apps/api
COPY packages/shared packages/shared
RUN pnpm --filter @ivhome/api... build

EXPOSE 3000

CMD ["pnpm", "--filter", "@ivhome/api", "start"]
