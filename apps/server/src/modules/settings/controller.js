import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';
import * as settingsService from './service.js';

/**
 * Create or update a user's language settings.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing language settings
 * @param {string} req.body.language - Language code to save (e.g., 'en', 'es')
 * @param {number} [req.body.id] - Settings ID (for updates)
* @param {string} req.userId - Authenticated user ID from token
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends response with created/updated language settings
 */
export const createOrUpdateSettingsLanguage = handleCatchErrorAsync(
  async (req, res) => {
    const { body, userId } = req;
    const result = await settingsService.createOrUpdateSettingsLanguage(
      body,
      userId
    );
    globalResponse(res, 200, result);
  }
);

/**
 * Create or update a user's display settings.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing display settings
 * @param {number} [req.body.id] - Settings ID (for updates)
 * @param {Object} req.body.displayOptions - Display options object
* @param {string} req.userId - Authenticated user ID from token
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends response with created/updated display settings
 */
export const createOrUpdateSettingsDisplay = handleCatchErrorAsync(
  async (req, res) => {
    const { body, userId } = req;
    const result = await settingsService.createOrUpdateSettingsDisplay(
      body,
      userId
    );
    globalResponse(res, 200, result);
  }
);

/**
 * Get user settings by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - URL parameters
 * @param {number} req.params.id - Settings ID to retrieve
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends response with user settings data
 */
export const getSettingsById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  const result = await settingsService.getSettingsById(id);
  globalResponse(res, 200, result);
});

/**
 * Get all product categories with optional filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Validated query parameters
 * @param {string} [req.safeQuery.description] - Description to filter categories by
 * @param {string} [req.safeQuery.code] - Code to filter categories by
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the filtered categories
 */
export const getAllProductCategories = handleCatchErrorAsync(
  async (req, res) => {
    const data = await settingsService.getAllProductCategories(req.safeQuery);
    globalResponse(res, 200, data);
  }
);

/**
 * Create a new product category.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing category data
 * @param {string} req.body.code - Category code
 * @param {string} req.body.description - Category description
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the creation
 */
export const createProductCategory = handleCatchErrorAsync(async (req, res) => {
  await settingsService.createProductCategory(req.body);
  globalResponse(res, 201, { message: 'Item created successfully' });
});

/**
 * Update a product category by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - URL parameters
 * @param {number} req.params.id - Category ID to update
 * @param {Object} req.body - Request body containing updated category data
 * @param {string} req.body.description - Updated category description
 * @param {string} [req.body.code] - Updated category code
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the update
 */
export const updateProductCategoryById = handleCatchErrorAsync(
  async (req, res) => {
    const categoryId = req.params.id;
    await settingsService.updateProductCategoryById(categoryId, req.body);
    globalResponse(res, 200, { message: 'Item updated successfully' });
  }
);

/**
 * Delete a product category by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - URL parameters
 * @param {number} req.params.id - Category ID to delete
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the deletion
 */
export const deleteProductCategoryById = handleCatchErrorAsync(
  async (req, res) => {
    const categoryId = req.params.id;
    await settingsService.deleteProductCategoryById(categoryId);
    globalResponse(res, 200, { message: 'Item deleted successfully' });
  }
);
