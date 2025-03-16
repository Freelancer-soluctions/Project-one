import {
  getAllStock as getAllStockService,
  createStock as createStockService,
  updateStockById as updateStockByIdService,
  deleteStockById as deleteStockByIdService
} from './service.js'
import globalResponse from '../../utils/responses&Errors/globalResponse.js'
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'

/**
 * Get all stock entries with optional filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const getAllStock = handleCatchErrorAsync(async (req, res) => {
  const { productId, warehouseId, lot, unitMeasure } = req.query
  const stock = await getAllStockService({ productId, warehouseId, lot, unitMeasure })
  globalResponse(res, 200, stock)
})

/**
 * Create a new stock entry
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const createStock = handleCatchErrorAsync(async (req, res) => {
  await createStockService(req.body)
  globalResponse(res, 201, { message: 'Stock entry created successfully' })
})

/**
 * Update a stock entry by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const updateStockById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  await updateStockByIdService(id, req.body)
  globalResponse(res, 200, { message: 'Stock entry updated successfully' })
})

/**
 * Delete a stock entry by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const deleteStockById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  await deleteStockByIdService(id)
  globalResponse(res, 200, { message: 'Stock entry deleted successfully' })
})
