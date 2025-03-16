/*
  Warnings:

  - You are about to drop the `Stock` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Warehouse` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "warehouseStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'MAINTENANCE');

-- DropForeignKey
ALTER TABLE "Stock" DROP CONSTRAINT "Stock_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Stock" DROP CONSTRAINT "Stock_productId_fkey";

-- DropForeignKey
ALTER TABLE "Stock" DROP CONSTRAINT "Stock_updatedBy_fkey";

-- DropForeignKey
ALTER TABLE "Stock" DROP CONSTRAINT "Stock_warehouseId_fkey";

-- DropTable
DROP TABLE "Stock";

-- DropTable
DROP TABLE "Warehouse";

-- DropEnum
DROP TYPE "WarehouseStatus";

-- CreateTable
CREATE TABLE "warehouse" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(120),
    "address" VARCHAR(120),
    "status" "warehouseStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdOn" TIMESTAMP(3) NOT NULL,
    "updatedOn" TIMESTAMP(3),

    CONSTRAINT "warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock" (
    "id" SERIAL NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "minimum" INTEGER NOT NULL DEFAULT 0,
    "maximum" INTEGER,
    "lot" TEXT,
    "unitMeasure" "unitMeasureStock" NOT NULL DEFAULT 'PIECES',
    "expirationDate" TIMESTAMP(3),
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "productId" INTEGER NOT NULL,
    "warehouseId" INTEGER NOT NULL,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedOn" TIMESTAMP(3),
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,

    CONSTRAINT "stock_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
