import {
  getAllPurchases as getAllPurchasesService,
  createPurchase as createPurchaseService,
  updatePurchaseById as updatePurchaseByIdService,
  deletePurchaseById as deletePurchaseByIdService
} from './service.js'
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'
import globalResponse from '../../utils/responses&Errors/globalResponse.js'

/**
 * Get all purchases with optional filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllPurchases = handleCatchErrorAsync(async (req, res) => {
  const purchases = await getAllPurchasesService(req.query)
  globalResponse(res, 200, purchases)
})

/**
 * Create a new purchase
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createPurchase = handleCatchErrorAsync(async (req, res) => {
  const purchase = await createPurchaseService({
    ...req.body,
    createdBy: req.user.id
  })
  globalResponse(res, 201, purchase)
})

/**
 * Update a purchase by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updatePurchaseById = handleCatchErrorAsync(async (req, res) => {
  const purchase = await updatePurchaseByIdService(req.params.id, {
    ...req.body,
    updatedBy: req.user.id
  })
  globalResponse(res, 200, purchase)
})

/**
 * Delete a purchase by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deletePurchaseById = handleCatchErrorAsync(async (req, res) => {
  await deletePurchaseByIdService(req.params.id)
  globalResponse(res, 200, { message: 'Purchase deleted successfully' })
})
