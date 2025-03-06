import globalResponse from '../../utils/responses&Errors/globalResponse.js'
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'
import * as productsService from './service.js'

/**
 * Get all products with query parameters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the products items.
 */
export const getAllProducts = handleCatchErrorAsync(async (req, res) => {
  const queryParams = req.query
  const items = await productsService.getAllProducts(queryParams)
  globalResponse(res, 200, items)
})

/**
 * Get the status of all products items.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the status of all products items.
 */
export const getAllProductStatus = handleCatchErrorAsync(async (req, res) => {
  const data = await productsService.getAllProductStatus()
  globalResponse(res, 200, data)
})

/**
 * Get the status of all products items.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the categories of all products items.
 */
export const getAllProductCategories = handleCatchErrorAsync(async (req, res) => {
  const data = await productsService.getAllProductCategories()
  globalResponse(res, 200, data)
})

/**
 * Get the status of all products items.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the types of all products items.
 */
export const getAllProductProviders = handleCatchErrorAsync(async (req, res) => {
  const data = await productsService.getAllProductProviders()
  globalResponse(res, 200, data)
})

/**
 * Get one products item by its ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the products item.
 */
export const getOneById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  const item = await productsService.getOneById(id)
  globalResponse(res, 200, item)
})

/**
 * Create a products item.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the creation of the products item.
 */
export const createOne = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId // viene del token cambiar al body
  const { body } = req
  await productsService.createOne(userId, body)
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
  await productsService.updateById(userId, id, body)
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
  await productsService.deleteById(id)
  globalResponse(res, 200, { message: 'Items deleted successfully' })
})
