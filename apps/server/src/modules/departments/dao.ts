import { prisma } from '../../config/db.js';
import type { Prisma } from '@prisma/client';
import type {
  CreateDepartmentData,
  Department,
  DepartmentDaoFilters,
  DepartmentServiceResult,
  UpdateDepartmentData,
} from './types.js';

/**
 * Builds the Prisma WHERE clause for the department list query.
 *
 * @param {Object} filters - Filter parameters (code, name, active).
 * @returns {Object} Prisma where input.
 */
const buildDepartmentWhere = (
  filters: DepartmentDaoFilters
): Prisma.departmentsWhereInput => ({
  ...(filters.code && {
    code: { contains: filters.code, mode: 'insensitive' },
  }),
  ...(filters.name && {
    name: { contains: filters.name, mode: 'insensitive' },
  }),
  ...(filters.active !== undefined && { active: filters.active }),
});

/**
 * Get all departments with optional filters.
 *
 * @param {Object} filters - Filter parameters.
 * @param {number} take - Number of records to retrieve.
 * @param {number} skip - Number of records to skip.
 * @returns {Promise<Object>} Object containing dataList and total count.
 */
export const getAllDepartments = async (
  filters: DepartmentDaoFilters = {},
  take: number,
  skip: number
): Promise<DepartmentServiceResult> => {
  const where = buildDepartmentWhere(filters);

  const [dataList, total] = await prisma.$transaction([
    prisma.departments.findMany({
      where,
      orderBy: { name: 'asc' },
      take,
      skip,
    }),
    prisma.departments.count({ where }),
  ]);

  return { dataList, total };
};

/**
 * Create a new department.
 *
 * @param {Object} data - Department data (code, name, active, createdOn).
 * @returns {Promise<Object>} The created department.
 */
export const createDepartment = async (
  data: CreateDepartmentData
): Promise<Department> => {
  return prisma.departments.create({
    data: {
      code: data.code,
      name: data.name,
      ...(data.active !== undefined && { active: data.active }),
      createdOn: data.createdOn,
    },
  });
};

/**
 * Update a department by ID.
 *
 * @param {number} id - Department ID.
 * @param {Object} data - Updated department data (code, name, active, updatedOn).
 * @returns {Promise<Object>} The updated department.
 */
export const updateDepartmentById = async (
  id: number,
  data: UpdateDepartmentData
): Promise<Department> => {
  return prisma.departments.update({
    where: { id },
    data: {
      ...(data.code !== undefined && { code: data.code }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.active !== undefined && { active: data.active }),
      updatedOn: data.updatedOn,
    },
  });
};

/**
 * Delete a department by ID.
 *
 * @param {number} id - Department ID.
 * @returns {Promise<Object>} The deleted department.
 */
export const deleteDepartmentById = async (id: number): Promise<Department> => {
  return prisma.departments.delete({ where: { id } });
};

/**
 * All departments as `{ id, name }` for select inputs. Not paginated: catalogs
 * are small and a page cap would hide rows from the employee form.
 *
 * @returns {Promise<Object>} Options list and its total.
 */
export const getDepartmentOptions = async (): Promise<{
  dataList: Array<{ id: number; name: string; active: boolean }>;
  total: number;
}> => {
  const dataList = await prisma.departments.findMany({
    select: { id: true, name: true, active: true },
    orderBy: { name: 'asc' },
  });
  return { dataList, total: dataList.length };
};

/**
 * Check whether a department exists.
 *
 * @param {number} id - Department ID.
 * @returns {Promise<boolean>} True when the department exists.
 */
export const departmentExists = async (id: number): Promise<boolean> => {
  const count = await prisma.departments.count({ where: { id } });
  return count > 0;
};
