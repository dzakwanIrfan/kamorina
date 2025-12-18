/*
  Warnings:

  - You are about to drop the column `transaction_date` on the `savings_withdrawal_disbursements` table. All the data in the column will be lost.
  - Added the required column `authorization_time` to the `savings_withdrawal_authorizations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `disbursement_date` to the `savings_withdrawal_disbursements` table without a default value. This is not possible if the table is not empty.
  - Added the required column `disbursement_time` to the `savings_withdrawal_disbursements` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "savings_withdrawal_authorizations" ADD COLUMN     "authorization_time" TEXT NOT NULL,
ALTER COLUMN "authorization_date" DROP DEFAULT;

-- AlterTable
ALTER TABLE "savings_withdrawal_disbursements" DROP COLUMN "transaction_date",
ADD COLUMN     "disbursement_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "disbursement_time" TEXT NOT NULL;
