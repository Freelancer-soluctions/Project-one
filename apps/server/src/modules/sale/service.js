import {
  getAllSales as getAllSalesDao,
  createSale as createSaleDao,
  updateSaleById as updateSaleByIdDao,
  deleteSaleById as deleteSaleByIdDao
} from './dao.js'
import { getSafePagination } from '../../utils/pagination/pagination.js'

/**
 * Get all sales with optional filters
 * @param {Object} filters - Optional filters for the query
 * @returns {Promise<Array>} List of sales
 */
export const getAllSales = async (filters) => {
  const formatedFilters = {
    ...filters,
    clientId: Number(filters.clientId)

  }
  const { take, skip } = getSafePagination({ page: formatedFilters.page, limit: formatedFilters.limit })

  if (!take || take <= 0) {
    throw new Error('Pagination is required')
  }
  return await getAllSalesDao(formatedFilters, take, skip)
}

/**
 * Create a new sale
 * @param {Object} data - Sale data
 * @returns {Promise<Object>} Created sale
 */
export const createSale = async (data) => {
  const dataToCreate = {
    clientId: Number(data.clientId),
    total: Number(data.total),
    details: data.details,
    createdBy: Number(data.createdBy),
    createdOn: new Date()
  }
  return createSaleDao(dataToCreate)
}

/**
 * Update a sale by ID
 * @param {number} id - Sale ID
 * @param {Object} data - Updated sale data
 * @returns {Promise<Object>} Updated sale
 */
export const updateSaleById = async (id, data) => {
  const dataToUpdate = {
    clientId: Number(data.clientId),
    total: Number(data.total),
    details: data.details,
    updatedBy: Number(data.updatedBy),
    updatedOn: new Date()
  }
  return updateSaleByIdDao(Number(id), dataToUpdate)
}

/**
 * Delete a sale by ID
 * @param {number} id - Sale ID
 * @returns {Promise<Object>} Deleted sale
 */
export const deleteSaleById = async (id) => {
  return deleteSaleByIdDao(Number(id))
}
