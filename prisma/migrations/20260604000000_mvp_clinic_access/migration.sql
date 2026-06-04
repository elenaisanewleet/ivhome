-- MVP medservice access layer for pilot dashboard authentication.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MVP_CLINIC_CREATE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MVP_CLINIC_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MVP_CLINIC_ACCESS_TOKEN_CREATE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MVP_CLINIC_ACCESS_TOKEN_REVOKE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MVP_CLINIC_ACCESS_TOKEN_USE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MVP_REQUEST_LIST_VIEW';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MVP_REQUEST_STATUS_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MVP_CHAT_MESSAGE_SEND';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MVP_ONBOARDING_SAVE';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'MVP_ONBOARDING_SUBMIT';

CREATE TYPE "MvpClinicAccessRole" AS ENUM ('OPERATOR', 'ADMIN');
CREATE TYPE "MvpClinicAccessTokenStatus" AS ENUM ('ACTIVE', 'REVOKED');

CREATE TABLE "MvpClinicAccessToken" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "role" "MvpClinicAccessRole" NOT NULL DEFAULT 'OPERATOR',
    "status" "MvpClinicAccessTokenStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "MvpClinicAccessToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MvpClinicAccessToken_tokenHash_key" ON "MvpClinicAccessToken"("tokenHash");
CREATE INDEX "MvpClinicAccessToken_clinicId_status_idx" ON "MvpClinicAccessToken"("clinicId", "status");
CREATE INDEX "MvpClinicAccessToken_expiresAt_idx" ON "MvpClinicAccessToken"("expiresAt");
ALTER TABLE "MvpClinicAccessToken" ADD CONSTRAINT "MvpClinicAccessToken_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
