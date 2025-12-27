import * as productsDao from './dao.js'
import { getSafePagination } from '../../utils/pagination/pagination.js'

/**
 * Get all products from the database with optional filters.
 *
 * @param {Object} params - The parameters for filtering products.
 * @param {string} name - The name filter.
 * @param {string} productProviderCode - The product provider code filter.
 * @param {string} productCategoryCode - The product category code filter.
 * @param {string} statusCode - The status code filter.}
 * @param {number} limit - Filter by limit
 * @param {number} page - Filter by page
 * @returns {Promise<Array>} A list of products matching the filters.
 */
export const getAllProducts = async ({
  name,
  productProviderCode,
  productCategoryCode,
  statusCode,
  limit,
  page
}) => {
  const { take, skip } = getSafePagination({ page, limit })

  if (!take || take <= 0) {
    throw new Error('Pagination is required')
  }
  return await productsDao.getAllProducts(
    name,
    productProviderCode,
    productCategoryCode,
    statusCode,
    take,
    skip
  )
}

/**
 * Create a new product in the database.
 *
 * @param {number} userId - The ID of the user creating the product.
 * @param {Object} data - The data for the new product.
 * @param {string} data.sku - The unique SKU of the product (max 16 characters).
 * @param {string} data.name - The name of the product (max 80 characters).
 * @param {number} data.productCategoryId - The ID of the product category.
 * @param {number} data.productProviderId - The ID of the product provider.
 * @param {number} data.price - The price of the product (decimal with 2 decimal places).
 * @param {number} data.cost - The cost of the product (decimal with 2 decimal places).
 * @param {number} data.stock - The initial stock quantity (integer, min 0).
 * @param {string} data.description - The product description (max 2000 characters).
 * @param {number} data.productStatusId - The ID of the product status.
 * @param {string} [data.barCode] - The optional barcode of the product (max 25 characters).
 * @returns {Promise<Object>} The created product.
 */
export const createOne = async (userId, data) => {
  const newProduct = {
    sku: String(data.sku),
    name: String(data.name),
    productCategoryId: Number(data.productCategoryId),
    productProviderId: Number(data.productProviderId),
    price: Number(data.price),
    cost: Number(data.cost),
    stock: Number(data.stock),
    description: data.description ? String(data.description) : null,
    productStatusId: Number(data.productStatusId),
    barCode: data.barCode ? String(data.barCode) : null, // Opcional
    createdOn: new Date(),
    createdBy: Number(userId)
  }

  return productsDao.createRow(newProduct)
}

/**
 * Update an existing product in the database by its ID.
 *
 * @param {number} userId - The ID of the user updating the product.
 * @param {number} id - The ID of the product to update.
 * @param {Object} data - The updated data for the product.
 * @param {string} data.statusCode - The updated status code of the product.
 * @returns {Promise<Object>} The updated product.
 */

export const updateById = async (userId, id, data) => {
  const rowId = Number(id)
  const product = {
    ...data,
    updatedOn: new Date(),
    updatedBy: Number(userId)

  }

  return productsDao.updateRow(product, { id: rowId })
}

/**
 * Delete a product from the database by its ID.
 *
 * @param {number} id - The ID of the product to delete.
 * @returns {Promise<Object>} The result of the deletion.
 */

export const deleteById = async (id) => {
  const rowId = Number(id)
  return productsDao.deleteRow({ id: rowId })
}

/**
 * Get all available product statuses from the database.
 *
 * @returns {Promise<Array>} A list of all product statuses.
 */

export const getAllProductStatus = async () => {
  const data = await productsDao.getAllProductStatus()
  return data
}

/**
 * Get all available product categories from the database.
 *
 * @returns {Promise<Array>} A list of all product categories.
 */

export const getAllProductCategories = async () => {
  const data = await productsDao.getAllProductCategories()
  return data
}

/**
 * Get all available product providers from the database.
 *
 * @returns {Promise<Array>} A list of all product providers.
 */

export const getAllProductProviders = async () => {
  const data = await productsDao.getAllProductProviders()
  return data
}

/**
 * Get all attributes for a product by its ID.
 *
 * @param {number} id - The ID of the product.
 * @returns {Promise<Array>} A list of attributes for the specified product.
 */

export const getAllProductAttributesByProductId = async (id) => {
  const rowId = Number(id)
  const data = await productsDao.getAllProductAttributesByProductId({ productId: rowId })
  return data
}

/**
 * Create new product attributes in the database.
 *
 * @param {Object} data - The data for the product attributes.
 * @returns {Promise<Object>} The created product attributes.
 */

export const saveProductAttributes = async (data) => {
  return productsDao.saveProductAttributes(data)
}

/**
 * Delete a product attribute from the database by its ID.
 *
 * @param {number} id - The ID of the product attribute to delete.
 * @returns {Promise<Object>} The result of the deletion.
 */
export const deleteProductsAttributeById = async (id) => {
  const rowId = Number(id)
  return productsDao.deleteProductsAttributeById({ id: rowId })
}
