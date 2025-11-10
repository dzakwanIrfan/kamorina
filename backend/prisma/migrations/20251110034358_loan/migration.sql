-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW_DSP', 'UNDER_REVIEW_KETUA', 'UNDER_REVIEW_PENGAWAS', 'APPROVED_PENDING_DISBURSEMENT', 'DISBURSEMENT_IN_PROGRESS', 'PENDING_AUTHORIZATION', 'DISBURSED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LoanApprovalStep" AS ENUM ('DIVISI_SIMPAN_PINJAM', 'KETUA', 'PENGAWAS');

-- CreateEnum
CREATE TYPE "LoanApprovalDecision" AS ENUM ('APPROVED', 'REJECTED', 'REVISED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bank_account_number" TEXT;

-- CreateTable
CREATE TABLE "loan_applications" (
    "id" TEXT NOT NULL,
    "loan_number" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bank_account_number" TEXT NOT NULL,
    "loan_amount" DECIMAL(15,2) NOT NULL,
    "loan_tenor" INTEGER NOT NULL,
    "loan_purpose" TEXT NOT NULL,
    "attachments" JSONB,
    "interest_rate" DECIMAL(5,2),
    "monthly_installment" DECIMAL(15,2),
    "total_repayment" DECIMAL(15,2),
    "status" "LoanStatus" NOT NULL DEFAULT 'DRAFT',
    "current_step" "LoanApprovalStep",
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "disbursed_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "revision_count" INTEGER NOT NULL DEFAULT 0,
    "last_revised_at" TIMESTAMP(3),
    "last_revised_by" TEXT,
    "revision_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_approvals" (
    "id" TEXT NOT NULL,
    "loan_application_id" TEXT NOT NULL,
    "step" "LoanApprovalStep" NOT NULL,
    "decision" "LoanApprovalDecision",
    "decided_at" TIMESTAMP(3),
    "approver_id" TEXT,
    "notes" TEXT,
    "revised_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_history" (
    "id" TEXT NOT NULL,
    "loan_application_id" TEXT NOT NULL,
    "status" "LoanStatus" NOT NULL,
    "loanAmount" DECIMAL(15,2) NOT NULL,
    "loanTenor" INTEGER NOT NULL,
    "loanPurpose" TEXT NOT NULL,
    "bankAccountNumber" TEXT NOT NULL,
    "interestRate" DECIMAL(5,2),
    "monthlyInstallment" DECIMAL(15,2),
    "action" TEXT NOT NULL,
    "action_at" TIMESTAMP(3) NOT NULL,
    "action_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_disbursements" (
    "id" TEXT NOT NULL,
    "loan_application_id" TEXT NOT NULL,
    "processed_by" TEXT NOT NULL,
    "disbursement_date" TIMESTAMP(3) NOT NULL,
    "disbursement_time" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_disbursements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_authorizations" (
    "id" TEXT NOT NULL,
    "loan_application_id" TEXT NOT NULL,
    "authorized_by" TEXT NOT NULL,
    "authorization_date" TIMESTAMP(3) NOT NULL,
    "authorization_time" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_authorizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "loan_applications_loan_number_key" ON "loan_applications"("loan_number");

-- CreateIndex
CREATE UNIQUE INDEX "loan_disbursements_loan_application_id_key" ON "loan_disbursements"("loan_application_id");

-- CreateIndex
CREATE UNIQUE INDEX "loan_authorizations_loan_application_id_key" ON "loan_authorizations"("loan_application_id");

-- AddForeignKey
ALTER TABLE "loan_applications" ADD CONSTRAINT "loan_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_approvals" ADD CONSTRAINT "loan_approvals_loan_application_id_fkey" FOREIGN KEY ("loan_application_id") REFERENCES "loan_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_approvals" ADD CONSTRAINT "loan_approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_history" ADD CONSTRAINT "loan_history_loan_application_id_fkey" FOREIGN KEY ("loan_application_id") REFERENCES "loan_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_history" ADD CONSTRAINT "loan_history_action_by_fkey" FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_disbursements" ADD CONSTRAINT "loan_disbursements_loan_application_id_fkey" FOREIGN KEY ("loan_application_id") REFERENCES "loan_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_disbursements" ADD CONSTRAINT "loan_disbursements_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_authorizations" ADD CONSTRAINT "loan_authorizations_loan_application_id_fkey" FOREIGN KEY ("loan_application_id") REFERENCES "loan_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_authorizations" ADD CONSTRAINT "loan_authorizations_authorized_by_fkey" FOREIGN KEY ("authorized_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
