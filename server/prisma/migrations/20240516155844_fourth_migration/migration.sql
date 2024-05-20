/*
  Warnings:

  - You are about to drop the column `closedAt` on the `News` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `News` table. All the data in the column will be lost.
  - You are about to drop the column `closedAt` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Note` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `NewsStatus` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `NoteStatus` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `UserStatus` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `closedOn` to the `News` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `NewsStatus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `closedOn` to the `Note` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `NoteStatus` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `UserStatus` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "News" DROP COLUMN "closedAt",
DROP COLUMN "createdAt",
ADD COLUMN     "closedOn" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "NewsStatus" ADD COLUMN     "code" VARCHAR(3) NOT NULL;

-- AlterTable
ALTER TABLE "Note" DROP COLUMN "closedAt",
DROP COLUMN "createdAt",
ADD COLUMN     "closedOn" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "NoteStatus" ADD COLUMN     "code" VARCHAR(3) NOT NULL;

-- AlterTable
ALTER TABLE "UserStatus" ADD COLUMN     "code" VARCHAR(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "NewsStatus_code_key" ON "NewsStatus"("code");

-- CreateIndex
CREATE UNIQUE INDEX "NoteStatus_code_key" ON "NoteStatus"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserStatus_code_key" ON "UserStatus"("code");
