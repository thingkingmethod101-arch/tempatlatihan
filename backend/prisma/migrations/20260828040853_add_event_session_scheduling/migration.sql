-- CreateTable
CREATE TABLE "EventSession" (
    "id" TEXT NOT NULL,
    "eventRoundId" TEXT NOT NULL,
    "waktuMulai" TIMESTAMP(3) NOT NULL,
    "waktuSelesai" TIMESTAMP(3) NOT NULL,
    "kuota" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSessionAssignment" (
    "id" TEXT NOT NULL,
    "eventSessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventSessionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventSession_eventRoundId_idx" ON "EventSession"("eventRoundId");

-- CreateIndex
CREATE INDEX "EventSessionAssignment_userId_idx" ON "EventSessionAssignment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventSessionAssignment_eventSessionId_userId_key" ON "EventSessionAssignment"("eventSessionId", "userId");

-- AddForeignKey
ALTER TABLE "EventSession" ADD CONSTRAINT "EventSession_eventRoundId_fkey" FOREIGN KEY ("eventRoundId") REFERENCES "EventRound"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventSessionAssignment" ADD CONSTRAINT "EventSessionAssignment_eventSessionId_fkey" FOREIGN KEY ("eventSessionId") REFERENCES "EventSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
