-- Capability `sale-purchase-status`: lifecycle, payment tracking and invoice
-- numbering for `sale` and `purchase` (RN-SP-001..RN-SP-008).

-- CreateEnum
CREATE TYPE "saleStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED', 'REFUNDED');
CREATE TYPE "purchaseStatus" AS ENUM ('PENDING', 'RECEIVED', 'PAID', 'CANCELLED');
CREATE TYPE "paymentMethod" AS ENUM ('CASH', 'CARD', 'TRANSFER', 'OTHER');

-- AlterTable (expand): the columns are added with a constant DEFAULT so the DDL
-- is non-blocking and existing rows get a valid value immediately.
ALTER TABLE "sale"
  ADD COLUMN "status" "saleStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "paymentMethod" "paymentMethod",
  ADD COLUMN "paidAt" TIMESTAMP(3),
  ADD COLUMN "invoiceNumber" VARCHAR(50);

ALTER TABLE "purchase"
  ADD COLUMN "status" "purchaseStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "paymentMethod" "paymentMethod",
  ADD COLUMN "paidAt" TIMESTAMP(3),
  ADD COLUMN "invoiceNumber" VARCHAR(50);

-- Backfill: historical rows keep counting as revenue/expense (design D3). Every
-- row that exists at this point was created before tracking existed, so it is
-- moved to a settled status and `paidAt` mirrors its creation date.
UPDATE "sale"
   SET "status" = 'PAID',
       "paidAt" = "createdOn"
 WHERE "status" = 'PENDING';

UPDATE "purchase"
   SET "status" = 'PAID',
       "paidAt" = "createdOn"
 WHERE "status" = 'PENDING';

-- New rows keep the PENDING default (the DEFAULT survived the backfill; this is
-- explicit so a future schema diff stays a no-op).
ALTER TABLE "sale" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "purchase" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "sale_invoiceNumber_key" ON "sale"("invoiceNumber");
CREATE UNIQUE INDEX "purchase_providerId_invoiceNumber_key" ON "purchase"("providerId", "invoiceNumber");
