/*
  Warnings:

  - You are about to drop the column `productAttributeId` on the `products` table. All the data in the column will be lost.
  - Added the required column `productId` to the `productAttributes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_productAttributeId_fkey";

-- AlterTable
ALTER TABLE "productAttributes" ADD COLUMN     "productId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "productAttributeId";

-- AddForeignKey
ALTER TABLE "productAttributes" ADD CONSTRAINT "productAttributes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
