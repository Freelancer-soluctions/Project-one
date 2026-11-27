-- RN-SP-008: the sale/purchase list filters by status and orders by createdOn.
CREATE INDEX "sale_status_createdOn_idx" ON "sale"("status", "createdOn");
CREATE INDEX "purchase_status_createdOn_idx" ON "purchase"("status", "createdOn");
