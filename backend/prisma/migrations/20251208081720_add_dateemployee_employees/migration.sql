/*
  Warnings:

  - You are about to drop the column `permanent_employee_date` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "permanent_employee_date" DATE;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "permanent_employee_date";
