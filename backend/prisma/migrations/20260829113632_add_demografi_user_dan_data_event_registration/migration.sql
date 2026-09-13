-- CreateEnum
CREATE TYPE "JenisKelamin" AS ENUM ('L', 'P');

-- AlterTable
ALTER TABLE "EventRegistration" ADD COLUMN     "alamatPengiriman" TEXT,
ADD COLUMN     "asalSekolahSaatDaftar" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "alamat" TEXT,
ADD COLUMN     "jenisKelamin" "JenisKelamin",
ADD COLUMN     "tanggalLahir" TIMESTAMP(3);
