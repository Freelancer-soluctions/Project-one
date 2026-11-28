import { prisma } from '../../config/db.js';
import type { Prisma } from '@prisma/client';
import type {
  CreatePositionData,
  Position,
  PositionDaoFilters,
  PositionServiceResult,
  UpdatePositionData,
} from './types.js';

/**
 * Builds the Prisma WHERE clause for the position list query.
 *
 * @param {Object} filters - Filter parameters (code, name, active).
 * @returns {Object} Prisma where input.
 */
const buildPositionWhere = (
  filters: PositionDaoFilters
): Prisma.positionsWhereInput => ({
  ...(filters.code && {
    code: { contains: filters.code, mode: 'insensitive' },
  }),
  ...(filters.name && {
    name: { contains: filters.name, mode: 'insensitive' },
  }),
  ...(filters.active !== undefined && { active: filters.active }),
});

/**
 * Get all positions with optional filters.
 *
 * @param {Object} filters - Filter parameters.
 * @param {number} take - Number of records to retrieve.
 * @param {number} skip - Number of records to skip.
 * @returns {Promise<Object>} Object containing dataList and total count.
 */
export const getAllPositions = async (
  filters: PositionDaoFilters = {},
  take: number,
  skip: number
): Promise<PositionServiceResult> => {
  const where = buildPositionWhere(filters);

  const [dataList, total] = await prisma.$transaction([
    prisma.positions.findMany({
      where,
      orderBy: { name: 'asc' },
      take,
      skip,
    }),
    prisma.positions.count({ where }),
  ]);

  return { dataList, total };
};

/**
 * Create a new position.
 *
 * @param {Object} data - Position data (code, name, active, createdOn).
 * @returns {Promise<Object>} The created position.
 */
export const createPosition = async (
  data: CreatePositionData
): Promise<Position> => {
  return prisma.positions.create({
    data: {
      code: data.code,
      name: data.name,
      ...(data.active !== undefined && { active: data.active }),
      createdOn: data.createdOn,
    },
  });
};

/**
 * Update a position by ID.
 *
 * @param {number} id - Position ID.
 * @param {Object} data - Updated position data (code, name, active, updatedOn).
 * @returns {Promise<Object>} The updated position.
 */
export const updatePositionById = async (
  id: number,
  data: UpdatePositionData
): Promise<Position> => {
  return prisma.positions.update({
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
 * Delete a position by ID.
 *
 * @param {number} id - Position ID.
 * @returns {Promise<Object>} The deleted position.
 */
export const deletePositionById = async (id: number): Promise<Position> => {
  return prisma.positions.delete({ where: { id } });
};

/**
 * All positions as `{ id, name }` for select inputs. Not paginated: catalogs
 * are small and a page cap would hide rows from the employee form.
 *
 * @returns {Promise<Object>} Options list and its total.
 */
export const getPositionOptions = async (): Promise<{
  dataList: Array<{ id: number; name: string; active: boolean }>;
  total: number;
}> => {
  const dataList = await prisma.positions.findMany({
    select: { id: true, name: true, active: true },
    orderBy: { name: 'asc' },
  });
  return { dataList, total: dataList.length };
};

/**
 * Check whether a position exists.
 *
 * @param {number} id - Position ID.
 * @returns {Promise<boolean>} True when the position exists.
 */
export const positionExists = async (id: number): Promise<boolean> => {
  const count = await prisma.positions.count({ where: { id } });
  return count > 0;
};
