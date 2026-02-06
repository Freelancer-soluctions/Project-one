import { getUserRoleByUserId } from '../modules/users/service.js';
import { ROLESCODES } from '../utils/constants/enums.js';

/**
 * Role-based authorization middleware factory.
 * Creates an Express middleware function that validates if the authenticated user
 * has the required role permissions to access a protected resource.
 *
 * @param {Object} options - Configuration options for role validation
 * @param {string[]} options.allowedRoles - Array of allowed role codes (e.g., ['ADMIN', 'USER'])
 * @returns {Function} Express middleware function that validates user roles
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
export function checkRoleAuth({ allowedRoles = [] }) {
  return async (req, res, next) => {
    try {
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

      // Opcional: puedes guardar el user completo en req.user si lo necesitas después
      // req.user = user;

      next();
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
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
 * @param {string[]} options.permissions - Array of required permission codes
 * @returns {Function} Express middleware function that validates roles and permissions
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
  ({ allowedRoles = [], permissions = [] }) =>
  async (req, res, next) => {
    const { userId } = req;
    // console.log('Required Permissions:', permissions)

    try {
      const user = await getUserRoleByUserId(userId);
      // console.log('User Role and Permissions:', user)

      if (!user || !user.roles?.code) {
        return res.status(403).json({
          error: 'Could not verify user role or permissions',
        });
      }

      const userRoleCode = user.roles.code;

      // 1. If ADMIN, passes without extra permission validations. Admin doesn't need permissions since they have full system control.
      if (userRoleCode === ROLESCODES.ADMIN) {
        return next();
      }

      // 2. Validate if role is explicitly allowed (optional) USER or MANAGER
      if (allowedRoles.length > 0 && !allowedRoles.includes(userRoleCode)) {
        return res
          .status(403)
          .json({ error: 'Role not authorized for this action' });
      }

      // 3. Get role permissions. Get array of permissions from user's role, for example:
      const rolePermissions =
        user.rolePermits?.map((rp) => rp.permissions.code) || [];
      // 4. Validate if user has at least one of the required permissions
      const hasSomePermission = permissions.some((p) =>
        rolePermissions.includes(p)
      );

      if (!hasSomePermission) {
        return res
          .status(403)
          .json({ error: 'Insufficient permissions for this operation' });
      }

      return next();
    } catch (error) {
      console.error('Middleware auth error:', error);
      return res
        .status(500)
        .json({ error: 'Internal error in permission verification' });
    }
  };
