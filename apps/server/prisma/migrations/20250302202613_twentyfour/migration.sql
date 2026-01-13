-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_updatedBy_fkey";

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "updatedBy" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
