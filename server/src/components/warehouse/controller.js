import {
  getAllWarehouses as getAllWarehousesService,
  createWarehouse as createWarehouseService,
  updateWarehouseById as updateWarehouseByIdService,
  deleteWarehouseById as deleteWarehouseByIdService
} from './service.js'
import globalResponse from '../../utils/responses&Errors/globalResponse.js'
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'

/**
 * Get all warehouses with optional filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const getAllWarehouses = handleCatchErrorAsync(async (req, res) => {
  const { name, status } = req.query
  const warehouses = await getAllWarehousesService({ name, status })
  globalResponse(res, 200, warehouses)
})

/**
 * Create a new warehouse
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const createWarehouse = handleCatchErrorAsync(async (req, res) => {
  await createWarehouseService(req.body)
  globalResponse(res, 201, { message: 'Warehouse created successfully' })
})

/**
 * Update a warehouse by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const updateWarehouseById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  await updateWarehouseByIdService(id, req.body)
  globalResponse(res, 200, { message: 'Warehouse updated successfully' })
})

/**
 * Delete a warehouse by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const deleteWarehouseById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  await deleteWarehouseByIdService(id)
  globalResponse(res, 200, { message: 'Warehouse deleted successfully' })
})
