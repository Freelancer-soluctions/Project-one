/*
  Warnings:

  - A unique constraint covering the columns `[productId,warehouseId,lot,expirationDate]` on the table `stock` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "stock_productId_warehouseId_lot_expirationDate_key" ON "stock"("productId", "warehouseId", "lot", "expirationDate");
