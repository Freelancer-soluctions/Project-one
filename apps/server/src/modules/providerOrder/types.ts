import type { Prisma } from '@prisma/client';
import type { OrderStatusValue } from '../orders/orderLifecycle.js';

/** Detail line accepted by the provider order create/patch endpoints. */
export interface ProviderOrderDetailInput {
  productId: number;
  quantity: number;
  estimatedPrice: number | string;
}

/** Provider order with supplier, product-aware details, purchase and users. */
export type ProviderOrderListItem = Prisma.providerOrderGetPayload<{
  include: {
    productOrders: true;
    details: {
      include: {
        product: { select: { id: true; name: true; sku: true } };
      };
    };
    purchase: true;
    userProviderOrderCreated: { select: { name: true } };
    userProviderOrderUpdated: { select: { name: true } };
  };
}>;

/** Filters accepted by the provider order list query. */
export interface ProviderOrderListFilters {
  supplierId?: number;
  status?: OrderStatusValue;
}

/** Query parameters accepted by the provider order listing endpoint. */
export interface ProviderOrdersQuery extends ProviderOrderListFilters {
  page?: number;
  limit?: number;
}

/** Paginated provider order list. */
export interface ProviderOrdersPage {
  dataList: ProviderOrderListItem[];
  total: number;
}

/** Payload used to create a provider order (with its details). */
export interface ProviderOrderCreateData {
  supplierId: number;
  createdBy: number;
  details: ProviderOrderDetailInput[];
  status?: OrderStatusValue;
  notes?: string | null;
  /** Raw body values are ISO strings; the service normalizes them to Date. */
  expectedDeliveryDate?: string | Date | null | undefined;
  deliveredOn?: string | Date | null | undefined;
  userRole?: string;
}

/** Payload used to patch a provider order. */
export interface ProviderOrderPatchData {
  updatedBy: number;
  supplierId?: number;
  details?: ProviderOrderDetailInput[];
  status?: OrderStatusValue;
  notes?: string | null;
  expectedDeliveryDate?: string | Date | null | undefined;
  deliveredOn?: string | Date | null | undefined;
  userRole?: string;
}

/** Raw request body accepted by the create/patch endpoints. */
export interface ProviderOrderInput {
  supplierId?: number;
  status?: OrderStatusValue;
  notes?: string | null;
  expectedDeliveryDate?: string | null;
  deliveredOn?: string | null;
  details?: ProviderOrderDetailInput[];
  createdBy?: number;
  updatedBy?: number;
}
