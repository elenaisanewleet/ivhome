-- CreateEnum
CREATE TYPE "MvpRequestStatus" AS ENUM ('WAITING', 'PRICE_LOCK', 'DISPATCHED', 'COMPLETED', 'DECLINED');

-- CreateEnum
CREATE TYPE "MvpChatActorType" AS ENUM ('USER', 'CLINIC', 'ADMIN');

-- CreateEnum
CREATE TYPE "MvpOnboardingStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED');

-- CreateTable
CREATE TABLE "MvpRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "offerId" TEXT NOT NULL,
    "clinicId" TEXT,
    "district" TEXT NOT NULL,
    "desiredTime" TEXT NOT NULL,
    "profile" TEXT NOT NULL,
    "status" "MvpRequestStatus" NOT NULL DEFAULT 'WAITING',
    "priceMin" INTEGER,
    "priceMax" INTEGER,
    "priceCurrency" TEXT NOT NULL DEFAULT 'RUB',
    "etaMinutes" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MvpRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MvpChatMessage" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "actorType" "MvpChatActorType" NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MvpChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MvpOnboarding" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "status" "MvpOnboardingStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MvpOnboarding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MvpRequest_clinicId_status_idx" ON "MvpRequest"("clinicId", "status");

-- CreateIndex
CREATE INDEX "MvpRequest_createdAt_idx" ON "MvpRequest"("createdAt");

-- CreateIndex
CREATE INDEX "MvpChatMessage_requestId_createdAt_idx" ON "MvpChatMessage"("requestId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MvpOnboarding_clinicId_key" ON "MvpOnboarding"("clinicId");

-- AddForeignKey
ALTER TABLE "MvpRequest" ADD CONSTRAINT "MvpRequest_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MvpChatMessage" ADD CONSTRAINT "MvpChatMessage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "MvpRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MvpOnboarding" ADD CONSTRAINT "MvpOnboarding_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
