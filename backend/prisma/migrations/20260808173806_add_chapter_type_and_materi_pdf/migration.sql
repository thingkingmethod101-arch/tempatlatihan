-- AlterEnum
ALTER TYPE "FilePurpose" ADD VALUE 'materi_konten';

-- AlterTable
ALTER TABLE "ContentChapter" ADD COLUMN     "materiFileAssetId" TEXT,
ADD COLUMN     "tipe" TEXT NOT NULL DEFAULT 'latihan_soal';
