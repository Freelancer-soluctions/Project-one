-- CreateEnum
CREATE TYPE "orderStatus" AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'RECEIVED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "expenseCategory" AS ENUM ('RENTAL', 'UTILITIES', 'SALARIES', 'SUPPLIES', 'TRANSPORT', 'MAINTENANCE', 'MARKETING', 'SOFTWARE', 'PROFESSIONAL_SERVICES', 'TAXES', 'BANK_FEES', 'TRAVEL', 'TRAINING', 'OTHER');

-- DropForeignKey
ALTER TABLE "purchaseDetail" DROP CONSTRAINT "purchaseDetail_purchaseId_fkey";

-- DropForeignKey
ALTER TABLE "saleDetail" DROP CONSTRAINT "saleDetail_saleId_fkey";

-- CreateTable
CREATE TABLE "clientOrder" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "status" "orderStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdOn" TIMESTAMP(3) NOT NULL,
    "updatedOn" TIMESTAMP(3),
    "saleId" INTEGER,

    CONSTRAINT "clientOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientOrderDetail" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "clientOrderDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providerOrder" (
    "id" SERIAL NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "status" "orderStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdOn" TIMESTAMP(3) NOT NULL,
    "updatedOn" TIMESTAMP(3),
    "purchaseId" INTEGER,

    CONSTRAINT "providerOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providerOrderDetail" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "estimatedPrice" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "providerOrderDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,
    "createdOn" TIMESTAMP(3) NOT NULL,
    "updatedOn" TIMESTAMP(3),
    "status" "expenseCategory" NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "purchaseDetail" ADD CONSTRAINT "purchaseDetail_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saleDetail" ADD CONSTRAINT "saleDetail_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientOrder" ADD CONSTRAINT "clientOrder_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientOrder" ADD CONSTRAINT "clientOrder_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientOrder" ADD CONSTRAINT "clientOrder_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientOrder" ADD CONSTRAINT "clientOrder_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientOrderDetail" ADD CONSTRAINT "clientOrderDetail_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "clientOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientOrderDetail" ADD CONSTRAINT "clientOrderDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providerOrder" ADD CONSTRAINT "providerOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "productProviders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providerOrder" ADD CONSTRAINT "providerOrder_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providerOrder" ADD CONSTRAINT "providerOrder_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providerOrder" ADD CONSTRAINT "providerOrder_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providerOrderDetail" ADD CONSTRAINT "providerOrderDetail_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "providerOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "providerOrderDetail" ADD CONSTRAINT "providerOrderDetail_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
