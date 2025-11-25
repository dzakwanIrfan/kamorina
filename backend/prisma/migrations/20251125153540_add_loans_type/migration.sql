/*
  Warnings:

  - Added the required column `loanType` to the `loan_history` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "LoanType" AS ENUM ('CASH_LOAN', 'GOODS_REIMBURSE', 'GOODS_ONLINE', 'GOODS_PHONE');

-- AlterTable
ALTER TABLE "loan_applications" ADD COLUMN     "loan_type" "LoanType" NOT NULL DEFAULT 'CASH_LOAN';

-- AlterTable
ALTER TABLE "loan_history" ADD COLUMN     "loanType" "LoanType" NOT NULL;

-- CreateTable
CREATE TABLE "cash_loan_details" (
    "id" TEXT NOT NULL,
    "loan_application_id" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cash_loan_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_reimburse_details" (
    "id" TEXT NOT NULL,
    "loan_application_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "item_price" DECIMAL(15,2) NOT NULL,
    "purchase_date" DATE NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goods_reimburse_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_online_details" (
    "id" TEXT NOT NULL,
    "loan_application_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "item_price" DECIMAL(15,2) NOT NULL,
    "item_url" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goods_online_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goods_phone_details" (
    "id" TEXT NOT NULL,
    "loan_application_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "retail_price" DECIMAL(15,2) NOT NULL,
    "cooperative_price" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "goods_phone_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cash_loan_details_loan_application_id_key" ON "cash_loan_details"("loan_application_id");

-- CreateIndex
CREATE UNIQUE INDEX "goods_reimburse_details_loan_application_id_key" ON "goods_reimburse_details"("loan_application_id");

-- CreateIndex
CREATE INDEX "goods_reimburse_details_item_name_idx" ON "goods_reimburse_details"("item_name");

-- CreateIndex
CREATE INDEX "goods_reimburse_details_item_price_idx" ON "goods_reimburse_details"("item_price");

-- CreateIndex
CREATE INDEX "goods_reimburse_details_purchase_date_idx" ON "goods_reimburse_details"("purchase_date");

-- CreateIndex
CREATE UNIQUE INDEX "goods_online_details_loan_application_id_key" ON "goods_online_details"("loan_application_id");

-- CreateIndex
CREATE INDEX "goods_online_details_item_name_idx" ON "goods_online_details"("item_name");

-- CreateIndex
CREATE INDEX "goods_online_details_item_price_idx" ON "goods_online_details"("item_price");

-- CreateIndex
CREATE UNIQUE INDEX "goods_phone_details_loan_application_id_key" ON "goods_phone_details"("loan_application_id");

-- CreateIndex
CREATE INDEX "goods_phone_details_item_name_idx" ON "goods_phone_details"("item_name");

-- CreateIndex
CREATE INDEX "goods_phone_details_retail_price_idx" ON "goods_phone_details"("retail_price");

-- CreateIndex
CREATE INDEX "goods_phone_details_cooperative_price_idx" ON "goods_phone_details"("cooperative_price");

-- CreateIndex
CREATE INDEX "loan_applications_user_id_idx" ON "loan_applications"("user_id");

-- CreateIndex
CREATE INDEX "loan_applications_loan_type_idx" ON "loan_applications"("loan_type");

-- CreateIndex
CREATE INDEX "loan_applications_status_idx" ON "loan_applications"("status");

-- CreateIndex
CREATE INDEX "loan_applications_submitted_at_idx" ON "loan_applications"("submitted_at");

-- CreateIndex
CREATE INDEX "loan_applications_loan_type_status_idx" ON "loan_applications"("loan_type", "status");

-- CreateIndex
CREATE INDEX "loan_applications_user_id_loan_type_idx" ON "loan_applications"("user_id", "loan_type");

-- CreateIndex
CREATE INDEX "loan_approvals_loan_application_id_idx" ON "loan_approvals"("loan_application_id");

-- CreateIndex
CREATE INDEX "loan_approvals_step_idx" ON "loan_approvals"("step");

-- CreateIndex
CREATE INDEX "loan_history_loan_application_id_idx" ON "loan_history"("loan_application_id");

-- AddForeignKey
ALTER TABLE "cash_loan_details" ADD CONSTRAINT "cash_loan_details_loan_application_id_fkey" FOREIGN KEY ("loan_application_id") REFERENCES "loan_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_reimburse_details" ADD CONSTRAINT "goods_reimburse_details_loan_application_id_fkey" FOREIGN KEY ("loan_application_id") REFERENCES "loan_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_online_details" ADD CONSTRAINT "goods_online_details_loan_application_id_fkey" FOREIGN KEY ("loan_application_id") REFERENCES "loan_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goods_phone_details" ADD CONSTRAINT "goods_phone_details_loan_application_id_fkey" FOREIGN KEY ("loan_application_id") REFERENCES "loan_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
