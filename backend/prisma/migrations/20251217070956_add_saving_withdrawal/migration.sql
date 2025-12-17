-- CreateEnum
CREATE TYPE "SavingsWithdrawalStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW_DSP', 'UNDER_REVIEW_KETUA', 'APPROVED_WAITING_DISBURSEMENT', 'DISBURSEMENT_IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SavingsWithdrawalStep" AS ENUM ('DIVISI_SIMPAN_PINJAM', 'KETUA', 'SHOPKEEPER', 'KETUA_AUTH');

-- CreateTable
CREATE TABLE "savings_withdrawals" (
    "id" TEXT NOT NULL,
    "withdrawal_number" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "withdrawal_amount" DECIMAL(15,2) NOT NULL,
    "has_early_deposit_penalty" BOOLEAN NOT NULL DEFAULT false,
    "penalty_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "penalty_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "net_amount" DECIMAL(15,2) NOT NULL,
    "bank_account_number" TEXT,
    "notes" TEXT,
    "status" "SavingsWithdrawalStatus" NOT NULL DEFAULT 'SUBMITTED',
    "current_step" "SavingsWithdrawalStep",
    "submitted_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "savings_withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_withdrawal_approvals" (
    "id" TEXT NOT NULL,
    "savings_withdrawal_id" TEXT NOT NULL,
    "step" "SavingsWithdrawalStep" NOT NULL,
    "decision" "ApprovalDecision" NOT NULL,
    "approver_id" TEXT,
    "notes" TEXT,
    "decided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "savings_withdrawal_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_withdrawal_disbursements" (
    "id" TEXT NOT NULL,
    "savings_withdrawal_id" TEXT NOT NULL,
    "processed_by" TEXT NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "savings_withdrawal_disbursements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_withdrawal_authorizations" (
    "id" TEXT NOT NULL,
    "savings_withdrawal_id" TEXT NOT NULL,
    "authorized_by" TEXT NOT NULL,
    "authorization_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "savings_withdrawal_authorizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "savings_withdrawals_withdrawal_number_key" ON "savings_withdrawals"("withdrawal_number");

-- CreateIndex
CREATE INDEX "savings_withdrawals_user_id_idx" ON "savings_withdrawals"("user_id");

-- CreateIndex
CREATE INDEX "savings_withdrawals_status_idx" ON "savings_withdrawals"("status");

-- CreateIndex
CREATE UNIQUE INDEX "savings_withdrawal_disbursements_savings_withdrawal_id_key" ON "savings_withdrawal_disbursements"("savings_withdrawal_id");

-- CreateIndex
CREATE UNIQUE INDEX "savings_withdrawal_authorizations_savings_withdrawal_id_key" ON "savings_withdrawal_authorizations"("savings_withdrawal_id");

-- AddForeignKey
ALTER TABLE "savings_withdrawals" ADD CONSTRAINT "savings_withdrawals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_withdrawal_approvals" ADD CONSTRAINT "savings_withdrawal_approvals_savings_withdrawal_id_fkey" FOREIGN KEY ("savings_withdrawal_id") REFERENCES "savings_withdrawals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_withdrawal_approvals" ADD CONSTRAINT "savings_withdrawal_approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_withdrawal_disbursements" ADD CONSTRAINT "savings_withdrawal_disbursements_savings_withdrawal_id_fkey" FOREIGN KEY ("savings_withdrawal_id") REFERENCES "savings_withdrawals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_withdrawal_disbursements" ADD CONSTRAINT "savings_withdrawal_disbursements_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_withdrawal_authorizations" ADD CONSTRAINT "savings_withdrawal_authorizations_savings_withdrawal_id_fkey" FOREIGN KEY ("savings_withdrawal_id") REFERENCES "savings_withdrawals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_withdrawal_authorizations" ADD CONSTRAINT "savings_withdrawal_authorizations_authorized_by_fkey" FOREIGN KEY ("authorized_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
