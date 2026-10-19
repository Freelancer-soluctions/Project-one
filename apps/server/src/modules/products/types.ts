import type { Prisma } from '@prisma/client';

/** Product row as stored in the database. */
export type ProductRecord = Prisma.productsGetPayload<object>;

/** Product category row. */
export type ProductCategoryRecord = Prisma.productCategoriesGetPayload<object>;

/** Product provider row. */
export type ProductProviderRecord = Prisma.productProvidersGetPayload<object>;

/** Product status row. */
export type ProductStatusRecord = Prisma.productStatusGetPayload<object>;

/** Product attribute row. */
export type ProductAttributeRecord = Prisma.productAttributesGetPayload<object>;

/** Row returned by the filtered list query (product + joined catalog names). */
export type ProductListItem = ProductRecord & {
  categoryId: number | null;
  categoryCode: string | null;
  categoryDescription: string | null;
  providerId: number | null;
  providerCode: string | null;
  providerDescription: string | null;
  statusId: number | null;
  statusCode: string | null;
  statusDescription: string | null;
  userProductCreatedName: string | null;
  userProductUpdatedName: string | null;
};

/** Filters accepted by the product list query. */
export interface ProductsListFilters {
  name?: string;
  productProviderCode?: string;
  productCategoryCode?: string;
  statusCode?: string;
}

/** Query parameters accepted by the product listing endpoint. */
export interface ProductsQuery extends ProductsListFilters {
  limit?: number;
  page?: number;
}

/** Paginated product list. */
export interface ProductsPage {
  dataList: ProductListItem[];
  total: number;
}

/** Payload used to create a product. */
export interface ProductCreateData {
  sku: string;
  name: string;
  price: number;
  cost: number;
  description: string | null;
  barCode: string | null;
  createdOn: Date;
  createdBy: number;
  productCategoryId: number;
  productProviderId: number;
  productStatusId: number;
  /** Accepted for compatibility with the create payload; quantities live in `stock`. */
  stock?: number;
}

/** Payload used to update a product. */
export interface ProductUpdateData {
  sku?: string;
  name?: string;
  price?: number | string;
  cost?: number | string;
  description?: string | null;
  barCode?: string | null;
  updatedOn?: Date;
  updatedBy?: number;
  productCategoryId?: number;
  productProviderId?: number;
  productStatusId?: number;
}

/** Product body accepted by the create endpoint (raw request values). */
export interface ProductInput {
  sku: string | number;
  name: string;
  productCategoryId: number | string;
  productProviderId: number | string;
  price: number | string;
  cost: number | string;
  stock?: number | string;
  description?: string | null;
  productStatusId: number | string;
  barCode?: string | null;
}

/** Product attribute payload (create when `id` is absent, update otherwise). */
export interface ProductAttributeInput {
  id?: number;
  productId: number;
  name: string;
  description: string;
  createdOn?: Date;
}
