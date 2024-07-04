/*
  Warnings:

  - You are about to drop the column `picturte` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "picturte",
ADD COLUMN     "picture" TEXT;
