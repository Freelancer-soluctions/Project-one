import {
  getAllPositions as getAllPositionsDao,
  createPosition as createPositionDao,
  updatePositionById as updatePositionByIdDao,
  deletePositionById as deletePositionByIdDao,
  getPositionOptions as getPositionOptionsDao,
} from './dao.js';
import type {
  CreatePositionInput,
  Position,
  PositionFilters,
  PositionServiceResult,
  UpdatePositionInput,
} from './types.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';

/**
 * Get all positions with optional filters.
 *
 * @param {Object} filters - Optional filters for the query.
 * @param {number} [filters.page] - Page number for pagination.
 * @param {number} [filters.limit] - Number of items per page.
 * @param {string} [filters.code] - Filter by position code.
 * @param {string} [filters.name] - Filter by position name.
 * @param {boolean} [filters.active] - Filter by active flag.
 * @returns {Promise<Object>} Paginated list of positions with metadata.
 */
export const getAllPositions = async (
  filters: PositionFilters
): Promise<PositionServiceResult> => {
  const { take, skip } = getSafePagination({
    page: filters.page,
    limit: filters.limit,
  });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return getAllPositionsDao(filters, take, skip);
};

/**
 * Create a new position.
 *
 * @param {Object} data - Position data (code, name, active).
 * @returns {Promise<Object>} Created position.
 */
export const createPosition = async (
  data: CreatePositionInput
): Promise<Position> => {
  return createPositionDao({ ...data, createdOn: new Date() });
};

/**
 * Update a position by ID.
 *
 * @param {number|string} id - Position ID.
 * @param {Object} data - Updated position data.
 * @returns {Promise<Object>} Updated position.
 */
export const updatePositionById = async (
  id: number | string,
  data: UpdatePositionInput
): Promise<Position> => {
  return updatePositionByIdDao(Number(id), { ...data, updatedOn: new Date() });
};

/**
 * Delete a position by ID.
 *
 * @param {number|string} id - Position ID.
 * @returns {Promise<Object>} Deleted position.
 */
export const deletePositionById = async (
  id: number | string
): Promise<Position> => {
  return deletePositionByIdDao(Number(id));
};

/**
 * All positions as `{ id, name }` for select inputs (no pagination).
 *
 * @returns {Promise<Object>} Options list and its total.
 */
export const getPositionOptions = async (): Promise<{
  dataList: Array<{ id: number; name: string; active: boolean }>;
  total: number;
}> => {
  return getPositionOptionsDao();
};
