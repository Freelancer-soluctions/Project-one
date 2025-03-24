import {
  getAllSales as getAllSalesService,
  createSale as createSaleService,
  updateSaleById as updateSaleByIdService,
  deleteSaleById as deleteSaleByIdService
} from './service.js'
import globalResponse from '../../utils/responses&Errors/globalResponse.js'
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'

/**
 * Get all sales with optional filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllSales = handleCatchErrorAsync(async (req, res) => {
  const sales = await getAllSalesService(req.query)
  globalResponse(res, 200, sales)
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
  globalResponse(res, 201, sale)
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
  globalResponse(res, 200, sale)
})

/**
 * Delete a sale by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteSaleById = handleCatchErrorAsync(async (req, res) => {
  await deleteSaleByIdService(req.params.id)
  globalResponse(res, 200, { message: 'Sale deleted successfully' })
})
