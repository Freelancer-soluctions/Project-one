import type { Prisma } from '@prisma/client';
import type { OrderStatusValue } from '../orders/orderLifecycle.js';

/** Detail line accepted by the client order create/patch endpoints. */
export interface ClientOrderDetailInput {
  productId: number;
  quantity: number;
  unitPrice: number | string;
}

/** Client order with client, product-aware details, sale and audit users. */
export type ClientOrderListItem = Prisma.clientOrderGetPayload<{
  include: {
    clients: true;
    details: {
      include: {
        clientOrderDetail: { select: { id: true; name: true; sku: true } };
      };
    };
    sale: true;
    userClientOrderCreated: { select: { name: true } };
    userClientOrderUpdated: { select: { name: true } };
  };
}>;

/** Filters accepted by the client order list query. */
export interface ClientOrderListFilters {
  clientId?: number;
  status?: OrderStatusValue;
}

/** Query parameters accepted by the client order listing endpoint. */
export interface ClientOrdersQuery extends ClientOrderListFilters {
  page?: number;
  limit?: number;
}

/** Paginated client order list (shape expected by the client datatable). */
export interface ClientOrdersPage {
  dataList: ClientOrderListItem[];
  total: number;
}

/** Payload used to create a client order (with its details). */
export interface ClientOrderCreateData {
  clientId: number;
  createdBy: number;
  details: ClientOrderDetailInput[];
  status?: OrderStatusValue;
  notes?: string | null;
  /** Raw body values are ISO strings; the service normalizes them to Date. */
  expectedDeliveryDate?: string | Date | null | undefined;
  deliveredOn?: string | Date | null | undefined;
  userRole?: string;
}

/** Payload used to patch a client order. */
export interface ClientOrderPatchData {
  updatedBy: number;
  clientId?: number;
  details?: ClientOrderDetailInput[];
  status?: OrderStatusValue;
  notes?: string | null;
  expectedDeliveryDate?: string | Date | null | undefined;
  deliveredOn?: string | Date | null | undefined;
  userRole?: string;
}

/** Raw request body accepted by the create/patch endpoints. */
export interface ClientOrderInput {
  clientId?: number;
  status?: OrderStatusValue;
  notes?: string | null;
  expectedDeliveryDate?: string | null;
  deliveredOn?: string | null;
  details?: ClientOrderDetailInput[];
  createdBy?: number;
  updatedBy?: number;
}
