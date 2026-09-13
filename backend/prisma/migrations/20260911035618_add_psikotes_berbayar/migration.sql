-- AlterTable
ALTER TABLE "PsychTestQuestion" ADD COLUMN     "tier" TEXT NOT NULL DEFAULT 'gratis';

-- AlterTable
ALTER TABLE "PsychTestResult" ADD COLUMN     "tipeTes" TEXT NOT NULL DEFAULT 'gratis';

-- CreateTable
CREATE TABLE "PsychTestSetting" (
    "id" TEXT NOT NULL,
    "harga" DECIMAL(12,2) NOT NULL DEFAULT 0,

    CONSTRAINT "PsychTestSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PsychTestAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dipakai" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PsychTestAccess_pkey" PRIMARY KEY ("id")
);
