import {
  getAllClientOrders as getAllClientOrdersService,
  createClientOrder as createClientOrderService,
  updateClientOrderById as updateClientOrderByIdService,
  deleteClientOrderById as deleteClientOrderByIdService
} from './service.js'
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'
import globalResponse from '../../utils/responses&Errors/globalResponse.js'

/**
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
export const getAllClientOrders = handleCatchErrorAsync(async (req, res) => {
  console.log(req.query)
  const clientOrders = await getAllClientOrdersService(req.query)
  globalResponse(res, 200, clientOrders)
})

/**
 * Create a new clientOrder
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createClientOrder = handleCatchErrorAsync(async (req, res) => {
  console.log(req.body)
  const clientOrder = await createClientOrderService({
    ...req.body,
    createdBy: req.userId
  })
  globalResponse(res, 201, clientOrder)
})

/**
 * Update a clientOrder by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateClientOrderById = handleCatchErrorAsync(async (req, res) => {
  const clientOrder = await updateClientOrderByIdService(req.params.id, {
    ...req.body,
    updatedBy: req.userId
  })
  globalResponse(res, 200, clientOrder)
})

/**
 * Delete a clientOrder by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteClientOrderById = handleCatchErrorAsync(async (req, res) => {
  await deleteClientOrderByIdService(req.params.id)
  globalResponse(res, 200, { message: 'ClientOrder deleted successfully' })
})