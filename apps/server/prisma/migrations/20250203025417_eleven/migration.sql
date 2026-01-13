/*
  Warnings:

  - You are about to drop the column `closedBy` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the column `closedOn` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the column `document` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the column `documentId` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the column `statusId` on the `notes` table. All the data in the column will be lost.
  - You are about to drop the `noteStatus` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `color` to the `notes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `columnId` to the `notes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `notes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `notes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedOn` to the `notes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "notes" DROP CONSTRAINT "notes_closedBy_fkey";

-- DropForeignKey
ALTER TABLE "notes" DROP CONSTRAINT "notes_statusId_fkey";

-- AlterTable
ALTER TABLE "notes" DROP COLUMN "closedBy",
DROP COLUMN "closedOn",
DROP COLUMN "document",
DROP COLUMN "documentId",
DROP COLUMN "note",
DROP COLUMN "statusId",
ADD COLUMN     "color" VARCHAR(6) NOT NULL,
ADD COLUMN     "columnId" INTEGER NOT NULL,
ADD COLUMN     "content" VARCHAR(2000) NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ADD COLUMN     "updatedOn" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "noteStatus";

-- CreateTable
CREATE TABLE "noteColumns" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(15) NOT NULL,
    "code" VARCHAR(3) NOT NULL,

    CONSTRAINT "noteColumns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "noteColumns_code_key" ON "noteColumns"("code");

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "noteColumns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
