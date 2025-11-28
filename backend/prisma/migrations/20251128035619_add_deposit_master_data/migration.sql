/*
  Warnings:

  - You are about to drop the column `deposit_amount` on the `deposit_applications` table. All the data in the column will be lost.
  - You are about to drop the column `deposit_tenor` on the `deposit_applications` table. All the data in the column will be lost.
  - You are about to drop the column `depositAmount` on the `deposit_history` table. All the data in the column will be lost.
  - You are about to drop the column `depositTenor` on the `deposit_history` table. All the data in the column will be lost.
  - Added the required column `deposit_amount_code` to the `deposit_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deposit_tenor_code` to the `deposit_applications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deposit_amount_code` to the `deposit_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `deposit_tenor_code` to the `deposit_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "deposit_applications" DROP COLUMN "deposit_amount",
DROP COLUMN "deposit_tenor",
ADD COLUMN     "deposit_amount_code" TEXT NOT NULL,
ADD COLUMN     "deposit_tenor_code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "deposit_history" DROP COLUMN "depositAmount",
DROP COLUMN "depositTenor",
ADD COLUMN     "deposit_amount_code" TEXT NOT NULL,
ADD COLUMN     "deposit_tenor_code" TEXT NOT NULL;

-- DropEnum
DROP TYPE "public"."DepositAmount";

-- DropEnum
DROP TYPE "public"."DepositTenor";

-- CreateTable
CREATE TABLE "deposit_amount_options" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposit_amount_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_tenor_options" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "months" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deposit_tenor_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deposit_amount_options_code_key" ON "deposit_amount_options"("code");

-- CreateIndex
CREATE UNIQUE INDEX "deposit_tenor_options_code_key" ON "deposit_tenor_options"("code");
