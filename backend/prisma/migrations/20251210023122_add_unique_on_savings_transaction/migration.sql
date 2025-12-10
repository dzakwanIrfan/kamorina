/*
  Warnings:

  - You are about to drop the column `start_month` on the `deposit_applications` table. All the data in the column will be lost.
  - You are about to drop the column `start_year` on the `deposit_applications` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[savings_account_id,payrollPeriodId]` on the table `savings_transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "deposit_applications" DROP COLUMN "start_month",
DROP COLUMN "start_year";

-- CreateIndex
CREATE UNIQUE INDEX "savings_transactions_savings_account_id_payrollPeriodId_key" ON "savings_transactions"("savings_account_id", "payrollPeriodId");
