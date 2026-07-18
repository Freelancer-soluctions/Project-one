-- DropForeignKey
ALTER TABLE "mentions" DROP CONSTRAINT "mentions_noteId_fkey";

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
