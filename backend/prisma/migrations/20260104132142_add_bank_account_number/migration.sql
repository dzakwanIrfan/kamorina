/*
  Warnings:

  - Made the column `bank_account_number` on table `employees` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "employees" ALTER COLUMN "bank_account_number" SET NOT NULL;
