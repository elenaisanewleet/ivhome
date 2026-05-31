-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'DELETION_REQUESTED', 'DELETED');

-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('PATIENT', 'PLATFORM_SUPPORT', 'PLATFORM_MODERATOR', 'PLATFORM_ADMIN', 'PLATFORM_SECURITY_AUDITOR');

-- CreateEnum
CREATE TYPE "ClinicRole" AS ENUM ('CLINIC_OPERATOR', 'CLINIC_AUTHORIZED_STAFF', 'CLINIC_ADMIN');

-- CreateEnum
CREATE TYPE "ClinicStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'SUSPENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LicenseStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'REJECTED', 'RECHECK_REQUIRED');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('DRAFT', 'SCREENING_BLOCKED', 'SUBMITTED', 'SENT_TO_CLINIC', 'CLINIC_REVIEW', 'CLARIFICATION_REQUIRED', 'QUOTE_PROVIDED', 'DECLINED_BY_CLINIC', 'CANCELLED_BY_PATIENT', 'EXPIRED', 'BOOKED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'OFFERED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('CONFIRMED', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'SERVICE_STARTED', 'COMPLETED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_CLINIC', 'FAILED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ScreeningOutcome" AS ENUM ('PASSED', 'BLOCKED_EMERGENCY');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('PERSONAL_DATA_PROCESSING', 'HEALTH_DATA_PROCESSING', 'PARTNER_DATA_TRANSFER', 'TERMS_OF_USE', 'PRIVACY_POLICY_ACKNOWLEDGEMENT');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'CONSENT_ACCEPT', 'CONSENT_REVOKE', 'EXPORT', 'ROLE_ASSIGN', 'ROLE_REVOKE', 'LICENSE_VERIFY', 'LICENSE_SUSPEND', 'SCREENING_BLOCK', 'QUOTE_FIX', 'QUOTE_REPLACE', 'BOOKING_STATUS_CHANGE', 'PARTNER_LEAD_SEND', 'PARTNER_LEAD_STATUS_CHANGE');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('USER', 'CLINIC_MEMBER', 'PLATFORM_STAFF', 'SYSTEM');

-- CreateEnum
CREATE TYPE "SlaMetricType" AS ENUM ('CLINIC_FIRST_RESPONSE', 'CLINIC_CONFIRMATION', 'ARRIVAL', 'COMPLETION');

