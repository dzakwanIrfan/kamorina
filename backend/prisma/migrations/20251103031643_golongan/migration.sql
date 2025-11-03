/*
  Warnings:

  - You are about to drop the column `department_id` on the `users` table. All the data in the column will be lost.
  - Added the required column `department_id` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employee_type` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `golongan_id` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EmployeeType" AS ENUM ('TETAP', 'KONTRAK');

-- DropForeignKey
ALTER TABLE "public"."users" DROP CONSTRAINT "users_department_id_fkey";

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "department_id" TEXT NOT NULL,
ADD COLUMN     "employee_type" "EmployeeType" NOT NULL,
ADD COLUMN     "golongan_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "department_id";

-- CreateTable
CREATE TABLE "golongan" (
    "id" TEXT NOT NULL,
    "golongan_name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "golongan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "golongan_golongan_name_key" ON "golongan"("golongan_name");

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_golongan_id_fkey" FOREIGN KEY ("golongan_id") REFERENCES "golongan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
