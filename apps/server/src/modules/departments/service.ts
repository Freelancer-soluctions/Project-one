import {
  getAllDepartments as getAllDepartmentsDao,
  createDepartment as createDepartmentDao,
  updateDepartmentById as updateDepartmentByIdDao,
  deleteDepartmentById as deleteDepartmentByIdDao,
  getDepartmentOptions as getDepartmentOptionsDao,
} from './dao.js';
import type {
  CreateDepartmentInput,
  Department,
  DepartmentFilters,
  DepartmentServiceResult,
  UpdateDepartmentInput,
} from './types.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';

/**
 * Get all departments with optional filters.
 *
 * @param {Object} filters - Optional filters for the query.
 * @param {number} [filters.page] - Page number for pagination.
 * @param {number} [filters.limit] - Number of items per page.
 * @param {string} [filters.code] - Filter by department code.
 * @param {string} [filters.name] - Filter by department name.
 * @param {boolean} [filters.active] - Filter by active flag.
 * @returns {Promise<Object>} Paginated list of departments with metadata.
 */
export const getAllDepartments = async (
  filters: DepartmentFilters
): Promise<DepartmentServiceResult> => {
  const { take, skip } = getSafePagination({
    page: filters.page,
    limit: filters.limit,
  });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return getAllDepartmentsDao(filters, take, skip);
};

/**
 * Create a new department.
 *
 * @param {Object} data - Department data (code, name, active).
 * @returns {Promise<Object>} Created department.
 */
export const createDepartment = async (
  data: CreateDepartmentInput
): Promise<Department> => {
  return createDepartmentDao({ ...data, createdOn: new Date() });
};

/**
 * Update a department by ID.
 *
 * @param {number|string} id - Department ID.
 * @param {Object} data - Updated department data.
 * @returns {Promise<Object>} Updated department.
 */
export const updateDepartmentById = async (
  id: number | string,
  data: UpdateDepartmentInput
): Promise<Department> => {
  return updateDepartmentByIdDao(Number(id), {
    ...data,
    updatedOn: new Date(),
  });
};

/**
 * Delete a department by ID.
 *
 * @param {number|string} id - Department ID.
 * @returns {Promise<Object>} Deleted department.
 */
export const deleteDepartmentById = async (
  id: number | string
): Promise<Department> => {
  return deleteDepartmentByIdDao(Number(id));
};

/**
 * All departments as `{ id, name }` for select inputs (no pagination).
 *
 * @returns {Promise<Object>} Options list and its total.
 */
export const getDepartmentOptions = async (): Promise<{
  dataList: Array<{ id: number; name: string; active: boolean }>;
  total: number;
}> => {
  return getDepartmentOptionsDao();
};
