-- CreateEnum
CREATE TYPE "RepaymentStatus" AS ENUM ('UNDER_REVIEW_DSP', 'UNDER_REVIEW_KETUA', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RepaymentApprovalStep" AS ENUM ('DIVISI_SIMPAN_PINJAM', 'KETUA');

-- CreateTable
CREATE TABLE "loan_repayments" (
    "id" TEXT NOT NULL,
    "repayment_number" TEXT NOT NULL,
    "loan_application_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "status" "RepaymentStatus" NOT NULL DEFAULT 'UNDER_REVIEW_DSP',
    "current_step" "RepaymentApprovalStep",
    "is_agreed_by_member" BOOLEAN NOT NULL DEFAULT true,
    "agreed_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_repayments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "repayment_approvals" (
    "id" TEXT NOT NULL,
    "repayment_id" TEXT NOT NULL,
    "step" "RepaymentApprovalStep" NOT NULL,
    "decision" "ApprovalDecision",
    "decided_at" TIMESTAMP(3),
    "approver_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "repayment_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "loan_repayments_repayment_number_key" ON "loan_repayments"("repayment_number");

-- CreateIndex
CREATE INDEX "loan_repayments_loan_application_id_idx" ON "loan_repayments"("loan_application_id");

-- CreateIndex
CREATE INDEX "loan_repayments_user_id_idx" ON "loan_repayments"("user_id");

-- CreateIndex
CREATE INDEX "repayment_approvals_repayment_id_idx" ON "repayment_approvals"("repayment_id");

-- AddForeignKey
ALTER TABLE "loan_repayments" ADD CONSTRAINT "loan_repayments_loan_application_id_fkey" FOREIGN KEY ("loan_application_id") REFERENCES "loan_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_repayments" ADD CONSTRAINT "loan_repayments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repayment_approvals" ADD CONSTRAINT "repayment_approvals_repayment_id_fkey" FOREIGN KEY ("repayment_id") REFERENCES "loan_repayments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repayment_approvals" ADD CONSTRAINT "repayment_approvals_approver_id_fkey" FOREIGN KEY ("approver_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
