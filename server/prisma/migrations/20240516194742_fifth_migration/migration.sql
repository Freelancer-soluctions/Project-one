/*
  Warnings:

  - You are about to alter the column `description` on the `Role` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `VarChar(50)`.

*/
-- AlterTable
ALTER TABLE "Role" ALTER COLUMN "description" SET DATA TYPE VARCHAR(50);