-- CreateEnum
CREATE TYPE "SlaEventStatus" AS ENUM ('PENDING', 'MET', 'BREACHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PartnerContactChannelType" AS ENUM ('TELEGRAM', 'WHATSAPP', 'PHONE', 'EMAIL', 'DASHBOARD');

-- CreateEnum
CREATE TYPE "PartnerLeadStatus" AS ENUM ('CREATED', 'SENT_TO_PARTNER', 'ACCEPTED_BY_PARTNER', 'REJECTED_BY_PARTNER', 'CONVERTED_TO_BOOKING', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LeadBillingStatus" AS ENUM ('NOT_BILLABLE', 'PENDING', 'BILLABLE', 'INVOICED', 'PAID', 'WAIVED');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "displayName" TEXT,
    "phoneEncrypted" TEXT,
    "emailEncrypted" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelegramIdentity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "telegramUserId" BIGINT NOT NULL,
    "username" TEXT,
    "languageCode" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TelegramIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "PlatformRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "PlatformMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "publicName" TEXT NOT NULL,
    "inn" TEXT NOT NULL,
    "ogrn" TEXT,
    "status" "ClinicStatus" NOT NULL DEFAULT 'DRAFT',
    "ratingAverage" DECIMAL(3,2),
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicMembership" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "ClinicRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ClinicMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicLicense" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "authorityName" TEXT,
    "registryUrl" TEXT,
    "registryRecordId" TEXT,
    "licensedActivities" JSONB NOT NULL,
    "licensedAddresses" JSONB NOT NULL,
    "status" "LicenseStatus" NOT NULL DEFAULT 'PENDING',
    "checkedAt" TIMESTAMP(3),
    "nextCheckAt" TIMESTAMP(3),
    "checkedByUserId" TEXT,
    "verificationNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicLicense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "publicName" TEXT NOT NULL,
    "publicDescription" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicServiceOffer" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "serviceCategoryId" TEXT NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
    "preliminaryPriceFrom" DECIMAL(12,2),
    "preliminaryPriceTo" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "etaMinutesFrom" INTEGER,
    "etaMinutesTo" INTEGER,
    "cancellationTerms" TEXT,
    "publicConditions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicServiceOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicServiceArea" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "districtCode" TEXT NOT NULL,
    "districtName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ClinicServiceArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerContactChannel" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "type" "PartnerContactChannelType" NOT NULL,
    "label" TEXT NOT NULL,
    "valueEncrypted" TEXT,
    "valueMasked" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerContactChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerLead" (
    "id" TEXT NOT NULL,
    "requestId" TEXT,
    "clinicId" TEXT NOT NULL,
    "status" "PartnerLeadStatus" NOT NULL DEFAULT 'CREATED',
    "billingStatus" "LeadBillingStatus" NOT NULL DEFAULT 'NOT_BILLABLE',
    "contactChannelId" TEXT,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "leadFeeAmount" DECIMAL(12,2),
    "commissionRate" DECIMAL(5,2),
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartnerLead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentDocument" (
    "id" TEXT NOT NULL,
    "type" "ConsentType" NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ConsentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentAcceptance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentDocumentId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "ipHash" TEXT,
    "userAgentHash" TEXT,
    "telegramUserId" BIGINT,
    "evidence" JSONB,

    CONSTRAINT "ConsentAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmergencyScreening" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "schemaVersion" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "outcome" "ScreeningOutcome" NOT NULL,
    "blockedReason" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmergencyScreening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clinicId" TEXT,
    "serviceCategoryId" TEXT NOT NULL,
    "emergencyScreeningId" TEXT NOT NULL,
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'DRAFT',
    "districtCode" TEXT NOT NULL,
    "addressEncrypted" TEXT,
    "addressCommentEncrypted" TEXT,
    "requestedWindowFrom" TIMESTAMP(3) NOT NULL,
    "requestedWindowTo" TIMESTAMP(3) NOT NULL,
    "patientCommentEncrypted" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RequestStatusHistory" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fromStatus" "ServiceRequestStatus",
    "toStatus" "ServiceRequestStatus" NOT NULL,
    "reason" TEXT,
    "actorType" "AuditActorType" NOT NULL,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "fixedPrice" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "priceBreakdown" JSONB,
    "confirmedEtaAt" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "cancellationTerms" TEXT,
    "conditionsSnapshot" JSONB NOT NULL,
    "medicalFeasibilityConfirmedAt" TIMESTAMP(3) NOT NULL,
    "confirmedByMemberId" TEXT NOT NULL,
    "replacementReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedAt" TIMESTAMP(3),
    "enRouteAt" TIMESTAMP(3),
    "arrivedAt" TIMESTAMP(3),
    "serviceStartedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SlaEvent" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "metricType" "SlaMetricType" NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "fulfilledAt" TIMESTAMP(3),
    "breachedAt" TIMESTAMP(3),
    "status" "SlaEventStatus" NOT NULL DEFAULT 'PENDING',
    "metadata" JSONB,

    CONSTRAINT "SlaEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL,
    "arrivalScore" INTEGER,
    "priceAccuracyScore" INTEGER,
    "communicationScore" INTEGER,
    "comment" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "moderatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorType" "AuditActorType" NOT NULL,
    "actorId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "clinicId" TEXT,
    "requestId" TEXT,
    "ipHash" TEXT,
    "userAgentHash" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramIdentity_userId_key" ON "TelegramIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramIdentity_telegramUserId_key" ON "TelegramIdentity"("telegramUserId");

-- CreateIndex
CREATE INDEX "PlatformMembership_userId_role_idx" ON "PlatformMembership"("userId", "role");

-- CreateIndex
CREATE INDEX "ClinicMembership_clinicId_role_idx" ON "ClinicMembership"("clinicId", "role");

-- CreateIndex
CREATE INDEX "ClinicMembership_userId_idx" ON "ClinicMembership"("userId");

-- CreateIndex
CREATE INDEX "ClinicLicense_clinicId_status_idx" ON "ClinicLicense"("clinicId", "status");

-- CreateIndex
CREATE INDEX "ClinicLicense_nextCheckAt_idx" ON "ClinicLicense"("nextCheckAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicServiceOffer_clinicId_serviceCategoryId_key" ON "ClinicServiceOffer"("clinicId", "serviceCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicServiceArea_clinicId_districtCode_key" ON "ClinicServiceArea"("clinicId", "districtCode");

-- CreateIndex
CREATE INDEX "PartnerContactChannel_clinicId_type_idx" ON "PartnerContactChannel"("clinicId", "type");

-- CreateIndex
CREATE INDEX "PartnerLead_clinicId_status_idx" ON "PartnerLead"("clinicId", "status");

-- CreateIndex
CREATE INDEX "PartnerLead_requestId_idx" ON "PartnerLead"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentDocument_type_version_key" ON "ConsentDocument"("type", "version");

-- CreateIndex
CREATE INDEX "ConsentAcceptance_userId_acceptedAt_idx" ON "ConsentAcceptance"("userId", "acceptedAt");

-- CreateIndex
CREATE INDEX "EmergencyScreening_userId_completedAt_idx" ON "EmergencyScreening"("userId", "completedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceRequest_emergencyScreeningId_key" ON "ServiceRequest"("emergencyScreeningId");

-- CreateIndex
CREATE INDEX "ServiceRequest_userId_createdAt_idx" ON "ServiceRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ServiceRequest_clinicId_status_idx" ON "ServiceRequest"("clinicId", "status");

-- CreateIndex
CREATE INDEX "RequestStatusHistory_requestId_createdAt_idx" ON "RequestStatusHistory"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "Quote_clinicId_status_idx" ON "Quote"("clinicId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_requestId_version_key" ON "Quote"("requestId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_requestId_key" ON "Booking"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_quoteId_key" ON "Booking"("quoteId");

-- CreateIndex
CREATE INDEX "SlaEvent_status_dueAt_idx" ON "SlaEvent"("status", "dueAt");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_bookingId_key" ON "Rating"("bookingId");

-- CreateIndex
CREATE INDEX "Rating_clinicId_createdAt_idx" ON "Rating"("clinicId", "createdAt");

-- CreateIndex
CREATE INDEX "Rating_userId_createdAt_idx" ON "Rating"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_clinicId_createdAt_idx" ON "AuditLog"("clinicId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_requestId_createdAt_idx" ON "AuditLog"("requestId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_processedAt_createdAt_idx" ON "OutboxEvent"("processedAt", "createdAt");

-- AddForeignKey
ALTER TABLE "TelegramIdentity" ADD CONSTRAINT "TelegramIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlatformMembership" ADD CONSTRAINT "PlatformMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicMembership" ADD CONSTRAINT "ClinicMembership_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicMembership" ADD CONSTRAINT "ClinicMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicLicense" ADD CONSTRAINT "ClinicLicense_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicLicense" ADD CONSTRAINT "ClinicLicense_checkedByUserId_fkey" FOREIGN KEY ("checkedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicServiceOffer" ADD CONSTRAINT "ClinicServiceOffer_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicServiceOffer" ADD CONSTRAINT "ClinicServiceOffer_serviceCategoryId_fkey" FOREIGN KEY ("serviceCategoryId") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicServiceArea" ADD CONSTRAINT "ClinicServiceArea_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerContactChannel" ADD CONSTRAINT "PartnerContactChannel_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerLead" ADD CONSTRAINT "PartnerLead_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerLead" ADD CONSTRAINT "PartnerLead_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerLead" ADD CONSTRAINT "PartnerLead_contactChannelId_fkey" FOREIGN KEY ("contactChannelId") REFERENCES "PartnerContactChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentAcceptance" ADD CONSTRAINT "ConsentAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentAcceptance" ADD CONSTRAINT "ConsentAcceptance_consentDocumentId_fkey" FOREIGN KEY ("consentDocumentId") REFERENCES "ConsentDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmergencyScreening" ADD CONSTRAINT "EmergencyScreening_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_serviceCategoryId_fkey" FOREIGN KEY ("serviceCategoryId") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRequest" ADD CONSTRAINT "ServiceRequest_emergencyScreeningId_fkey" FOREIGN KEY ("emergencyScreeningId") REFERENCES "EmergencyScreening"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestStatusHistory" ADD CONSTRAINT "RequestStatusHistory_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_confirmedByMemberId_fkey" FOREIGN KEY ("confirmedByMemberId") REFERENCES "ClinicMembership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "ServiceRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SlaEvent" ADD CONSTRAINT "SlaEvent_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
