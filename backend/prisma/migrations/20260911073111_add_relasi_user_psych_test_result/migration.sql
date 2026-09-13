-- AddForeignKey
ALTER TABLE "PsychTestResult" ADD CONSTRAINT "PsychTestResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
