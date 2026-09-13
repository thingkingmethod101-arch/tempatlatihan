-- DropForeignKey
ALTER TABLE "Content" DROP CONSTRAINT "Content_ownerId_fkey";

-- AddForeignKey
ALTER TABLE "Content" ADD CONSTRAINT "Content_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
