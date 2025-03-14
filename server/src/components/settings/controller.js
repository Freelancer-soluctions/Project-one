import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'
import globalResponse from '../../utils/responses&Errors/globalResponse.js'
import * as settingsService from './service.js'

/**
 * Create or update a user's language settings.
 *
 * @function
 * @async
 * @param {Object} req - The request object containing the data for the language settings.
 * @param {Object} req.body - The body of the request, containing the language settings to be created or updated.
 * @param {Object} res - The response object to send the result.
 * @returns {void} - Sends a response with the status code and the result of the operation.
 * @throws {Error} - If there is an error, it will be handled by the catch handler.
 */
export const createOrUpdateSettingsLanguage = handleCatchErrorAsync(
  async (req, res) => {
    const { id } = req.params
    const { body } = req
    const result = await settingsService.createOrUpdateSettingsLanguage(
      body,
      id
    )
    globalResponse(res, 200, result)
  }
)

/**
 * Create or update a user's language settings.
 *
 * @function
 * @async
 * @param {Object} req - The request object containing the data for the language settings.
 * @param {Object} req.body - The body of the request, containing the language settings to be created or updated.
 * @param {Object} res - The response object to send the result.
 * @returns {void} - Sends a response with the status code and the result of the operation.
 * @throws {Error} - If there is an error, it will be handled by the catch handler.
 */
export const createOrUpdateSettingsDisplay = handleCatchErrorAsync(
  async (req, res) => {
    const { id } = req.params
    const { body } = req
    const result = await settingsService.createOrUpdateSettingsDisplay(
      body,
      id
    )
    globalResponse(res, 200, result)
  }
)

/**
 * Get the language settings by its ID.
 *
 * @function
 * @async
 * @param {Object} req - The request object containing the ID of the language settings to retrieve.
 * @param {Object} req.params - The parameters of the request, containing the `id` of the language settings.
 * @param {string} req.params.id - The ID of the language settings to retrieve.
 * @param {Object} res - The response object to send the result.
 * @returns {void} - Sends a response with the status code and the language settings associated with the given ID.
 * @throws {Error} - If there is an error, it will be handled by the catch handler.
 */
export const getSettingsById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  const result = await settingsService.getSettingsById(id)
  globalResponse(res, 200, result)
})

/**
 * Get all product categories with optional filters
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.description - Description to filter categories by
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Sends a response containing the filtered categories
 */
export const getAllProductCategories = handleCatchErrorAsync(
  async (req, res) => {
    const data = await settingsService.getAllProductCategories(req.query)
    globalResponse(res, 200, data)
  }
)

/**
 * Create a new product category
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.code - Category code
 * @param {string} req.body.description - Category description
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Sends a response confirming the creation
 */
export const createProductCategory = handleCatchErrorAsync(
  async (req, res) => {
    await settingsService.createProductCategory(req.body)
    globalResponse(res, 201, { message: 'Item created successfully' })
  })

/**
 * Update a product category by ID
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {number} req.params.id - Category ID to update
 * @param {Object} req.body - Request body
 * @param {string} req.body.description - Updated category description
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Sends a response confirming the update
 */
export const updateProductCategoryById = handleCatchErrorAsync(
  async (req, res) => {
    const categoryId = req.params.id
    await settingsService.updateProductCategoryById(
      categoryId,
      req.body
    )
    globalResponse(res, 200, { message: 'Item updated successfully' })
  })

/**
 * Delete a product category by ID
 * @param {Object} req - Express request object
 * @param {Object} req.params - URL parameters
 * @param {number} req.params.id - Category ID to delete
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Sends a response confirming the deletion
 */
export const deleteProductCategoryById = handleCatchErrorAsync(
  async (req, res) => {
    const categoryId = req.params.id
    await settingsService.deleteProductCategoryById(categoryId)
    globalResponse(res, 200, { message: 'Item deleted successfully' })
  })
