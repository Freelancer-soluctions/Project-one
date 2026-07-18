-- DropForeignKey
ALTER TABLE "news" DROP CONSTRAINT "news_closedBy_fkey";

-- AlterTable
ALTER TABLE "news" ALTER COLUMN "closedBy" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_closedBy_fkey" FOREIGN KEY ("closedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
