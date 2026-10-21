import type { movementType, Prisma } from '@prisma/client';

/** Contratos del módulo `inventoryMovement` — autocontenidos (design §1-§2). */

/** Fila de `inventoryMovement`. */
export type InventoryMovement = Prisma.inventoryMovementGetPayload<object>;

/** Tipo de movimiento: enum `movementType` del schema Prisma. */
export type MovementType = movementType;

/** Movimiento con producto y almacén (los `include` del listado). */
export type InventoryMovementWithRelations =
  Prisma.inventoryMovementGetPayload<{
    include: { product: true; warehouse: true };
  }>;

/** Body de `POST /inventory-movements` (`req.body`). */
export interface CreateInventoryMovementInput {
  productId: number;
  warehouseId: number;
  type: MovementType;
  quantity: number;
  reason?: string;
}

/** Body de `PATCH /inventory-movements/:id` (todos opcionales). */
export interface UpdateInventoryMovementInput {
  productId?: number;
  warehouseId?: number;
  type?: MovementType;
  quantity?: number;
  reason?: string;
  updatedBy?: number;
}

/** Filtros de `GET /inventory-movements` (`req.safeQuery`). */
export interface InventoryMovementFilters {
  productId?: number;
  warehouseId?: number;
  type?: MovementType;
  page?: number;
  limit?: number;
}

/** Filtros ya paginados que recibe el dao. */
export interface InventoryMovementDaoFilters {
  productId?: number;
  warehouseId?: number;
  type?: MovementType;
  take: number;
  skip: number;
}

/**
 * Payload de creación del dao: input unchecked de Prisma (incluye `createdBy` y
 * `createdOn`, que el modelo exige y la ruta todavía no completa — gap
 * preexistente; el service castea una sola vez sin cambiar el runtime).
 */
export type CreateInventoryMovementData =
  Prisma.inventoryMovementUncheckedCreateInput;

/** Payload de actualización del dao (todos los campos opcionales). */
export type UpdateInventoryMovementData =
  Prisma.inventoryMovementUncheckedUpdateInput;

/** Resultado paginado del listado de movimientos. */
export interface InventoryMovementServiceResult {
  dataList: InventoryMovementWithRelations[];
  total: number;
}
