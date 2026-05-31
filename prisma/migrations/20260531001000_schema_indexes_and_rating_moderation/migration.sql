-- CreateEnum
CREATE TYPE "RatingModerationStatus" AS ENUM ('PENDING', 'PUBLISHED', 'REJECTED');

-- AlterTable
ALTER TABLE "Rating" ADD COLUMN "moderationStatus" "RatingModerationStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "Rating" ADD COLUMN "moderationReason" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_inn_key" ON "Clinic"("inn");

-- CreateIndex
CREATE INDEX "Clinic_status_idx" ON "Clinic"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicLicense_clinicId_licenseNumber_key" ON "ClinicLicense"("clinicId", "licenseNumber");

-- CreateIndex
CREATE INDEX "ClinicLicense_licenseNumber_idx" ON "ClinicLicense"("licenseNumber");

-- CreateIndex
CREATE INDEX "ClinicServiceOffer_status_idx" ON "ClinicServiceOffer"("status");

-- CreateIndex
CREATE INDEX "ClinicServiceOffer_serviceCategoryId_status_idx" ON "ClinicServiceOffer"("serviceCategoryId", "status");

-- CreateIndex
CREATE INDEX "ClinicServiceArea_districtCode_isActive_idx" ON "ClinicServiceArea"("districtCode", "isActive");
