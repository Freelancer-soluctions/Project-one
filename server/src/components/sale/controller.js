import {
  getAllSales as getAllSalesService,
  createSale as createSaleService,
  updateSaleById as updateSaleByIdService,
  deleteSaleById as deleteSaleByIdService
} from './service.js'
import { handleCatchErrorAsync } from '../../utils/errorHandler.js'
import { handleSuccessResponse } from '../../utils/responseHandler.js'

/**
 * Get all sales with optional filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllSales = handleCatchErrorAsync(async (req, res) => {
  const sales = await getAllSalesService(req.query)
  handleSuccessResponse(res, sales, 'Sales retrieved successfully')
})

/**
 * Create a new sale
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createSale = handleCatchErrorAsync(async (req, res) => {
  const sale = await createSaleService({
    ...req.body,
    createdBy: req.user.id
  })
  handleSuccessResponse(res, sale, 'Sale created successfully')
})

/**
 * Update a sale by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateSaleById = handleCatchErrorAsync(async (req, res) => {
  const sale = await updateSaleByIdService(req.params.id, {
    ...req.body,
    updatedBy: req.user.id
  })
  handleSuccessResponse(res, sale, 'Sale updated successfully')
})

/**
 * Delete a sale by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteSaleById = handleCatchErrorAsync(async (req, res) => {
  await deleteSaleByIdService(req.params.id)
  handleSuccessResponse(res, null, 'Sale deleted successfully')
})
