-- AlterEnum
ALTER TYPE "FilePurpose" ADD VALUE 'bukti_pembukuan';

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "keterangan" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "jumlah" DECIMAL(12,2) NOT NULL,
    "buktiFileAssetId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LedgerEntry_tanggal_idx" ON "LedgerEntry"("tanggal");
