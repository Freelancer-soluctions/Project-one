import { prisma } from '../../config/db.js';

/**
 * Retrieves a single database row by ID with optional filtering and relationships.
 * Used for getting specific records like users, posts, or any entity by unique identifier.
 *
 * @param {Object} params - Query parameters object
 * @param {string} params.tableName - Database table name from TABLE_NAMES constants
 * @param {Object} [params.where] - Prisma where clause for filtering records
 * @param {Object} [params.include] - Prisma include clause for loading related entities
 * @returns {Promise<Object|null>} Single database record matching criteria or null if not found
 * @throws {DatabaseError} When database query fails or table name is invalid
 *
 * @example
 * // Get user by ID
 * const user = await getOneRow({
 *   tableName: 'users',
 *   where: { id: userId },
 *   include: { profile: true }
 * });
 */
export const getOneRow = async ({ tableName, where, include }) => {
  return prisma[tableName].findUnique({
    ...(where && { where }),
    ...(include && { include }),
  });
};

/**

 * @param {*} params :: filter params
 *
 * @returns One row by ramdon param
 */
export const getRow = async ({ tableName, where, include }) => {
  return prisma[tableName].findFirst({
    ...(where && { where }),
    ...(include && { include }),
  });
};

/**
 * Creates multiple database records in a single transaction.
 * Used for bulk insertions while maintaining data integrity.
 *
 * @param {Object} params - Configuration parameters
 * @param {string} params.tableName - Database table name from TABLE_NAMES constants
 * @param {Array<Object>} params.data - Array of objects to insert into database
 * @returns {Promise<Array<Object>>} Created records with database metadata
 * @throws {DatabaseError} When database insertion fails or table name is invalid
 *
 * @example
 * // Create multiple users
 * const newUsers = await createManyRows({
 *   tableName: 'users',
 *   data: [
 *     { name: 'User 1', email: 'user1@example.com' },
 *     { name: 'User 2', email: 'user2@example.com' }
 *   ]
 * });
 */

export const createManyRows = async (tableName, data) => {
  return prisma[tableName].createMany({
    skipDuplicates: true,
    data,
  });
};

/**
 * Updates an existing database record by ID or filter criteria.
 * Used for modifying existing data while maintaining referential integrity.
 *
 * @param {Object} params - Configuration parameters
 * @param {string} params.tableName - Database table name from TABLE_NAMES constants
 * @param {Object} params.where - Prisma where clause to identify which records to update
 * @param {Object} params.data - Data fields to update in the target record
 * @returns {Promise<Object>} Updated database record with applied changes
 * @throws {DatabaseError} When database update fails or record not found
 * @throws {ValidationError} When required parameters are missing
 *
 * @example
 * // Update user status
 * const updatedUser = await updateRow({
 *   tableName: 'users',
 *   where: { id: userId },
 *   data: { status: 'INACTIVE' }
 * });
 *
 * // Update multiple records
 * const updatedRecords = await updateRow({
 *   tableName: 'users',
 *   where: { status: 'ACTIVE' },
 *   data: { lastLogin: new Date() }
 * });
 */
export const updateRow = async (tableName, data, where) => {
  return prisma[tableName].update({
    where,
    data,
  });
};

/**
 *
 * @param {*} item :: Object returned from BD
 * @param {*} keys :: fileds to exclude
 * @returnsdata item without excluded fields

 */
export const excludefromObject = (item, keys) => {
  return Object.fromEntries(
    Object.entries(item).filter(([key]) => !keys.includes(key))
  );
};

/**
   *
   * @param {*} item :: Array returned from BD
   * @param {*} keys :: fileds to exclude
   * @returnsdata items without excluded fields

   */
export const excludefromArray = (items, keys) =>
  items.map((item) => excludefromObject(item, keys));
