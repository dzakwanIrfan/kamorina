/*
  Warnings:

  - You are about to drop the `deposit_withdrawal_approvals` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `deposit_withdrawal_authorizations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `deposit_withdrawal_disbursements` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `deposit_withdrawals` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."deposit_withdrawal_approvals" DROP CONSTRAINT "deposit_withdrawal_approvals_approver_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."deposit_withdrawal_approvals" DROP CONSTRAINT "deposit_withdrawal_approvals_deposit_withdrawal_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."deposit_withdrawal_authorizations" DROP CONSTRAINT "deposit_withdrawal_authorizations_authorized_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."deposit_withdrawal_authorizations" DROP CONSTRAINT "deposit_withdrawal_authorizations_deposit_withdrawal_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."deposit_withdrawal_disbursements" DROP CONSTRAINT "deposit_withdrawal_disbursements_deposit_withdrawal_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."deposit_withdrawal_disbursements" DROP CONSTRAINT "deposit_withdrawal_disbursements_processed_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."deposit_withdrawals" DROP CONSTRAINT "deposit_withdrawals_deposit_application_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."deposit_withdrawals" DROP CONSTRAINT "deposit_withdrawals_user_id_fkey";

-- DropTable
DROP TABLE "public"."deposit_withdrawal_approvals";

-- DropTable
DROP TABLE "public"."deposit_withdrawal_authorizations";

-- DropTable
DROP TABLE "public"."deposit_withdrawal_disbursements";

-- DropTable
DROP TABLE "public"."deposit_withdrawals";

-- DropEnum
DROP TYPE "public"."DepositWithdrawalStatus";

-- DropEnum
DROP TYPE "public"."DepositWithdrawalStep";
