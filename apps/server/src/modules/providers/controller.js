import globalResponse from '../../utils/responses&Errors/globalResponse.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import * as providersService from './service.js';

/**
 * Retrieves all providers based on query parameters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Safe query parameters with filters
 * @param {number} [req.safeQuery.page] - Page number for pagination
 * @param {number} [req.safeQuery.limit] - Number of items per page
 * @param {string} [req.safeQuery.name] - Filter by provider name
 * @param {string} [req.safeQuery.email] - Filter by provider email
 * @param {string} [req.safeQuery.phone] - Filter by provider phone
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the list of providers.
 */
export const getAllProviders = handleCatchErrorAsync(async (req, res) => {
  const queryParams = req.safeQuery;
  const items = await providersService.getAllProviders(queryParams);
  globalResponse(res, 200, items);
});

/**
 * Retrieves all providers for UI filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the list of all providers.
 */
export const getAllProvidersFilters = handleCatchErrorAsync(
  async (req, res) => {
    const items = await providersService.getAllProvidersFilters();
    globalResponse(res, 200, items);
  }
);

/**
 * Creates a new provider.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing provider data
 * @param {string} req.body.name - Provider name
 * @param {string} req.body.email - Provider email address
 * @param {string} req.body.phone - Provider phone number
 * @param {string} req.body.address - Provider address
 * @param {string} req.body.contactPerson - Contact person name
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the creation of the provider.
 */
export const createProvider = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId; // viene del token cambiar al body
  const { body } = req;
  await providersService.createProvider(userId, body);
  globalResponse(res, 201, { message: 'Item created successfully' });
});

/**
 * Updates an existing provider by its ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Provider ID from URL
 * @param {Object} req.body - Request body containing provider data to update
 * @param {string} [req.body.name] - Provider name
 * @param {string} [req.body.email] - Provider email address
 * @param {string} [req.body.phone] - Provider phone number
 * @param {string} [req.body.address] - Provider address
 * @param {string} [req.body.contactPerson] - Contact person name
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the update of the provider.
 */
export const updateProviderById = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { body } = req;
  await providersService.updateById(userId, id, body);
  globalResponse(res, 200, { message: 'Item updated successfully' });
});

/**
 * Deletes a provider by its ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Provider ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the deletion of the provider.
 */
export const deleteProviderById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  await providersService.deleteById(id);
  globalResponse(res, 200, { message: 'Item deleted successfully' });
});
