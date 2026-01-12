import {
  getAllClients as getAllClientsService,
  getAllClientsFilters as getAllClientsFiltersService,
  createClient as createClientService,
  updateClientById as updateClientByIdService,
  deleteClientById as deleteClientByIdService,
} from './service.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';

/**
 * Get all clients with optional filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllClients = handleCatchErrorAsync(async (req, res) => {
  const clients = await getAllClientsService(req.query);
  globalResponse(res, 200, clients);
});

/**
 * Get all clients.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllClientsFilters = handleCatchErrorAsync(async (req, res) => {
  const clients = await getAllClientsFiltersService();
  globalResponse(res, 200, clients);
});

/**
 * Create a new client
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createClient = handleCatchErrorAsync(async (req, res) => {
  const client = await createClientService({
    ...req.body,
    createdBy: req.userId,
  });
  globalResponse(res, 201, client);
});

/**
 * Update a client by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateClientById = handleCatchErrorAsync(async (req, res) => {
  const client = await updateClientByIdService(req.params.id, {
    ...req.body,
    updatedBy: req.userId,
  });
  globalResponse(res, 200, client);
});

/**
 * Delete a client by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteClientById = handleCatchErrorAsync(async (req, res) => {
  await deleteClientByIdService(req.params.id);
  globalResponse(res, 200, { message: 'Client deleted successfully' });
});
