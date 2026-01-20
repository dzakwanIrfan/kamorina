/*
  Warnings:

  - The values [DRAFT,SUBMITTED] on the enum `DepositStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DepositStatus_new" AS ENUM ('UNDER_REVIEW_DSP', 'UNDER_REVIEW_KETUA', 'APPROVED', 'ACTIVE', 'COMPLETED', 'REJECTED', 'CANCELLED');
ALTER TABLE "public"."deposit_applications" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "deposit_applications" ALTER COLUMN "status" TYPE "DepositStatus_new" USING ("status"::text::"DepositStatus_new");
ALTER TABLE "deposit_history" ALTER COLUMN "status" TYPE "DepositStatus_new" USING ("status"::text::"DepositStatus_new");
ALTER TYPE "DepositStatus" RENAME TO "DepositStatus_old";
ALTER TYPE "DepositStatus_new" RENAME TO "DepositStatus";
DROP TYPE "public"."DepositStatus_old";
ALTER TABLE "deposit_applications" ALTER COLUMN "status" SET DEFAULT 'UNDER_REVIEW_DSP';
COMMIT;

-- AlterTable
ALTER TABLE "deposit_applications" ALTER COLUMN "status" SET DEFAULT 'UNDER_REVIEW_DSP';
