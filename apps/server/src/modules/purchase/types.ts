import type { Prisma } from '@prisma/client';
import type {
  PaymentMethodValue,
  PurchaseStatusValue,
} from '../../utils/lifecycle/salePurchase.js';

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
  status?: PurchaseStatusValue;
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
  paymentMethod?: PaymentMethodValue | null;
  invoiceNumber?: string | null;
}

/** Payload used to patch a purchase. */
export interface PurchasePatchData {
  providerId?: number;
  total?: number;
  updatedBy?: number;
  details?: PurchaseDetailInput[];
  paymentMethod?: PaymentMethodValue | null;
  invoiceNumber?: string | null;
}

/** Purchase body accepted by the create/patch endpoints (raw request values). */
export interface PurchaseInput {
  providerId?: number | string;
  total?: number | string;
  details?: PurchaseDetailInput[];
  paymentMethod?: PaymentMethodValue | null;
  invoiceNumber?: string | null;
  createdBy?: number | string;
  updatedBy?: number | string;
}

/** Body accepted by `PATCH /purchases/:id/status` (lifecycle transition). */
export interface PurchaseStatusTransitionInput {
  status: PurchaseStatusValue;
  paymentMethod?: PaymentMethodValue | null | undefined;
  invoiceNumber?: string | null | undefined;
  updatedBy?: number | undefined;
}

/** Persistence payload for a validated purchase status transition. */
export interface PurchaseStatusUpdateData {
  status: PurchaseStatusValue;
  paidAt?: Date | null | undefined;
  paymentMethod?: PaymentMethodValue | null | undefined;
  invoiceNumber?: string | null | undefined;
  updatedBy?: number | undefined;
}
