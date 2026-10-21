import type { Prisma } from '@prisma/client';

/** Sale row as stored in the database. */
export type SaleRecord = Prisma.saleGetPayload<object>;

/** Sale detail row. */
export type SaleDetailRecord = Prisma.saleDetailGetPayload<object>;

/** Sale with client, details and audit users, as returned by the list. */
export type SaleListItem = Prisma.saleGetPayload<{
  include: {
    client: true;
    saleDetail: true;
    userSaleCreated: { select: { name: true } };
    userSaleUpdated: { select: { name: true } };
  };
}>;

/** Filters accepted by the sale list query. */
export interface SaleListFilters {
  clientId?: number;
  fromDate?: Date;
  toDate?: Date;
  minTotal?: number;
  maxTotal?: number;
}

/** Query parameters accepted by the sale listing endpoint. */
export interface SalesQuery extends SaleListFilters {
  page?: number;
  limit?: number;
}

/** Detail line accepted by the create/patch sale endpoints. */
export interface SaleDetailInput {
  productId: number | string;
  quantity: number | string;
  price: number | string;
}

/** Payload used to create a sale (with its details). */
export interface SaleCreateData {
  clientId: number;
  total: number;
  createdBy: number;
  createdOn: Date;
  details: SaleDetailInput[];
}

/** Payload used to patch a sale. */
export interface SalePatchData {
  clientId?: number;
  total?: number;
  updatedBy?: number;
  details?: SaleDetailInput[];
}

/** Sale body accepted by the create/patch endpoints (raw request values). */
export interface SaleInput {
  clientId?: number | string;
  total?: number | string;
  details?: SaleDetailInput[];
  createdBy?: number | string;
  updatedBy?: number | string;
}
