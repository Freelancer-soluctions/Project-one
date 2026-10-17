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
 * Get all clients with optional filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Safe query parameters with filters
 * @param {number} [req.safeQuery.page] - Page number for pagination
 * @param {number} [req.safeQuery.limit] - Number of items per page
 * @param {string} [req.safeQuery.name] - Filter by client name
 * @param {string} [req.safeQuery.email] - Filter by client email
 * @param {string} [req.safeQuery.phone] - Filter by client phone
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns paginated list of clients
 */
export const getAllClients = handleCatchErrorAsync(async (req, res) => {
  const clients = await getAllClientsService(req.safeQuery);
  globalResponse(res, 200, clients);
});

/**
 * Get all clients for UI filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns list of all clients
 */
export const getAllClientsFilters = handleCatchErrorAsync(async (req, res) => {
  const clients = await getAllClientsFiltersService();
  globalResponse(res, 200, clients);
});

/**
 * Create a new client.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing client data
 * @param {string} req.body.name - Client name
 * @param {string} req.body.email - Client email address
 * @param {string} req.body.phone - Client phone number
 * @param {string} req.body.address - Client address
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Creates new client and returns client object
 */
export const createClient = handleCatchErrorAsync(async (req, res) => {
  const client = await createClientService({
    ...req.body,
    createdBy: req.userId,
  });
  globalResponse(res, 201, client);
});

/**
 * Update a client by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Client ID from URL
 * @param {Object} req.body - Request body containing client data to update
 * @param {string} [req.body.name] - Client name
 * @param {string} [req.body.email] - Client email address
 * @param {string} [req.body.phone] - Client phone number
 * @param {string} [req.body.address] - Client address
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Updates client and returns updated client object
 */
export const updateClientById = handleCatchErrorAsync(async (req, res) => {
  const client = await updateClientByIdService(req.params.id, {
    ...req.body,
    updatedBy: req.userId,
  });
  globalResponse(res, 200, client);
});

/**
 * Delete a client by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Client ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Deletes client and returns confirmation message
 */
export const deleteClientById = handleCatchErrorAsync(async (req, res) => {
  await deleteClientByIdService(req.params.id);
  globalResponse(res, 200, { message: 'Client deleted successfully' });
});
