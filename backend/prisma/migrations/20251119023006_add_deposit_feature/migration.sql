-- CreateEnum
CREATE TYPE "DepositAmount" AS ENUM ('AMOUNT_200K', 'AMOUNT_500K', 'AMOUNT_1000K', 'AMOUNT_1500K', 'AMOUNT_2000K', 'AMOUNT_3000K');

-- CreateEnum
CREATE TYPE "DepositTenor" AS ENUM ('TENOR_3', 'TENOR_6', 'TENOR_9', 'TENOR_12');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW_DSP', 'UNDER_REVIEW_KETUA', 'APPROVED', 'ACTIVE', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DepositApprovalStep" AS ENUM ('DIVISI_SIMPAN_PINJAM', 'KETUA');

-- CreateEnum
CREATE TYPE "DepositApprovalDecision" AS ENUM ('APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "deposit_applications" (
    "id" TEXT NOT NULL,
    "deposit_number" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "deposit_amount" "DepositAmount" NOT NULL,
    "deposit_tenor" "DepositTenor" NOT NULL,
    "amount_value" DECIMAL(15,2) NOT NULL,
    "tenor_months" INTEGER NOT NULL,
    "interest_rate" DECIMAL(5,2),
    "projected_interest" DECIMAL(15,2),
    "total_return" DECIMAL(15,2),
    "agreed_to_terms" BOOLEAN NOT NULL DEFAULT false,
    "status" "DepositStatus" NOT NULL DEFAULT 'DRAFT',
    "current_step" "DepositApprovalStep",
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "activated_at" TIMESTAMP(3),
    "maturity_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposit_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_approvals" (
    "id" TEXT NOT NULL,
    "deposit_application_id" TEXT NOT NULL,
    "step" "DepositApprovalStep" NOT NULL,
    "decision" "DepositApprovalDecision",
    "decided_at" TIMESTAMP(3),
    "approver_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposit_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_history" (
    "id" TEXT NOT NULL,
    "deposit_application_id" TEXT NOT NULL,
    "status" "DepositStatus" NOT NULL,
    "depositAmount" "DepositAmount" NOT NULL,
    "depositTenor" "DepositTenor" NOT NULL,
    "amountValue" DECIMAL(15,2) NOT NULL,
    "tenorMonths" INTEGER NOT NULL,
    "interestRate" DECIMAL(5,2),
    "projectedInterest" DECIMAL(15,2),
    "action" TEXT NOT NULL,
    "action_at" TIMESTAMP(3) NOT NULL,
    "action_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposit_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deposit_applications_deposit_number_key" ON "deposit_applications"("deposit_number");

-- AddForeignKey
ALTER TABLE "deposit_applications" ADD CONSTRAINT "deposit_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_approvals" ADD CONSTRAINT "deposit_approvals_deposit_application_id_fkey" FOREIGN KEY ("deposit_application_id") REFERENCES "deposit_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_approvals" ADD CONSTRAINT "deposit_approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_history" ADD CONSTRAINT "deposit_history_deposit_application_id_fkey" FOREIGN KEY ("deposit_application_id") REFERENCES "deposit_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_history" ADD CONSTRAINT "deposit_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
