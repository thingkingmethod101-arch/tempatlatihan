-- CreateTable
CREATE TABLE "PsychTestQuestion" (
    "id" TEXT NOT NULL,
    "teks" TEXT NOT NULL,
    "allowMultiple" BOOLEAN NOT NULL DEFAULT false,
    "urutan" INTEGER NOT NULL,

    CONSTRAINT "PsychTestQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PsychTestOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "teks" TEXT NOT NULL,
    "bobot" JSONB NOT NULL,

    CONSTRAINT "PsychTestOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PsychTestResult" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jawaban" JSONB NOT NULL,
    "skorTrait" JSONB NOT NULL,
    "rekomendasi" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PsychTestResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PsychTestOption_questionId_idx" ON "PsychTestOption"("questionId");

-- CreateIndex
CREATE INDEX "PsychTestResult_userId_idx" ON "PsychTestResult"("userId");

-- AddForeignKey
ALTER TABLE "PsychTestOption" ADD CONSTRAINT "PsychTestOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "PsychTestQuestion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
