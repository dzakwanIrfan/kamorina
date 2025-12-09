/*
  Warnings:

  - You are about to drop the column `interestRate` on the `deposit_applications` table. All the data in the column will be lost.
  - You are about to drop the column `current_interest_rate` on the `deposit_change_requests` table. All the data in the column will be lost.
  - You are about to drop the column `new_interest_rate` on the `deposit_change_requests` table. All the data in the column will be lost.
  - You are about to drop the column `interestRate` on the `deposit_history` table. All the data in the column will be lost.
  - Added the required column `interest_rate` to the `savings_transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "deposit_applications" DROP COLUMN "interestRate";

-- AlterTable
ALTER TABLE "deposit_change_requests" DROP COLUMN "current_interest_rate",
DROP COLUMN "new_interest_rate";

-- AlterTable
ALTER TABLE "deposit_history" DROP COLUMN "interestRate";

-- AlterTable
ALTER TABLE "savings_transactions" ADD COLUMN     "interest_rate" DECIMAL(5,2) NOT NULL;
