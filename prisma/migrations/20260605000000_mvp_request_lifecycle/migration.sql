ALTER TYPE "MvpRequestStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "MvpRequestStatus" ADD VALUE IF NOT EXISTS 'SUBMITTED';
ALTER TYPE "MvpRequestStatus" ADD VALUE IF NOT EXISTS 'MEDSERVICE_REVIEWING';
ALTER TYPE "MvpRequestStatus" ADD VALUE IF NOT EXISTS 'MEDSERVICE_ANSWERED';
ALTER TYPE "MvpRequestStatus" ADD VALUE IF NOT EXISTS 'PRICE_CONFIRMED';
ALTER TYPE "MvpRequestStatus" ADD VALUE IF NOT EXISTS 'CONFIRMED';
ALTER TYPE "MvpRequestStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "MvpRequestStatus" ADD VALUE IF NOT EXISTS 'NO_ANSWER';

ALTER TABLE "MvpRequest" ADD COLUMN IF NOT EXISTS "telegramUserId" TEXT;
ALTER TABLE "MvpRequest" ADD COLUMN IF NOT EXISTS "anonymousSessionId" TEXT;
ALTER TABLE "MvpRequest" ADD COLUMN IF NOT EXISTS "userFacingStatusText" TEXT NOT NULL DEFAULT 'Заявка создана';
ALTER TABLE "MvpRequest" ADD COLUMN IF NOT EXISTS "confirmedPrice" INTEGER;
ALTER TABLE "MvpRequest" ADD COLUMN IF NOT EXISTS "responseTimeEstimate" TEXT;
ALTER TABLE "MvpRequest" ADD COLUMN IF NOT EXISTS "arrivalAfterConfirmationEstimate" TEXT;
ALTER TABLE "MvpRequest" ADD COLUMN IF NOT EXISTS "internalNote" TEXT;
ALTER TABLE "MvpRequest" ADD COLUMN IF NOT EXISTS "supportMessages" JSONB;
ALTER TABLE "MvpRequest" ALTER COLUMN "serviceLabel" SET DEFAULT 'Описать ситуацию';
ALTER TABLE "MvpRequest" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';

CREATE INDEX IF NOT EXISTS "MvpRequest_telegramUserId_createdAt_idx" ON "MvpRequest"("telegramUserId", "createdAt");
CREATE INDEX IF NOT EXISTS "MvpRequest_anonymousSessionId_createdAt_idx" ON "MvpRequest"("anonymousSessionId", "createdAt");
