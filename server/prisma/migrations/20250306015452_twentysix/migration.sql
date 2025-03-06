/*
  Warnings:

  - You are about to drop the column `productTypeId` on the `products` table. All the data in the column will be lost.
  - You are about to drop the `productTypes` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[barCode]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productProviderId` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_productTypeId_fkey";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "productTypeId",
ADD COLUMN     "productProviderId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "productTypes";

-- CreateTable
CREATE TABLE "productProviders" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "description" VARCHAR(20) NOT NULL,

    CONSTRAINT "productProviders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "productProviders_code_key" ON "productProviders"("code");

-- CreateIndex
CREATE UNIQUE INDEX "productProviders_description_key" ON "productProviders"("description");

-- CreateIndex
CREATE UNIQUE INDEX "products_barCode_key" ON "products"("barCode");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_productProviderId_fkey" FOREIGN KEY ("productProviderId") REFERENCES "productProviders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
