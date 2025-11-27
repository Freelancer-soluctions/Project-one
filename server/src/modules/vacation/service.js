import { getAllVacation as getAllVacationDao, createVacation as createVacationDao, updateVacationById as updateVacationByIdDao, deleteVacationById as deleteVacationByIdDao } from './dao.js'

/**
 * Get all vacation records with optional filters
 * @param {Object} filters - Filter criteria for vacation records
 * @returns {Promise<Array>} Array of vacation records
 */
export const getAllVacation = async (filters) => {
  return await getAllVacationDao(filters)
}

/**
 * Create a new vacation record
 * @param {Object} data - Vacation data to create
 * @returns {Promise<Object>} Created vacation record
 */
export const createVacation = async (data) => {
  const vacation = {
    ...data,
    createdOn: new Date()
  }
  return await createVacationDao(vacation)
}

/**
 * Update a vacation record by ID
 * @param {number} id - ID of the vacation record to update
 * @param {Object} data - Updated vacation data
 * @returns {Promise<Object>} Updated vacation record
 */
export const updateVacationById = async (id, data) => {
  const vacation = {
    ...data,
    updatedOn: new Date()
  }
  return await updateVacationByIdDao(id, vacation)
}

/**
 * Delete a vacation record by ID
 * @param {number} id - ID of the vacation record to delete
 * @returns {Promise<Object>} Deleted vacation record
 */
export const deleteVacationById = async (id) => {
  return await deleteVacationByIdDao(id)
}
