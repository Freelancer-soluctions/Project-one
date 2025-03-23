import {
  getAllPurchases as getAllPurchasesService,
  createPurchase as createPurchaseService,
  updatePurchaseById as updatePurchaseByIdService,
  deletePurchaseById as deletePurchaseByIdService
} from './service.js'
import { handleCatchErrorAsync } from '../../utils/errorHandler.js'
import { handleSuccessResponse } from '../../utils/responseHandler.js'

/**
 * Get all purchases with optional filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllPurchases = handleCatchErrorAsync(async (req, res) => {
  const purchases = await getAllPurchasesService(req.query)
  handleSuccessResponse(res, purchases, 'Purchases retrieved successfully')
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
  handleSuccessResponse(res, purchase, 'Purchase created successfully')
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
  handleSuccessResponse(res, purchase, 'Purchase updated successfully')
})

/**
 * Delete a purchase by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deletePurchaseById = handleCatchErrorAsync(async (req, res) => {
  await deletePurchaseByIdService(req.params.id)
  handleSuccessResponse(res, null, 'Purchase deleted successfully')
})
