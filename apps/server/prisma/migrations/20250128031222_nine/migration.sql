/*
  Warnings:

  - Added the required column `userId` to the `settings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "news" ALTER COLUMN "createdOn" DROP DEFAULT;

-- AlterTable
ALTER TABLE "notes" ALTER COLUMN "createdOn" DROP DEFAULT;

-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedOn" TIMESTAMP(3),
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
