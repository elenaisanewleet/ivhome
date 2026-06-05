ALTER TABLE "MvpRequest"
  ADD COLUMN "serviceSlug" TEXT NOT NULL DEFAULT 'custom',
  ADD COLUMN "serviceLabel" TEXT NOT NULL DEFAULT 'Свой запрос',
  ADD COLUMN "servicePrice" TEXT NOT NULL DEFAULT 'по описанию запроса',
  ADD COLUMN "customRequest" TEXT,
  ADD COLUMN "customImportant" TEXT,
  ADD COLUMN "budget" TEXT,
  ADD COLUMN "comment" TEXT;
