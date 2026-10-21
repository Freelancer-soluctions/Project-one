import type { Prisma } from '@prisma/client';

/** Purchase row as stored in the database. */
export type PurchaseRecord = Prisma.purchaseGetPayload<object>;

/** Purchase detail row. */
export type PurchaseDetailRecord = Prisma.purchaseDetailGetPayload<object>;

/** Purchase with provider and product-aware details, as returned by the list. */
export type PurchaseListItem = Prisma.purchaseGetPayload<{
  include: {
    provider: true;
    purchaseDetail: { include: { product: true } };
  };
}>;

/** Filters accepted by the purchase list query. */
export interface PurchaseListFilters {
  providerId?: number;
  startDate?: Date;
  endDate?: Date;
  minTotal?: number;
  maxTotal?: number;
}

/** Query parameters accepted by the purchase listing endpoint. */
export interface PurchasesQuery extends PurchaseListFilters {
  page?: number;
  limit?: number;
}

/** Paginated purchase list. */
export interface PurchasesPage {
  dataList: PurchaseListItem[];
  total: number;
}

/** Detail line accepted by the create/patch purchase endpoints. */
export interface PurchaseDetailInput {
  productId: number;
  quantity: number;
  price: number;
}

/** Payload used to create a purchase (with its details). */
export interface PurchaseCreateData {
  providerId: number;
  total: number;
  createdBy: number;
  createdOn: Date;
  details: PurchaseDetailInput[];
}

/** Payload used to patch a purchase. */
export interface PurchasePatchData {
  providerId?: number;
  total?: number;
  updatedBy?: number;
  details?: PurchaseDetailInput[];
}

/** Purchase body accepted by the create/patch endpoints (raw request values). */
export interface PurchaseInput {
  providerId?: number | string;
  total?: number | string;
  details?: PurchaseDetailInput[];
  createdBy?: number | string;
  updatedBy?: number | string;
}
