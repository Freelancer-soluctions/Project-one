import {
  getAllUsers as getAllUsersDao,
  createUser as createDao,
  updateUserById as updateDao,
  deleteUserById as deleteDao,
  getAllUsersStatus as getAllUserStatusDao,
  getAllUsersRoles as getAllUserRolesDao,
  getUserRoleByCode as getUserRoleByCodeDao,
  getUserRoleByUserId as getUserRoleByUserIdDao,
  getAllUserPermits as getAllUserPermitsDao,
  getUsersByStatus as getUsersByStatusDao,
} from './dao.js';
import type {
  CreateUserInput,
  PermissionWithAssignment,
  Role,
  UpdateUserInput,
  User,
  UserCreateData,
  UserFilters,
  UserSelectOption,
  UserServiceResult,
  UserStatusRow,
  UserWithDetails,
  UserWithRoleAndPermits,
} from './types.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';

/**
 * Get all users with optional filters.
 *
 * @param {Object} filters - Optional filters for the query.
 * @param {number} [filters.page] - Page number for pagination.
 * @param {number} [filters.limit] - Number of items per page.
 * @param {string} [filters.name] - Filter by user name.
 * @param {string} [filters.email] - Filter by user email.
 * @returns {Promise<Object>} Paginated list of users with metadata.
 * @throws {Error} When pagination parameters are missing or invalid.
 */
export const getAllUsers = async (
  filters: UserFilters
): Promise<UserServiceResult> => {
  const { take, skip } = getSafePagination({
    page: filters.page,
    limit: filters.limit,
  });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return await getAllUsersDao(filters, take, skip);
};

/**
 * Get users by status.
 *
 * @param {string} status - Status code to filter users by.
 * @returns {Promise<Array>} Array of user objects containing id and name.
 */
export const getUsersByStatus = async (
  status: string
): Promise<UserSelectOption[]> => {
  const data = await getUsersByStatusDao(status);
  // Transform the data to map 'name' field to 'label' field to align with frontend expectations
  return data.map((item) => ({
    id: item.id,
    label: item.name,
  }));
};

/**
 * Get all user permits by ID.
 *
 * @param {number} id - User ID.
 * @returns {Promise<Array>} List of permissions with assignment status.
 */
export const getAllUserPermits = async (
  id: number | string
): Promise<PermissionWithAssignment[]> => {
  const { allPermissions, user } = await getAllUserPermitsDao(Number(id));

  const userPermits = user?.permits || [];

  const userPermissionIds = new Set(userPermits.map((p) => p.permissionId));
  const permissions = allPermissions.map((p) => ({
    ...p,
    assigned: userPermissionIds.has(p.id), // ? marcado si pertenece al usuario
  }));

  return permissions;
};

/**
 * Get all available user statuses from the database.
 *
 * @returns {Promise<Array>} A list of all user statuses.
 */

export const getAllUsersStatus = async (): Promise<UserStatusRow[]> => {
  const data = await getAllUserStatusDao();
  return data;
};

/**
 * Get all available user roles from the database.
 *
 * @returns {Promise<Array>} A list of all user roles.
 */

export const getAllUsersRoles = async (): Promise<Role[]> => {
  const data = await getAllUserRolesDao();
  return data;
};

/**
 * Create a new user.
 *
 * @param {Object} data - User data.
 * @param {string} data.name - User name.
 * @param {string} data.email - User email address.
 * @param {string} data.password - User password.
 * @param {number} data.roleId - User role ID.
 * @param {number} data.lastUpdatedBy - User ID who last updated the record.
 * @returns {Promise<Object>} Created user.
 */
export const createUser = async (
  data: CreateUserInput
): Promise<UserWithDetails> => {
  const userData = {
    ...data,
    lastUpdatedOn: new Date(),
  };
  // Cast único hacia el payload de persistencia: el dao usa el input unchecked
  // de Prisma, que exige `password` mientras `userCreateSchema` aún no lo valida
  // (gap preexistente de POST /users; el runtime no cambia).
  return createDao(userData as UserCreateData);
};

/**
 * Partially update a user by ID.
 *
 * @param {number} id - User ID.
 * @param {Object} data - Partial user data to update.
 * @returns {Promise<Object>} Updated user.
 */
export const patchUserById = async (
  id: number | string,
  data: UpdateUserInput
): Promise<User> => {
  const userData = {
    ...data,
    lastUpdatedBy: Number(id),
    lastUpdatedOn: new Date(),
  };
  return updateDao(Number(id), userData);
};

/**
 * Delete a user by ID.
 *
 * @param {number} id - User ID.
 * @returns {Promise<Object>} Deleted user.
 */
export const deleteUserById = async (id: number | string): Promise<User> => {
  return deleteDao(Number(id));
};

/**
 * Get user role by role code.
 *
 * @param {string} code - Role code (e.g., 'ADMIN', 'USER').
 * @returns {Promise<Object>} User role object.
 */
export const getUserRoleByCode = async (code: string): Promise<Role | null> => {
  return getUserRoleByCodeDao(code);
};

/**
 * Get user role by user ID.
 *
 * @param {number} userId - User ID.
 * @returns {Promise<Object>} User role object.
 */
export const getUserRoleByUserId = async (
  userId: number | string
): Promise<UserWithRoleAndPermits | null> => {
  return getUserRoleByUserIdDao(Number(userId));
};
