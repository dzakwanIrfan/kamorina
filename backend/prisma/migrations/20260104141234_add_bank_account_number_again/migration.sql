/*
  Warnings:

  - You are about to drop the column `bank_account_number` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `bank_account_number` on the `users` table. All the data in the column will be lost.
  - Added the required column `bankAccountNumber` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "employees" DROP COLUMN "bank_account_number",
ADD COLUMN     "bankAccountNumber" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "bank_account_number";
