-- AlterTable
ALTER TABLE "news" ADD COLUMN     "pendingBy" INTEGER;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_pendingBy_fkey" FOREIGN KEY ("pendingBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
