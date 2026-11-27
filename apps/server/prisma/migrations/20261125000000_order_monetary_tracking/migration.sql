-- AlterTable: monetary precision (Float -> DECIMAL(18,2))
ALTER TABLE "clientOrderDetail"
  ALTER COLUMN "unitPrice" SET DATA TYPE DECIMAL(18, 2);

ALTER TABLE "providerOrderDetail"
  ALTER COLUMN "estimatedPrice" SET DATA TYPE DECIMAL(18, 2);

-- AlterTable: persisted total + delivery tracking.
-- The feature never shipped, so existing rows (if any) are backfilled with 0.
ALTER TABLE "clientOrder"
  ADD COLUMN "total" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN "expectedDeliveryDate" TIMESTAMP(3),
  ADD COLUMN "deliveredOn" TIMESTAMP(3);

ALTER TABLE "providerOrder"
  ADD COLUMN "total" DECIMAL(18, 2) NOT NULL DEFAULT 0,
  ADD COLUMN "expectedDeliveryDate" TIMESTAMP(3),
  ADD COLUMN "deliveredOn" TIMESTAMP(3);
