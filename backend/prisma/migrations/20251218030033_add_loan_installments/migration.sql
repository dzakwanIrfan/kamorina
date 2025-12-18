-- CreateTable
CREATE TABLE "loan_installments" (
    "id" TEXT NOT NULL,
    "loan_application_id" TEXT NOT NULL,
    "installment_number" INTEGER NOT NULL,
    "due_date" DATE NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_at" TIMESTAMP(3),
    "paid_amount" DECIMAL(15,2),
    "payroll_period_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_installments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "loan_installments_loan_application_id_idx" ON "loan_installments"("loan_application_id");

-- CreateIndex
CREATE INDEX "loan_installments_due_date_idx" ON "loan_installments"("due_date");

-- CreateIndex
CREATE INDEX "loan_installments_is_paid_idx" ON "loan_installments"("is_paid");

-- CreateIndex
CREATE INDEX "loan_installments_payroll_period_id_idx" ON "loan_installments"("payroll_period_id");

-- CreateIndex
CREATE UNIQUE INDEX "loan_installments_loan_application_id_installment_number_key" ON "loan_installments"("loan_application_id", "installment_number");

-- AddForeignKey
ALTER TABLE "loan_installments" ADD CONSTRAINT "loan_installments_loan_application_id_fkey" FOREIGN KEY ("loan_application_id") REFERENCES "loan_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_installments" ADD CONSTRAINT "loan_installments_payroll_period_id_fkey" FOREIGN KEY ("payroll_period_id") REFERENCES "payroll_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
