import globalResponse from '../../utils/responses&Errors/globalResponse.js'
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'
import * as providersService from './service.js'

/**
 * Get all providers with query parameters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the providers items.
 */
export const getAllProviders = handleCatchErrorAsync(async (req, res) => {
  const queryParams = req.query
  const items = await providersService.getAllProviders(queryParams)
  globalResponse(res, 200, items)
})

/**
 * Create a products item.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the creation of the products item.
 */
export const createProvider = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId // viene del token cambiar al body
  const { body } = req
  await providersService.createProvider(userId, body)
  globalResponse(res, 201, { message: 'Item created successfully' })
})

/**
 * Update a products item by its ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the update of the products item.
 */
export const updateById = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId
  const { id } = req.params
  const { body } = req
  await providersService.updateById(userId, id, body)
  globalResponse(res, 200, { message: 'Items updated successfully' })
})

/**
 * Delete a products item by its ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the deletion of the products item.
 */
export const deleteById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  await providersService.deleteById(id)
  globalResponse(res, 200, { message: 'Items deleted successfully' })
})

/**
 * Get the status of all products items.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the attributes of all products items.
 */
export const getAllProductAttributesByProductId = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  const data = await providersService.getAllProductAttributesByProductId(id)
  globalResponse(res, 200, data)
})

/**
 * Save a products attributes items.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the creation of the products item.
 */
export const saveProductAttributes = handleCatchErrorAsync(async (req, res) => {
  const { body } = req
  await providersService.saveProductAttributes(body)
  globalResponse(res, 201, { message: 'Product Attributes saved successfully' })
})

/**
 * Delete a products attribute item by its ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the deletion of the products item.
 */
export const deleteProductsAttributeById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  await providersService.deleteProductsAttributeById(id)
  globalResponse(res, 200, { message: 'Item deleted successfully' })
})
