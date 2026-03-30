-- AlterEnum
ALTER TYPE "LoanType" ADD VALUE 'EXCESS_LOAN';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SocialFundTransactionType" ADD VALUE 'EXCESS_LOAN_DISBURSEMENT';
ALTER TYPE "SocialFundTransactionType" ADD VALUE 'EXCESS_LOAN_REPAYMENT';

-- CreateTable
CREATE TABLE "excess_loan_details" (
    "id" TEXT NOT NULL,
    "loan_application_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "excess_loan_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "excess_loan_details_loan_application_id_key" ON "excess_loan_details"("loan_application_id");

-- AddForeignKey
ALTER TABLE "excess_loan_details" ADD CONSTRAINT "excess_loan_details_loan_application_id_fkey" FOREIGN KEY ("loan_application_id") REFERENCES "loan_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
