import { getAllVacation as getAllVacationService, createVacation as createVacationService, updateVacationById as updateVacationByIdService, deleteVacationById as deleteVacationByIdService } from './service.js'
import { handleCatchErrorAsync } from '../../utils/handleCatchErrorAsync.js'
import { globalResponse } from '../../utils/globalResponse.js'

/**
 * Get all vacation records with optional filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with vacation records
 */
export const getAllVacation = handleCatchErrorAsync(async (req, res) => {
  const filters = req.query
  const data = await getAllVacationService(filters)
  return globalResponse(res, 200, data)
})

/**
 * Create a new vacation record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with created vacation record
 */
export const createVacation = handleCatchErrorAsync(async (req, res) => {
  const data = await createVacationService(req.body)
  return globalResponse(res, 201, data)
})

/**
 * Update a vacation record by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with updated vacation record
 */
export const updateVacationById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  const data = await updateVacationByIdService(id, req.body)
  return globalResponse(res, 200, data)
})

/**
 * Delete a vacation record by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with success message
 */
export const deleteVacationById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  const data = await deleteVacationByIdService(id)
  return globalResponse(res, 200, data, 'Vacation record deleted successfully')
})
