import {
  getAllClients as getAllClientsService,
  createClient as createClientService,
  updateClientById as updateClientByIdService,
  deleteClientById as deleteClientByIdService
} from './service.js'
import { handleCatchErrorAsync } from '../../utils/errorHandler.js'
import { handleSuccessResponse } from '../../utils/responseHandler.js'

/**
 * Get all clients with optional filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllClients = handleCatchErrorAsync(async (req, res) => {
  const clients = await getAllClientsService(req.query)
  handleSuccessResponse(res, clients, 'Clients retrieved successfully')
})

/**
 * Create a new client
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createClient = handleCatchErrorAsync(async (req, res) => {
  const client = await createClientService({
    ...req.body,
    createdBy: req.user.id
  })
  handleSuccessResponse(res, client, 'Client created successfully')
})

/**
 * Update a client by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateClientById = handleCatchErrorAsync(async (req, res) => {
  const client = await updateClientByIdService(req.params.id, {
    ...req.body,
    updatedBy: req.user.id
  })
  handleSuccessResponse(res, client, 'Client updated successfully')
})

/**
 * Delete a client by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteClientById = handleCatchErrorAsync(async (req, res) => {
  await deleteClientByIdService(req.params.id)
  handleSuccessResponse(res, null, 'Client deleted successfully')
})
