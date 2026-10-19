import {
  getAllPermissions as getAllPermissionsDao,
  createPermission as createPermissionDao,
  updatePermissionById as updatePermissionByIdDao,
  deletePermissionById as deletePermissionByIdDao,
} from './dao.js';
import type {
  CreateEmployeePermissionData,
  CreateEmployeePermissionInput,
  EmployeePermission,
  EmployeePermissionFilters,
  EmployeePermissionServiceResult,
  UpdateEmployeePermissionInput,
} from './types.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';

/**
 * Retrieve all permissions with optional filters.
 *
 * @param {Object} filters - Filter criteria
 * @param {number} [filters.employeeId] - Filter by employee ID
 * @param {string} [filters.type] - Filter by permission type (SICK, PERSONAL, MATERNITY, PATERNITY, OTHER)
 * @param {string} [filters.status] - Filter by status (PENDING, APPROVED, REJECTED)
 * @param {string} [filters.fromDate] - Filter by start date (ISO format)
 * @param {string} [filters.toDate] - Filter by end date (ISO format)
 * @param {number} [filters.limit] - Filter by limit
 * @param {number} [filters.page] - Filter by page
 * @returns {Promise<Array>} List of permissions matching the filters
 * @throws {Error} If pagination parameters are invalid or missing
 */
export const getAllPermissions = async (
  filters: EmployeePermissionFilters
): Promise<EmployeePermissionServiceResult> => {
  const { take, skip } = getSafePagination({
    page: filters.page,
    limit: filters.limit,
  });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return await getAllPermissionsDao(filters, take, skip);
};

/**
 * Create a new permission record.
 *
 * @param {Object} data - Permission data
 * @param {number} data.employeeId - Employee ID
 * @param {string} data.type - Permission type
 * @param {string} data.startDate - Start date (ISO format)
 * @param {string} data.endDate - End date (ISO format)
 * @param {string} data.reason - Reason for permission
 * @param {string} [data.status] - Permission status (defaults to PENDING)
 * @returns {Promise<Object>} Created permission record
 */
export const createPermission = async (
  data: CreateEmployeePermissionInput,
  userId: number
): Promise<EmployeePermission> => {
  // El objeto se declara con el payload de persistencia: el service normaliza el
  // empleado, los timestamps y el autor antes de llegar al dao.
  const permissionData: CreateEmployeePermissionData = {
    ...data,
    employeeId: Number(data.employeeId),
    createdOn: new Date(),
    fromDate: new Date(data.fromDate),
    toDate: new Date(data.toDate),
    createdBy: userId,
  };
  return await createPermissionDao(permissionData);
};

/**
 * Update an existing permission record.
 *
 * @param {number|string} id - Permission ID
 * @param {Object} data - Updated permission data
 * @param {number} [data.employeeId] - Employee ID
 * @param {string} [data.type] - Permission type
 * @param {string} [data.startDate] - Start date (ISO format)
 * @param {string} [data.endDate] - End date (ISO format)
 * @param {string} [data.reason] - Reason for permission
 * @param {string} [data.status] - Permission status
 * @param {number} [data.approvedBy] - ID of user who approved/rejected
 * @param {string} [data.comments] - Additional comments
 * @param {number} [userId] - ID of the user performing the update (updatedBy)
 * @returns {Promise<Object>} Updated permission record
 */
export const updatePermissionById = async (
  id: number | string,
  data: UpdateEmployeePermissionInput,
  userId?: number
): Promise<EmployeePermission> => {
  const permissionData = {
    ...data,
    employeeId: Number(data.employeeId),
    updatedOn: new Date(),
    fromDate: new Date(data.fromDate),
    toDate: new Date(data.toDate),
    updatedBy: userId,
  };
  return await updatePermissionByIdDao(id, permissionData);
};

/**
 * Delete a permission record.
 *
 * @param {number|string} id - Permission ID
 * @returns {Promise<Object>} Deleted permission record
 */
export const deletePermissionById = async (
  id: number | string
): Promise<EmployeePermission> => {
  return await deletePermissionByIdDao(Number(id));
};
