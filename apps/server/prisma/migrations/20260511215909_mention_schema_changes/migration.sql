/*
  Warnings:

  - You are about to drop the column `positionEnd` on the `mentions` table. All the data in the column will be lost.
  - You are about to drop the column `positionStart` on the `mentions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "mentions" DROP COLUMN "positionEnd",
DROP COLUMN "positionStart";
