/*
  Warnings:

  - You are about to drop the column `bank_account_number` on the `loan_applications` table. All the data in the column will be lost.
  - You are about to drop the column `bankAccountNumber` on the `loan_history` table. All the data in the column will be lost.
  - You are about to drop the column `bank_account_number` on the `savings_withdrawals` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "loan_applications" DROP COLUMN "bank_account_number";

-- AlterTable
ALTER TABLE "loan_history" DROP COLUMN "bankAccountNumber";

-- AlterTable
ALTER TABLE "savings_withdrawals" DROP COLUMN "bank_account_number";
