/*
  Warnings:

  - Added the required column `createdOn` to the `productAttributes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "productAttributes" ADD COLUMN     "createdOn" TIMESTAMP(3) NOT NULL;
