import * as productsDao from './dao.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';

/**
 * Retrieves all providers based on optional filters.
 *
 * @param {Object} params - The parameters for filtering the providers.
 * @param {string} name - The name filter.
 * @param {boolean} status - The status filter.
 * @param {number} limit - Filter by limit
 * @param {number} page - Filter by page
 * @returns {Promise<Array>} A list of providers matching the filters.
 */
export const getAllProviders = async ({ name, status, limit, page }) => {
  const { take, skip } = getSafePagination({ page, limit });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return await productsDao.getAllProducts(name, status, take, skip);
};

/**
 * Retrieves all providers.
 *
 * @returns {Promise<Array>} A list of providers matching the filters.
 */
export const getAllProvidersFilters = async () => {
  return await productsDao.getAllProvidersFilters();
};

/**
 * Creates a new provider in the database.
 *
 * @param {number} userId - The ID of the user creating the provider.
 * @param {Object} data - The data for the new provider.
 * @param {string} data.code - The unique code of the provider (max 3 characters).
 * @param {string} data.name - The name of the provider (max 100 characters).
 * @param {boolean} data.status - The status of the provider (active/inactive).
 * @param {string} [data.contactName] - The contact name of the provider (max 60 characters, optional).
 * @param {string} [data.contactEmail] - The contact email of the provider (max 80 characters, optional).
 * @param {string} [data.contactPhone] - The contact phone number of the provider (max 15 characters, optional).
 * @param {string} [data.address] - The address of the provider (max 120 characters, optional).
 * @returns {Promise<Object>} The created provider.
 */
export const createProvider = async (userId, data) => {
  const newProvider = {
    code: String(data.code),
    name: String(data.name),
    status: Boolean(data.status),
    contactName: data.contactName ? String(data.contactName) : null,
    contactEmail: data.contactEmail ? String(data.contactEmail) : null,
    contactPhone: data.address ? String(data.contactPhone) : null,
    address: data.address ? String(data.address) : null,
    createdOn: new Date(),
    createdBy: Number(userId),
  };

  return productsDao.createProvider(newProvider);
};

/**
 * Updates an existing provider in the database by its ID.
 *
 * @param {number} userId - The ID of the user updating the provider.
 * @param {number} id - The ID of the provider to update.
 * @param {Object} data - The updated data for the provider.
 * @param {string} [data.statusCode] - The status code of the provider.
 * @returns {Promise<Object>} The updated provider.
 */
export const updateById = async (userId, id, data) => {
  const rowId = Number(id);
  const provider = {
    ...data,
    status: Boolean(data.status),
    contactName: data.contactName ? String(data.contactName) : null,
    contactEmail: data.contactEmail ? String(data.contactEmail) : null,
    contactPhone: data.address ? String(data.contactPhone) : null,
    address: data.address ? String(data.address) : null,
    updatedOn: new Date(),
    updatedBy: Number(userId),
  };

  return productsDao.updateRow(provider, { id: rowId });
};
/**
 * Deletes a provider from the database by its ID.
 *
 * @param {number} id - The ID of the provider to delete.
 * @returns {Promise<Object>} The result of the deletion.
 */
export const deleteById = async (id) => {
  const rowId = Number(id);
  return productsDao.deleteRow({ id: rowId });
};
