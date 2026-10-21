import { getUserRoleByUserId } from '../modules/users/service.js';
import { ROLESCODES } from '../utils/constants/enums.js';
import type { NextFunction, Request, Response } from 'express';

/** Opciones de los middlewares de autorización por rol/permiso. */
type RoleAuthOptions = {
  /** Códigos de rol admitidos (p. ej. `['C01', 'C02']`). */
  allowedRoles?: string[];
  /** Códigos de permiso requeridos (opcional; vacío = solo chequeo de rol). */
  permissions?: string[];
};

/**
 * Role-based authorization middleware factory.
 * Creates an Express middleware function that validates if the authenticated user
 * has the required role permissions to access a protected resource.
 *
 * @param {Object} options - Configuration options for role validation
 * @param {string[]} options.allowedRoles - Array of allowed role codes (e.g., ['ADMIN', 'USER'])
 * @returns {import('express').RequestHandler} Express middleware function that validates user roles
 * @throws {Error} When user role is not in the allowed roles array
 * @throws {Error} When user object is not attached to request (missing authentication)
 *
 * @example
 * // Usage examples
 * const adminOnly = checkRoleAuth({ allowedRoles: ['ADMIN'] });
 * const userOrAdmin = checkRoleAuth({ allowedRoles: ['USER', 'ADMIN'] });
 *
 * router.get('/admin', verifyToken, adminOnly, adminController);
 * router.get('/profile', verifyToken, userOrAdmin, profileController);
 */
export function checkRoleAuth({ allowedRoles = [] }: RoleAuthOptions) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized: missing userId' });
      }
      const user = await getUserRoleByUserId(req.userId);
      if (!user || !user?.roles.code) {
        return res.status(403).json({ error: 'Could not verify role' });
      }

      const userRole = user?.roles.code;

      if (!allowedRoles.includes(userRole)) {
        return res
          .status(403)
          .json({ error: 'You do not have sufficient permissions' });
      }

      // Publicar el rol verificado para los guards de los controllers (p. ej.
      // `showDeleted` en events). Sin esta asignación `req.userRole` era
      // SIEMPRE `undefined` y `undefined !== 'ADMIN'` daba `true`: el guard no
      // podía distinguir roles (server-ts-latent-defects, fix 1).
      req.userRole = userRole;

      // Opcional: puedes guardar el user completo en req.user si lo necesitas después
      // req.user = user;

      next();
    } catch {
      res.status(500).json({ error: 'Error in permission verification' });
    }
  };
}

/**
 * Role and permission-based authorization middleware factory.
 * Creates an Express middleware function that validates both user roles and specific permissions.
 * ADMIN role bypasses permission checks, other roles must have required permissions.
 *
 * @param {Object} options - Configuration options for authorization
 * @param {string[]} options.allowedRoles - Array of allowed role codes (e.g., ['USER', 'MANAGER'])
 * @param {string[]} [options.permissions] - Array of required permission codes (optional; empty = role check only)
 * @returns {import('express').RequestHandler} Express middleware function that validates roles and permissions
 * @throws {Error} When user role is not in allowed roles array
 * @throws {Error} When user lacks required permissions
 * @throws {Error} When user object is not attached to request (missing authentication)
 *
 * @example
 * // Usage examples
 * const canEdit = checkRoleAuthOrPermisssion({
 *   allowedRoles: ['USER', 'MANAGER'],
 *   permissions: ['EDIT_POST']
 * });
 *
 * router.post('/edit', verifyToken, canEdit, editController);
 */
export const checkRoleAuthOrPermisssion =
  ({ allowedRoles = [], permissions = [] }: RoleAuthOptions) =>
  async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<Response | void> => {
    const { userId } = req;
    // console.log('Required Permissions:', permissions)

    try {
      const user = await getUserRoleByUserId(userId as number);
      // console.log('User Role and Permissions:', user)

      if (!user || !user.roles?.code) {
        return res.status(403).json({
          error: 'Could not verify user role or permissions',
        });
      }

      const userRoleCode = user.roles.code;

      // El rol verificado se publica en TODOS los caminos de éxito (3 aquí +
      // 1 en `checkRoleAuth`): si solo se asignara en uno, el guard de
      // `showDeleted` seguiría leyendo `undefined` en el resto
      // (server-ts-latent-defects, design §1).

      // 1. If ADMIN, passes without extra permission validations. Admin doesn't need permissions since they have full system control.
      if (userRoleCode === ROLESCODES.ADMIN) {
        req.userRole = userRoleCode;
        return next();
      }

      // 2. Validate if role is explicitly allowed (optional) USER or MANAGER
      if (allowedRoles.length > 0 && !allowedRoles.includes(userRoleCode)) {
        return res
          .status(403)
          .json({ error: 'Role not authorized for this action' });
      }

      // 3. If no specific permissions required, allow (role already validated)
      if (permissions.length === 0) {
        req.userRole = userRoleCode;
        return next();
      }

      // 4. Get the user's permissions from the `permits` relation. The DAO
      // (`users/dao.getUserRoleByUserId`) includes `permits: { permissions }`
      // (`users → userPermits → permissions`), so this cast disappears: the
      // shape comes from `UserWithRoleAndPermits`. Antes se leía `rolePermits`
      // — una propiedad inexistente — así que el array quedaba siempre vacío y
      // TODO no-ADMIN caía en 403 aunque tuviera el permiso asignado
      // (server-fix-role-permits-authorization).
      const rolePermissions =
        user.permits?.map((permit) => permit.permissions.code) ?? [];
      // 5. Validate if user has at least one of the required permissions
      const hasSomePermission = permissions.some((p) =>
        rolePermissions.includes(p)
      );

      if (!hasSomePermission) {
        return res
          .status(403)
          .json({ error: 'Insufficient permissions for this operation' });
      }

      req.userRole = userRoleCode;
      return next();
    } catch (error) {
      console.error('Middleware auth error:', error);
      return res
        .status(500)
        .json({ error: 'Internal error in permission verification' });
    }
  };
