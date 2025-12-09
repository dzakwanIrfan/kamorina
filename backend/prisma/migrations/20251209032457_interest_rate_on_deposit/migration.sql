/*
  Warnings:

  - Added the required column `interestRate` to the `deposit_applications` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "deposit_applications" ADD COLUMN     "interestRate" DECIMAL(5,2) NOT NULL;
