import type { Prisma, warehouseStatus } from '@prisma/client';

/** Warehouse row as stored in the database. */
export type WarehouseRecord = Prisma.warehouseGetPayload<object>;

/** Paginated warehouse list. */
export interface WarehousesPage {
  dataList: WarehouseRecord[];
  total: number;
}

/** Query parameters accepted by the warehouse listing endpoint. */
export interface WarehousesQuery {
  name?: string;
  status?: warehouseStatus;
  limit?: number;
  page?: number;
}

/** Payload used to create a warehouse. */
export interface WarehouseCreateData {
  name: string;
  description?: string | null;
  address?: string | null;
  status?: warehouseStatus;
  createdOn: Date;
}

/** Payload used to patch a warehouse. */
export interface WarehousePatchData {
  name?: string;
  description?: string | null;
  address?: string | null;
  status?: warehouseStatus;
  updatedOn?: Date;
}

/** Warehouse body accepted by the create/patch endpoints (raw request values). */
export interface WarehouseInput {
  name?: string;
  description?: string | null;
  address?: string | null;
  status?: warehouseStatus;
}
