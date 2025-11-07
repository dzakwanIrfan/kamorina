-- AlterTable
ALTER TABLE "member_applications" ADD COLUMN     "last_submitted_at" TIMESTAMP(3),
ADD COLUMN     "submission_count" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "application_history" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL,
    "nik" TEXT,
    "npwp" TEXT,
    "dateOfBirth" DATE,
    "birthPlace" TEXT,
    "permanentEmployeeDate" DATE,
    "installmentPlan" INTEGER,
    "submitted_at" TIMESTAMP(3) NOT NULL,
    "rejected_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "processed_by" TEXT,
    "submission_number" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "application_history" ADD CONSTRAINT "application_history_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "member_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_history" ADD CONSTRAINT "application_history_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
