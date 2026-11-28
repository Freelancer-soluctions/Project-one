/**
 * Trazabilidad de aprobación compartida por vacation y permission (RN-VP-001/002).
 * Solo el service la usa: el cliente nunca fija estos campos.
 */
export interface ApprovalStamps {
  approvedBy?: number | null;
  approvedAt?: Date | null;
  rejectedBy?: number | null;
  rejectedAt?: Date | null;
}

/**
 * Calcula los campos de aprobación según el nuevo estado.
 * - APPROVED → approver = actor, limpia rechazo.
 * - REJECTED → rejecter = actor, limpia aprobación.
 * - PENDING → limpia ambos pares.
 * - sin estado → `{}` (no toca nada).
 *
 * @param {string|undefined} status - Nuevo estado solicitado.
 * @param {number|undefined} userId - Usuario autenticado (token).
 * @param {Date} [now] - Marca temporal (inyectable para tests).
 */
export const buildApprovalStamps = (
  status: string | undefined,
  userId: number | undefined,
  now: Date = new Date()
): ApprovalStamps => {
  const actor = userId ?? null;
  switch (status) {
    case 'APPROVED':
      return {
        approvedBy: actor,
        approvedAt: now,
        rejectedBy: null,
        rejectedAt: null,
      };
    case 'REJECTED':
    case 'CANCELLED':
      return {
        approvedBy: null,
        approvedAt: null,
        rejectedBy: actor,
        rejectedAt: now,
      };
    case 'PENDING':
      return {
        approvedBy: null,
        approvedAt: null,
        rejectedBy: null,
        rejectedAt: null,
      };
    default:
      return {};
  }
};
