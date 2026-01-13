-- AlterTable
ALTER TABLE "products" ADD COLUMN     "productAttributeId" INTEGER;

-- CreateTable
CREATE TABLE "productAttributes" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(100) NOT NULL,

    CONSTRAINT "productAttributes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_productAttributeId_fkey" FOREIGN KEY ("productAttributeId") REFERENCES "productAttributes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
