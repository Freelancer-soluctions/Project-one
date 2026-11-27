import type { Prisma } from '@prisma/client';
import type {
  PaymentMethodValue,
  SaleStatusValue,
} from '../../utils/lifecycle/salePurchase.js';

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
  status?: SaleStatusValue;
  startDate?: Date;
  endDate?: Date;
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
  paymentMethod?: PaymentMethodValue | null;
  invoiceNumber?: string | null;
}

/** Payload used to patch a sale. */
export interface SalePatchData {
  clientId?: number | undefined;
  total?: number | undefined;
  updatedBy?: number | undefined;
  details?: SaleDetailInput[] | undefined;
  paymentMethod?: PaymentMethodValue | null | undefined;
  invoiceNumber?: string | null | undefined;
}

/** Sale body accepted by the create/patch endpoints (raw request values). */
export interface SaleInput {
  clientId?: number | string;
  total?: number | string;
  details?: SaleDetailInput[];
  paymentMethod?: PaymentMethodValue | null;
  invoiceNumber?: string | null;
  createdBy?: number | string;
  updatedBy?: number | string;
}

/** Body accepted by `PATCH /sales/:id/status` (lifecycle transition). */
export interface SaleStatusTransitionInput {
  status: SaleStatusValue;
  paymentMethod?: PaymentMethodValue | null | undefined;
  invoiceNumber?: string | null | undefined;
  updatedBy?: number | undefined;
}

/** Persistence payload for a validated sale status transition. */
export interface SaleStatusUpdateData {
  status: SaleStatusValue;
  paidAt?: Date | null | undefined;
  paymentMethod?: PaymentMethodValue | null | undefined;
  invoiceNumber?: string | null | undefined;
  updatedBy?: number | undefined;
}
