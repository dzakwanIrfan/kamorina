-- AlterTable
ALTER TABLE "email_logs" ADD COLUMN     "retry_count" INTEGER NOT NULL DEFAULT 0;
