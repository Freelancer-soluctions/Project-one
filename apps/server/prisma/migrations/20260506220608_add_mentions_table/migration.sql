-- DropForeignKey
ALTER TABLE "mentions" DROP CONSTRAINT "mentions_mentionedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "mentions" DROP CONSTRAINT "mentions_mentionedUserId_fkey";

-- DropForeignKey
ALTER TABLE "mentions" DROP CONSTRAINT "mentions_noteId_fkey";

-- DropIndex
DROP INDEX "mentions_mentionedByUserId_idx";

-- DropIndex
DROP INDEX "mentions_mentionedUserId_idx";

-- DropIndex
DROP INDEX "mentions_noteId_idx";

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_mentionedUserId_fkey" FOREIGN KEY ("mentionedUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_mentionedByUserId_fkey" FOREIGN KEY ("mentionedByUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
