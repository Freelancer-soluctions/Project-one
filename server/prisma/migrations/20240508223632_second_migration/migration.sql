/*
  Warnings:

  - You are about to drop the `NewStatus` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "News" DROP CONSTRAINT "News_statusId_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "accessConfiguration" BOOLEAN DEFAULT false,
ADD COLUMN     "accessNews" BOOLEAN DEFAULT false,
ALTER COLUMN "isAdmin" SET DEFAULT false,
ALTER COLUMN "isManager" SET DEFAULT false;

-- DropTable
DROP TABLE "NewStatus";

-- CreateTable
CREATE TABLE "NewsStatus" (
    "id" SERIAL NOT NULL,
    "description" VARCHAR(10) NOT NULL,

    CONSTRAINT "NewsStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsStatus_description_key" ON "NewsStatus"("description");

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "NewsStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
