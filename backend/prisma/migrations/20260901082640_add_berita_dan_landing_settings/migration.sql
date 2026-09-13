-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FilePurpose" ADD VALUE 'berita_gambar';
ALTER TYPE "FilePurpose" ADD VALUE 'landing_image';

-- CreateTable
CREATE TABLE "Berita" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "tag" TEXT,
    "isi" TEXT NOT NULL,
    "gambarFileAssetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Berita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LandingSettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "heroImageId" TEXT,
    "testImageId" TEXT,
    "galleryImageId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LandingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Berita_createdAt_idx" ON "Berita"("createdAt");
