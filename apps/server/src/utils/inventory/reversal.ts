import type { Prisma } from '../../config/db.js';
import { compensatingDirection } from '../lifecycle/salePurchase.js';

/** Minimal movement shape needed to undo an inventory movement. */
export interface ReversibleMovement {
  id: number;
  productId: number;
  warehouseId: number;
  quantity: number;
  type: string;
}

/** Document the compensating movement belongs to (one of the two is set). */
interface ReversalTarget {
  document: string;
  saleId?: number;
  purchaseId?: number;
  userId: number;
}

/**
 * Applies the stock delta produced by a compensating movement.
 *
 * `stock` holds one row per product/warehouse/lot/expiration, so there is no
 * single row to target. The oldest row of the pair is adjusted as a
 * best-effort rule: the reversal cannot know which lot the original movement
 * consumed. When no row exists nothing changes — the movement still records
 * the reversal in the audit trail.
 *
 * @param {Object} tx - Prisma transaction client.
 * @param {ReversibleMovement} movement - Original movement being reversed.
 * @param {'ENTRY'|'EXIT'} direction - Direction of the compensating movement.
 * @param {number} userId - User performing the reversal.
 * @returns {Promise<void>}
 */
const applyStockDelta = async (
  tx: Prisma.TransactionClient,
  movement: ReversibleMovement,
  direction: 'ENTRY' | 'EXIT',
  userId: number
): Promise<void> => {
  const stock = await tx.stock.findFirst({
    where: { productId: movement.productId, warehouseId: movement.warehouseId },
    orderBy: { createdOn: 'asc' },
  });
  if (!stock) return;

  const signedQuantity =
    direction === 'ENTRY' ? movement.quantity : -movement.quantity;

  await tx.stock.update({
    where: { id: stock.id },
    data: {
      // Reversing an EXIT never drives the current stock below zero.
      quantity: Math.max(0, stock.quantity + signedQuantity),
      updatedOn: new Date(),
      updatedBy: userId,
    },
  });
};

/**
 * Reverses the movements linked to a cancelled/refunded sale or purchase.
 *
 * Each reversible movement gets an opposite-direction movement (EXIT->ENTRY,
 * ENTRY->EXIT) and the matching `stock` quantity is adjusted in the same
 * transaction, so cancelling actually returns/removes the stock instead of
 * only appending an audit row (RN-SP-007, design D2).
 *
 * @param {Object} tx - Prisma transaction client.
 * @param {ReversibleMovement[]} movements - Movements linked to the document.
 * @param {Object} target - Document label, relation id and acting user.
 * @returns {Promise<void>}
 */
export const reverseLinkedMovements = async (
  tx: Prisma.TransactionClient,
  movements: ReversibleMovement[],
  { document, saleId, purchaseId, userId }: ReversalTarget
): Promise<void> => {
  for (const movement of movements) {
    const type = compensatingDirection(movement.type);
    // TRANSFERENCE/ADJUSTMENT rows have no single opposite: leave them alone.
    if (type === 'ADJUSTMENT') continue;

    await tx.inventoryMovement.create({
      data: {
        productId: movement.productId,
        warehouseId: movement.warehouseId,
        quantity: movement.quantity,
        type,
        reason: `Reversal of movement #${movement.id} for ${document} (${movement.type}->${type})`,
        createdOn: new Date(),
        createdBy: userId,
        ...(saleId !== undefined && { saleId }),
        ...(purchaseId !== undefined && { purchaseId }),
      },
    });

    await applyStockDelta(tx, movement, type, userId);
  }
};
