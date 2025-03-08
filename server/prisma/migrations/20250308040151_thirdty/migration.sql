-- DropForeignKey
ALTER TABLE "productAttributes" DROP CONSTRAINT "productAttributes_productId_fkey";

-- AddForeignKey
ALTER TABLE "productAttributes" ADD CONSTRAINT "productAttributes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
