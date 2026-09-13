-- CreateEnum
CREATE TYPE "ReferralType" AS ENUM ('diskon', 'cashback');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('aktif', 'selesai');

-- CreateTable
CREATE TABLE "ReferralCode" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "tipe" "ReferralType" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "persenDiskon" INTEGER,
    "maxUsage" INTEGER,
    "status" "ReferralStatus" NOT NULL DEFAULT 'aktif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralUsage" (
    "id" TEXT NOT NULL,
    "referralCodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isOwnerUsage" BOOLEAN NOT NULL DEFAULT false,
    "discountAmount" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReferralCode_kode_key" ON "ReferralCode"("kode");

-- CreateIndex
CREATE INDEX "ReferralCode_ownerId_idx" ON "ReferralCode"("ownerId");

-- CreateIndex
CREATE INDEX "ReferralUsage_userId_idx" ON "ReferralUsage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralUsage_referralCodeId_userId_key" ON "ReferralUsage"("referralCodeId", "userId");

-- AddForeignKey
ALTER TABLE "ReferralUsage" ADD CONSTRAINT "ReferralUsage_referralCodeId_fkey" FOREIGN KEY ("referralCodeId") REFERENCES "ReferralCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
