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
  productId?: number;
  warehouseId?: number;
  lot?: string;
  unitMeasure?: string;
  stocksExpirated?: boolean;
  stocksLow?: boolean;
  limit?: number;
  page?: number;
}

/** Filters accepted by the stock list query. */
export interface StockListFilters {
  productId?: number;
  warehouseId?: number;
  lot?: string;
  unitMeasure?: string;
  stocksExpirated?: boolean;
  stocksLow?: boolean;
  take?: number;
  skip?: number;
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
  unitMeasure?: unitMeasureStock;
  expirationDate?: Date | null;
  updatedOn: Date;
  updatedBy: number;
  warehouseId?: number;
  productId?: number;
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
