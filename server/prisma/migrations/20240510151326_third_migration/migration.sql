/*
  Warnings:

  - Added the required column `documentId` to the `User` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `birthday` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "News" ADD COLUMN     "documentId" TEXT;

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "documentId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "documentId" TEXT NOT NULL,
DROP COLUMN "birthday",
ADD COLUMN     "birthday" TIMESTAMP NOT NULL;
