-- CreateEnum
CREATE TYPE "SocialFundTransactionType" AS ENUM ('INITIAL_BALANCE', 'ADJUSTMENT', 'SANTUNAN');

-- CreateTable
CREATE TABLE "social_fund_balance" (
    "id" TEXT NOT NULL,
    "current_balance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_fund_balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_fund_transactions" (
    "id" TEXT NOT NULL,
    "type" "SocialFundTransactionType" NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "balance_after" DECIMAL(15,2) NOT NULL,
    "description" TEXT,
    "recipient_user_id" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_fund_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "social_fund_transactions_type_idx" ON "social_fund_transactions"("type");

-- CreateIndex
CREATE INDEX "social_fund_transactions_recipient_user_id_idx" ON "social_fund_transactions"("recipient_user_id");

-- CreateIndex
CREATE INDEX "social_fund_transactions_created_at_idx" ON "social_fund_transactions"("created_at");

-- AddForeignKey
ALTER TABLE "social_fund_transactions" ADD CONSTRAINT "social_fund_transactions_recipient_user_id_fkey" FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_fund_transactions" ADD CONSTRAINT "social_fund_transactions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
