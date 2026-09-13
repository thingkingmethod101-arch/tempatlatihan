-- CreateTable
CREATE TABLE "RiasecMapping" (
    "id" TEXT NOT NULL,
    "kombinasi" TEXT NOT NULL,
    "saranJurusan" TEXT NOT NULL,
    "saranKarir" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiasecMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RiasecMapping_kombinasi_key" ON "RiasecMapping"("kombinasi");
