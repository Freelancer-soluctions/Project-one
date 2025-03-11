import globalResponse from '../../utils/responses&Errors/globalResponse.js'
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'
import * as providersService from './service.js'

/**
 * Retrieves all providers based on query parameters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the list of providers.
 */
export const getAllProviders = handleCatchErrorAsync(async (req, res) => {
  const queryParams = req.query
  const items = await providersService.getAllProviders(queryParams)
  globalResponse(res, 200, items)
})

/**
 * Creates a new provider.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the creation of the provider.
 */
export const createProvider = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId // viene del token cambiar al body
  const { body } = req
  await providersService.createProvider(userId, body)
  globalResponse(res, 201, { message: 'Item created successfully' })
})

/**
 * Updates an existing provider by its ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the update of the provider.
 */
export const updateProviderById = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId
  const { id } = req.params
  const { body } = req
  await providersService.updateById(userId, id, body)
  globalResponse(res, 200, { message: 'Items updated successfully' })
})

/**
 * Deletes a provider by its ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the deletion of the provider.
 */
export const deleteProviderById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  await providersService.deleteById(id)
  globalResponse(res, 200, { message: 'Items deleted successfully' })
})
