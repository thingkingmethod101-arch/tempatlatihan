-- CreateTable
CREATE TABLE "TutorStudentLink" (
    "id" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "siswaId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TutorStudentLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TutorStudentLink_tutorId_siswaId_key" ON "TutorStudentLink"("tutorId", "siswaId");
