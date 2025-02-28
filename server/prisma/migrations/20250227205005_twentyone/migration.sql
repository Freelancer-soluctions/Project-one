/*
  Warnings:

  - You are about to drop the `productType` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_productTypeId_fkey";

-- DropTable
DROP TABLE "productType";

-- CreateTable
CREATE TABLE "productTypes" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "description" VARCHAR(10) NOT NULL,

    CONSTRAINT "productTypes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "productTypes_code_key" ON "productTypes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "productTypes_description_key" ON "productTypes"("description");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_productTypeId_fkey" FOREIGN KEY ("productTypeId") REFERENCES "productTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
