/*
  Warnings:

  - You are about to drop the column `deposit_amount_code` on the `deposit_applications` table. All the data in the column will be lost.
  - You are about to drop the column `deposit_tenor_code` on the `deposit_applications` table. All the data in the column will be lost.
  - You are about to drop the column `interest_rate` on the `deposit_applications` table. All the data in the column will be lost.
  - You are about to drop the column `projected_interest` on the `deposit_applications` table. All the data in the column will be lost.
  - You are about to drop the column `total_return` on the `deposit_applications` table. All the data in the column will be lost.
  - You are about to drop the column `current_amount_code` on the `deposit_change_requests` table. All the data in the column will be lost.
  - You are about to drop the column `current_projected_interest` on the `deposit_change_requests` table. All the data in the column will be lost.
  - You are about to drop the column `current_tenor_code` on the `deposit_change_requests` table. All the data in the column will be lost.
  - You are about to drop the column `current_total_return` on the `deposit_change_requests` table. All the data in the column will be lost.
  - You are about to drop the column `new_amount_code` on the `deposit_change_requests` table. All the data in the column will be lost.
  - You are about to drop the column `new_projected_interest` on the `deposit_change_requests` table. All the data in the column will be lost.
  - You are about to drop the column `new_tenor_code` on the `deposit_change_requests` table. All the data in the column will be lost.
  - You are about to drop the column `new_total_return` on the `deposit_change_requests` table. All the data in the column will be lost.
  - You are about to drop the column `deposit_amount_code` on the `deposit_history` table. All the data in the column will be lost.
  - You are about to drop the column `deposit_tenor_code` on the `deposit_history` table. All the data in the column will be lost.
  - You are about to drop the column `projectedInterest` on the `deposit_history` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "deposit_applications" DROP COLUMN "deposit_amount_code",
DROP COLUMN "deposit_tenor_code",
DROP COLUMN "interest_rate",
DROP COLUMN "projected_interest",
DROP COLUMN "total_return",
ADD COLUMN     "collected_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "installment_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "interestRate" DECIMAL(5,2),
ADD COLUMN     "start_month" INTEGER,
ADD COLUMN     "start_year" INTEGER;

-- AlterTable
ALTER TABLE "deposit_change_requests" DROP COLUMN "current_amount_code",
DROP COLUMN "current_projected_interest",
DROP COLUMN "current_tenor_code",
DROP COLUMN "current_total_return",
DROP COLUMN "new_amount_code",
DROP COLUMN "new_projected_interest",
DROP COLUMN "new_tenor_code",
DROP COLUMN "new_total_return";

-- AlterTable
ALTER TABLE "deposit_history" DROP COLUMN "deposit_amount_code",
DROP COLUMN "deposit_tenor_code",
DROP COLUMN "projectedInterest";

-- AlterTable
ALTER TABLE "member_applications" ADD COLUMN     "entrance_fee" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "installmentPlan" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "is_paid_off" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paid_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "remaining_amount" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "savings_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "saldo_pokok" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "saldo_wajib" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "saldo_sukarela" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "bunga_deposito" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "savings_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_transactions" (
    "id" TEXT NOT NULL,
    "savings_account_id" TEXT NOT NULL,
    "iuran_pendaftaran" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "iuran_bulanan" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "tabungan_deposito" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "shu" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "penarikan" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "bunga" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "jumlah_bunga" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "payrollPeriodId" TEXT,

    CONSTRAINT "savings_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_periods" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "is_processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "payroll_periods_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "savings_accounts_user_id_key" ON "savings_accounts"("user_id");

-- CreateIndex
CREATE INDEX "savings_transactions_savings_account_id_idx" ON "savings_transactions"("savings_account_id");

-- CreateIndex
CREATE INDEX "savings_transactions_transaction_date_idx" ON "savings_transactions"("transaction_date");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_periods_month_year_key" ON "payroll_periods"("month", "year");

-- AddForeignKey
ALTER TABLE "savings_accounts" ADD CONSTRAINT "savings_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_savings_account_id_fkey" FOREIGN KEY ("savings_account_id") REFERENCES "savings_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_transactions" ADD CONSTRAINT "savings_transactions_payrollPeriodId_fkey" FOREIGN KEY ("payrollPeriodId") REFERENCES "payroll_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
