import * as productsDao from './dao.js'
import { PRODUCTSSTATUSCODE } from '../utils/enums/enums.js'

/**
 * Get all products from the database with optional filters.
 *
 * @param {Object} params - The parameters for filtering the products.
 * @param {string} params.description - The description filter.
 * @param {string} params.productTypeCode - The status type code filter.
 * @param {string} params.productCategoryCode - The status category code filter.
 * @param {string} params.statusCode - The status code filter.
 * @returns {Promise<Array>} A list of products items matching the filters.
 */
export const getAllProducts = async ({
  name,
  productTypeCode,
  productCategoryCode,
  statusCode
}) => {
  const data = await productsDao.getAllProducts(
    name,
    productTypeCode,
    productCategoryCode,
    statusCode
  )
  return data
}

/**
 * Get one products item from the database by its ID.
 *
 * @param {number} id - The ID of the products item.
 * @returns {Promise<Object>} The products item matching the ID.
 */
export const getOneById = async (id) => {
  return productsDao.getOneRow({ where: { id } })
}

/**
 * Create a new product in the database.
 *
 * @param {number} userId - The ID of the user creating the product.
 * @param {Object} data - The data for the new product.
 * @param {string} data.sku - The unique SKU of the product (max 16 characters).
 * @param {string} data.name - The name of the product (max 80 characters).
 * @param {number} data.productCategoryId - The ID of the product category.
 * @param {number} data.productTypeId - The ID of the product type.
 * @param {number} data.price - The price of the product (decimal with 2 precision).
 * @param {number} data.cost - The cost of the product (decimal with 2 precision).
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
    productTypeId: Number(data.productTypeId),
    price: Number(data.price),
    cost: Number(data.cost),
    stock: Number(data.stock),
    description: String(data.description),
    productStatusId: Number(data.productStatusId),
    barCode: data.barCode ? String(data.barCode) : null, // Opcional
    createdOn: new Date(),
    createdBy: Number(data.userId)
  }

  return productsDao.createRow(newProduct)
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
export const updateById = async (userId, newId, data) => {
  const rowId = Number(newId)

  if (data.statusCode === NEWSSTATUSCODE.CLOSED) {
    data.closedBy = Number(userId)
    data.closedOn = new Date()
  }

  if (data.statusCode === NEWSSTATUSCODE.PENDING) {
    data.pendingBy = Number(userId)
    data.pendingOn = new Date()
  }

  // if (data.document) {
  // const { documentId } = await getOneById(rowId)
  //   const baseImage = Buffer.from(file.buffer).toString('base64')
  //   const imageURI = `data:${file.mimetype};base64,${baseImage}`

  //   if (documentId) {
  //     await handleUploadUpdate(imageURI, documentId)
  //   } else {
  //     const { public_id, secure_url } = await handleUpload(imageURI)
  //     newsData.document = secure_url
  //     newsData.documentId = public_id
  //   }
  // }
  return productsDao.updateRow(data, { id: rowId })
}
/**
 * Delete a products item from the database by its ID.
 *
 * @param {number} id - The ID of the products item to delete.
 * @returns {Promise<Object>} The result of the deletion.
 */
export const deleteById = async (id) => {
  const rowId = Number(id)
  // const { documentId } = await getOneById(rowId)

  // if (documentId) {
  //   await handleDeleteFile(documentId)
  // }

  return productsDao.deleteRow({ id: rowId })
}

/**
 * Get all available products statuses from the database.
 *
 * @returns {Promise<Array>} A list of all products statuses.
 */

export const getAllProductStatus = async () => {
  const data = await productsDao.getAllProductStatus()
  return data
}

/**
 * Get all available products categories from the database.
 *
 * @returns {Promise<Array>} A list of all products statuses.
 */

export const getAllProductCategories = async () => {
  const data = await productsDao.getAllProductCategories()
  return data
}

/**
 * Get all available products types from the database.
 *
 * @returns {Promise<Array>} A list of all products statuses.
 */

export const getAllProductTypes = async () => {
  const data = await productsDao.getAllProductTypes()
  return data
}
