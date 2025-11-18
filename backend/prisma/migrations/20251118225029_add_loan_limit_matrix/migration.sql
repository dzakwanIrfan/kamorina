-- CreateTable
CREATE TABLE "loan_limit_matrix" (
    "id" TEXT NOT NULL,
    "golongan_id" TEXT NOT NULL,
    "min_years_of_service" INTEGER NOT NULL,
    "max_years_of_service" INTEGER,
    "max_loan_amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_limit_matrix_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "loan_limit_matrix_golongan_id_min_years_of_service_max_year_key" ON "loan_limit_matrix"("golongan_id", "min_years_of_service", "max_years_of_service");

-- AddForeignKey
ALTER TABLE "loan_limit_matrix" ADD CONSTRAINT "loan_limit_matrix_golongan_id_fkey" FOREIGN KEY ("golongan_id") REFERENCES "golongan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
