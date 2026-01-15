/*
  Warnings:

  - Added the required column `bankAccountName` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "bankAccountName" TEXT NOT NULL;
