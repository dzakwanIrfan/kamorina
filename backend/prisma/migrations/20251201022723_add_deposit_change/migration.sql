-- CreateEnum
CREATE TYPE "DepositChangeType" AS ENUM ('AMOUNT_CHANGE', 'TENOR_CHANGE', 'BOTH');

-- CreateEnum
CREATE TYPE "DepositChangeStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW_DSP', 'UNDER_REVIEW_KETUA', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DepositChangeApprovalStep" AS ENUM ('DIVISI_SIMPAN_PINJAM', 'KETUA');

-- CreateEnum
CREATE TYPE "DepositChangeApprovalDecision" AS ENUM ('APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "deposit_change_requests" (
    "id" TEXT NOT NULL,
    "change_number" TEXT NOT NULL,
    "deposit_application_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "change_type" "DepositChangeType" NOT NULL,
    "current_amount_code" TEXT NOT NULL,
    "current_tenor_code" TEXT NOT NULL,
    "current_amount_value" DECIMAL(15,2) NOT NULL,
    "current_tenor_months" INTEGER NOT NULL,
    "current_interest_rate" DECIMAL(5,2),
    "current_projected_interest" DECIMAL(15,2),
    "current_total_return" DECIMAL(15,2),
    "new_amount_code" TEXT NOT NULL,
    "new_tenor_code" TEXT NOT NULL,
    "new_amount_value" DECIMAL(15,2) NOT NULL,
    "new_tenor_months" INTEGER NOT NULL,
    "new_interest_rate" DECIMAL(5,2),
    "new_projected_interest" DECIMAL(15,2),
    "new_total_return" DECIMAL(15,2),
    "admin_fee" DECIMAL(15,2) NOT NULL,
    "agreed_to_terms" BOOLEAN NOT NULL DEFAULT false,
    "agreed_to_admin_fee" BOOLEAN NOT NULL DEFAULT false,
    "status" "DepositChangeStatus" NOT NULL DEFAULT 'DRAFT',
    "current_step" "DepositChangeApprovalStep",
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "effective_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposit_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_change_approvals" (
    "id" TEXT NOT NULL,
    "deposit_change_request_id" TEXT NOT NULL,
    "step" "DepositChangeApprovalStep" NOT NULL,
    "decision" "DepositChangeApprovalDecision",
    "decided_at" TIMESTAMP(3),
    "approver_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposit_change_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_change_history" (
    "id" TEXT NOT NULL,
    "deposit_change_request_id" TEXT NOT NULL,
    "status" "DepositChangeStatus" NOT NULL,
    "changeType" "DepositChangeType" NOT NULL,
    "currentAmountValue" DECIMAL(15,2) NOT NULL,
    "currentTenorMonths" INTEGER NOT NULL,
    "newAmountValue" DECIMAL(15,2) NOT NULL,
    "newTenorMonths" INTEGER NOT NULL,
    "adminFee" DECIMAL(15,2) NOT NULL,
    "action" TEXT NOT NULL,
    "action_at" TIMESTAMP(3) NOT NULL,
    "action_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deposit_change_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deposit_change_requests_change_number_key" ON "deposit_change_requests"("change_number");

-- CreateIndex
CREATE INDEX "deposit_change_requests_deposit_application_id_idx" ON "deposit_change_requests"("deposit_application_id");

-- CreateIndex
CREATE INDEX "deposit_change_requests_user_id_idx" ON "deposit_change_requests"("user_id");

-- CreateIndex
CREATE INDEX "deposit_change_requests_status_idx" ON "deposit_change_requests"("status");

-- CreateIndex
CREATE INDEX "deposit_change_approvals_deposit_change_request_id_idx" ON "deposit_change_approvals"("deposit_change_request_id");

-- CreateIndex
CREATE INDEX "deposit_change_history_deposit_change_request_id_idx" ON "deposit_change_history"("deposit_change_request_id");

-- AddForeignKey
ALTER TABLE "deposit_change_requests" ADD CONSTRAINT "deposit_change_requests_deposit_application_id_fkey" FOREIGN KEY ("deposit_application_id") REFERENCES "deposit_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_change_requests" ADD CONSTRAINT "deposit_change_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_change_approvals" ADD CONSTRAINT "deposit_change_approvals_deposit_change_request_id_fkey" FOREIGN KEY ("deposit_change_request_id") REFERENCES "deposit_change_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_change_approvals" ADD CONSTRAINT "deposit_change_approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_change_history" ADD CONSTRAINT "deposit_change_history_deposit_change_request_id_fkey" FOREIGN KEY ("deposit_change_request_id") REFERENCES "deposit_change_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_change_history" ADD CONSTRAINT "deposit_change_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
