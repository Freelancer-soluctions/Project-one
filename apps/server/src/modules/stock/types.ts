import type { Prisma, unitMeasureStock } from '@prisma/client';

/** Stock row as stored in the database. */
export type StockRecord = Prisma.stockGetPayload<object>;

/** Aggregated expired/low-stock counters. */
export interface StockAlerts {
  expired: number;
  lowStock: number;
}

/** Query parameters accepted by the stock listing endpoint. */
export interface StockQuery {
  productId?: number | undefined;
  warehouseId?: number | undefined;
  lot?: string | undefined;
  unitMeasure?: string | undefined;
  stocksExpirated?: boolean | undefined;
  stocksLow?: boolean | undefined;
  limit?: number | undefined;
  page?: number | undefined;
}

/** Filters accepted by the stock list query. */
export interface StockListFilters {
  productId?: number | undefined;
  warehouseId?: number | undefined;
  lot?: string | undefined;
  unitMeasure?: string | undefined;
  stocksExpirated?: boolean | undefined;
  stocksLow?: boolean | undefined;
  take?: number | undefined;
  skip?: number | undefined;
}

/** Payload used to create a stock entry. */
export interface StockCreateData {
  quantity: number;
  minimum: number;
  maximum?: number | null;
  lot?: string | null;
  unitMeasure: unitMeasureStock;
  expirationDate?: Date | null;
  createdOn: Date;
  createdBy: number;
  warehouseId: number;
  productId: number;
}

/** Payload used to update a stock entry. */
export interface StockUpdateData {
  quantity?: number;
  minimum?: number;
  maximum?: number | null;
  lot?: string | null;
  unitMeasure?: unitMeasureStock | undefined;
  expirationDate?: Date | null | undefined;
  updatedOn: Date;
  updatedBy: number;
  warehouseId?: number | undefined;
  productId?: number | undefined;
}

/** Stock body accepted by the create/patch endpoints (raw request values). */
export interface StockInput {
  quantity?: number;
  minimum?: number;
  maximum?: number | null;
  lot?: string | null;
  unitMeasure?: unitMeasureStock;
  expirationDate?: Date | string | null;
  warehouseId?: number;
  productId?: number;
}
