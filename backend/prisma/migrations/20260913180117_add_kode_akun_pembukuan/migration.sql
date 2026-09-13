-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN     "kodeAkun" TEXT;

-- CreateTable
CREATE TABLE "KodeAkunReference" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KodeAkunReference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KodeAkunReference_kode_key" ON "KodeAkunReference"("kode");
