ALTER TYPE "MvpRequestStatus" ADD VALUE IF NOT EXISTS 'SUBMITTED' BEFORE 'WAITING';

ALTER TABLE "MvpRequest"
  ADD COLUMN IF NOT EXISTS "anonymousSessionId" TEXT,
  ADD COLUMN IF NOT EXISTS "telegramUserId" BIGINT,
  ADD COLUMN IF NOT EXISTS "internalNote" TEXT;

ALTER TABLE "MvpRequest" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';

CREATE INDEX IF NOT EXISTS "MvpRequest_anonymousSessionId_idx" ON "MvpRequest"("anonymousSessionId");
CREATE INDEX IF NOT EXISTS "MvpRequest_telegramUserId_idx" ON "MvpRequest"("telegramUserId");
