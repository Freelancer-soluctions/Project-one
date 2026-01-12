/*
  Warnings:

  - You are about to drop the column `Description` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "Description",
ADD COLUMN     "description" VARCHAR(2000);
