import * as productsDao from './dao.js'

/**
 * Get all products from the database with optional filters.
 *
 * @param {Object} params - The parameters for filtering the products.
 * @param {string} params.description - The description filter.
 * @param {string} params.productProviderCode - The status provider code filter.
 * @param {string} params.productCategoryCode - The status category code filter.
 * @param {string} params.statusCode - The status code filter.
 * @returns {Promise<Array>} A list of products items matching the filters.
 */
export const getAllProviders = async ({
  name,
  status
}) => {
  const data = await productsDao.getAllProducts(
    name,
    status
  )
  return data
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
 * @param {number} data.price - The price of the product (decimal with 2 precision).
 * @param {number} data.cost - The cost of the product (decimal with 2 precision).
 * @param {number} data.stock - The initial stock quantity (integer, min 0).
 * @param {string} data.description - The product description (max 2000 characters).
 * @param {number} data.productStatusId - The ID of the product status.
 * @param {string} [data.barCode] - The optional barcode of the product (max 25 characters).
 * @returns {Promise<Object>} The created product.
 */
export const createProvider = async (userId, data) => {
  const newProvider = {
    code: String(data.sku),
    name: String(data.name),
    status: Boolean(data.status),
    contactName: data.contactName ? String(data.contactName) : null,
    contactEmail: data.contactEmail ? String(data.contactEmail) : null,
    contactPhone: data.address ? String(data.contactPhone) : null,
    address: data.address ? String(data.contactPhone) : null,
    createdOn: new Date(),
    createdBy: Number(userId)
  }

  return productsDao.createProvider(newProvider)
}

/**
 * Update an existing products item in the database by its ID.
 *
 * @param {number} userId - The ID of the user updating the products.
 * @param {Object} data - The updated data for the products item.
 * @param {number} data.id - The ID of the products item to update.
 * @param {string} data.statusCode - The status code of the products item.
 * @returns {Promise<Object>} The updated products item.
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
 * Delete a products item from the database by its ID.
 *
 * @param {number} id - The ID of the products item to delete.
 * @returns {Promise<Object>} The result of the deletion.
 */
export const deleteById = async (id) => {
  const rowId = Number(id)
  return productsDao.deleteRow({ id: rowId })
}

/**
 * Get all available products attributes from the database.
 *
 * @returns {Promise<Array>} A list of all products attributes.
 */

export const getAllProductAttributesByProductId = async (id) => {
  const rowId = Number(id)
  const data = await productsDao.getAllProductAttributesByProductId({ productId: rowId })
  return data
}

/**
 * Create a new product attributes in the database.
 *
 * @param {Object} data - The data for the product attributes.
 * @returns {Promise<Object>} The created product.
 */
export const saveProductAttributes = async (data) => {
  return productsDao.saveProductAttributes(data)
}

/**
 * Delete a products item from the database by its ID.
 *
 * @param {number} id - The ID of the products item to delete.
 * @returns {Promise<Object>} The result of the deletion.
 */
export const deleteProductsAttributeById = async (id) => {
  const rowId = Number(id)
  return productsDao.deleteProductsAttributeById({ id: rowId })
}
