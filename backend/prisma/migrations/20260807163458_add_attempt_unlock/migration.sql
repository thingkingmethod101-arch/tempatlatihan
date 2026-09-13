-- CreateTable
CREATE TABLE "AttemptUnlock" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventRoundId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "AttemptUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AttemptUnlock_userId_eventRoundId_key" ON "AttemptUnlock"("userId", "eventRoundId");
