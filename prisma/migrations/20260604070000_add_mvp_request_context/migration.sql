ALTER TABLE "MvpRequest"
  ADD COLUMN "serviceSlug" TEXT NOT NULL DEFAULT 'custom',
  ADD COLUMN "serviceLabel" TEXT NOT NULL DEFAULT 'Другая медицинская услуга',
  ADD COLUMN "servicePrice" TEXT NOT NULL DEFAULT 'стоимость уточняется';
