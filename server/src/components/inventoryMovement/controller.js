import {
  getAllInventoryMovements as getAllInventoryMovementsService,
  createInventoryMovement as createInventoryMovementService,
  updateInventoryMovementById as updateInventoryMovementByIdService,
  deleteInventoryMovementById as deleteInventoryMovementByIdService
} from './service.js'
import globalResponse from '../../utils/responses&Errors/globalResponse.js'
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'

/**
 * Get all inventory movements with optional filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const getAllInventoryMovements = handleCatchErrorAsync(async (req, res) => {
  const { productId, warehouseId, type } = req.query
  const inventoryMovements = await getAllInventoryMovementsService({ productId, warehouseId, type })
  globalResponse(res, 200, inventoryMovements)
})

/**
 * Create a new inventory movement
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const createInventoryMovement = handleCatchErrorAsync(async (req, res) => {
  await createInventoryMovementService(req.body)
  globalResponse(res, 201, { message: 'Inventory movement created successfully' })
})

/**
 * Update an inventory movement by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const updateInventoryMovementById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  await updateInventoryMovementByIdService(id, req.body)
  globalResponse(res, 200, { message: 'Inventory movement updated successfully' })
})

/**
 * Delete an inventory movement by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const deleteInventoryMovementById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  await deleteInventoryMovementByIdService(id)
  globalResponse(res, 200, { message: 'Inventory movement deleted successfully' })
})
