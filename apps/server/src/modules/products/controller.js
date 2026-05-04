import globalResponse from '../../utils/responses&Errors/globalResponse.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import * as productsService from './service.js';

/**
 * Get all products with query parameters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Safe query parameters with filters
 * @param {string} [req.safeQuery.name] - Filter by product name
 * @param {string} [req.safeQuery.productProviderCode] - Filter by provider code
 * @param {string} [req.safeQuery.productCategoryCode] - Filter by category code
 * @param {string} [req.safeQuery.statusCode] - Filter by status code
 * @param {number} [req.safeQuery.limit] - Number of items per page
 * @param {number} [req.safeQuery.page] - Page number for pagination
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the product items.
 */
export const getAllProducts = handleCatchErrorAsync(async (req, res) => {
  const queryParams = req.safeQuery;
  const items = await productsService.getAllProducts(queryParams);
  console.log('products3232', items);
  globalResponse(res, 200, items);
});

/**
 * Get all products for UI filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing all product items.
 */
export const getAllProductsFilters = handleCatchErrorAsync(async (req, res) => {
  const items = await productsService.getAllProductsFilters();
  globalResponse(res, 200, items);
});

/**
 * Get all product statuses.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the status of all product items.
 */
export const getAllProductStatus = handleCatchErrorAsync(async (req, res) => {
  const data = await productsService.getAllProductStatus();
  globalResponse(res, 200, data);
});

/**
 * Get all product categories.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the categories of all product items.
 */
export const getAllProductCategories = handleCatchErrorAsync(
  async (req, res) => {
    const data = await productsService.getAllProductCategories();
    globalResponse(res, 200, data);
  }
);

/**
 * Get all product providers.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the providers of all product items.
 */

export const getAllProductProviders = handleCatchErrorAsync(
  async (req, res) => {
    const data = await productsService.getAllProductProviders();
    globalResponse(res, 200, data);
  }
);

/**
 * Create a product item.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing product data
 * @param {string} req.body.sku - Product SKU
 * @param {string} req.body.name - Product name
 * @param {number} req.body.productCategoryId - Product category ID
 * @param {number} req.body.productProviderId - Product provider ID
 * @param {number} req.body.price - Product price
 * @param {number} req.body.cost - Product cost
 * @param {number} req.body.stock - Product stock quantity
 * @param {string} req.body.description - Product description
 * @param {number} req.body.productStatusId - Product status ID
 * @param {string} [req.body.barCode] - Product barcode (optional)
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the creation of the product item.
 */
export const createOne = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId; // viene del token cambiar al body
  const { body } = req;
  await productsService.createOne(userId, body);
  globalResponse(res, 201, { message: 'Item created successfully' });
});

/**
 * Update a product item by its ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Product ID from URL
 * @param {Object} req.body - Request body containing product data to update
 * @param {string} req.body.statusCode - Updated status code
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the update of the product item.
 */
export const updateById = handleCatchErrorAsync(async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const { body } = req;
  await productsService.updateById(userId, id, body);
  globalResponse(res, 200, { message: 'Items updated successfully' });
});

/**
 * Delete a product item by its ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Product ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the deletion of the product item.
 */

export const deleteById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  await productsService.deleteById(id);
  globalResponse(res, 200, { message: 'Items deleted successfully' });
});

/**
 * Get all attributes for a product by its ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Product ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response containing the attributes of the product.
 */
export const getAllProductAttributesByProductId = handleCatchErrorAsync(
  async (req, res) => {
    const { id } = req.params;
    const data = await productsService.getAllProductAttributesByProductId(id);
    globalResponse(res, 200, data);
  }
);

/**
 * Save product attributes.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing product attributes data
 * @param {Array} req.body.attributes - Array of product attributes
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the creation of the product attributes.
 */
export const saveProductAttributes = handleCatchErrorAsync(async (req, res) => {
  const { body } = req;
  await productsService.saveProductAttributes(body);
  globalResponse(res, 201, {
    message: 'Product Attributes saved successfully',
  });
});

/**
 * Delete a product attribute item by its ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Product attribute ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Sends a response confirming the deletion of the product attribute.
 */
export const deleteProductsAttributeById = handleCatchErrorAsync(
  async (req, res) => {
    const { id } = req.params;
    await productsService.deleteProductsAttributeById(id);
    globalResponse(res, 200, { message: 'Item deleted successfully' });
  }
);
