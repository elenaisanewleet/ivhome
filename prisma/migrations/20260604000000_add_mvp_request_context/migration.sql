-- Add selected service and custom request context to MVP pilot requests.
ALTER TABLE "MvpRequest" ADD COLUMN "serviceSlug" TEXT;
ALTER TABLE "MvpRequest" ADD COLUMN "serviceLabel" TEXT;
ALTER TABLE "MvpRequest" ADD COLUMN "servicePrice" TEXT;
ALTER TABLE "MvpRequest" ADD COLUMN "customRequest" TEXT;
ALTER TABLE "MvpRequest" ADD COLUMN "customImportant" TEXT;
ALTER TABLE "MvpRequest" ADD COLUMN "budget" TEXT;
ALTER TABLE "MvpRequest" ADD COLUMN "comment" TEXT;
