-- AddForeignKey
ALTER TABLE "TutorStudentLink" ADD CONSTRAINT "TutorStudentLink_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TutorStudentLink" ADD CONSTRAINT "TutorStudentLink_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
