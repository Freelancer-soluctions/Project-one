import type { NextFunction, Request, Response } from 'express';
import { getUserRoleByUserId } from '../modules/users/service.js';
import { ROLESCODES, PERMISSIONCODES } from '../utils/constants/enums.js';

const APPROVAL_STATUSES = ['APPROVED', 'REJECTED', 'CANCELLED'];

interface ApprovalUser {
  roles?: { code?: string } | null;
  permits?: Array<{ permissions: { code: string } }>;
}

/** Permisos de aprobación efectivos de un usuario (ADMIN los tiene todos). */
export const resolveApprovalAccess = (
  user: ApprovalUser | null | undefined
) => {
  if (!user || !user.roles?.code) {
    return { canApproveVacation: false, canApprovePermission: false };
  }
  const isAdmin = user.roles.code === ROLESCODES.ADMIN;
  const codes = user.permits?.map((permit) => permit.permissions.code) ?? [];
  return {
    canApproveVacation:
      isAdmin || codes.includes(PERMISSIONCODES.canApproveVacation),
    canApprovePermission:
      isAdmin || codes.includes(PERMISSIONCODES.canApprovePermission),
  };
};

/**
 * Autoriza las transiciones de aprobación (APPROVED/REJECTED) de vacaciones y
 * permisos (RN-VP-010). Otras actualizaciones pasan sin consultar permisos.
 * ADMIN bypasa; el resto necesita el código de aprobación. Fail-closed: si no se
 * puede resolver el usuario, responde 403.
 *
 * @param {string} permission - Código requerido (`canApproveVacation` / `canApprovePermission`).
 */
export const requireApprovalPermission =
  (permission: string) =>
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void | Response> => {
    const status = (req.body as { status?: string } | undefined)?.status;
    if (!status || !APPROVAL_STATUSES.includes(status)) {
      return next();
    }

    try {
      const user = await getUserRoleByUserId(req.userId as number);
      if (!user || !user.roles?.code) {
        return res
          .status(403)
          .json({ error: 'Could not verify user role or permissions' });
      }
      if (user.roles.code === ROLESCODES.ADMIN) {
        return next();
      }
      const codes =
        user.permits?.map((permit) => permit.permissions.code) ?? [];
      if (!codes.includes(permission)) {
        return res
          .status(403)
          .json({ error: 'Insufficient permissions for this operation' });
      }
      return next();
    } catch {
      return res
        .status(500)
        .json({ error: 'Internal error in permission verification' });
    }
  };
