import {
  getSettingsById as getSettingsByIdDao,
  createOrUpdateSettingsLanguage as createOrUpdateSettingsLanguageDao,
  createOrUpdateSettingsDisplay as createOrUpdateSettingsDisplayDao,
  getAllProductCategories as getAllProductCategoriesDao,
  createProductCategory as createProductCategoryDao,
  updateProductCategory as updateProductCategoryByIdDao,
  deleteProductCategory as deleteProductCategoryByIdDao,
} from './dao.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';

/**
 * Create or update language settings based on the provided data.
 *
 * @param {Object} data - The data for creating or updating language settings.
 * @param {number} data.id - The ID of the language settings (optional for creating new settings).
 * @param {string} data.language - The language code to be saved.
 * @param {number} userId - The user ID associated with the language settings.
 * @returns {Object} - The object that is prepared to be saved, with the correct values for either creating or updating the settings.
 * @throws {Error} - If there is an error during the database operation.
 */
export const createOrUpdateSettingsLanguage = async (
  { language, id },
  userId
) => {
  const rowId = Number(id);
  const user = Number(userId);
  const timestamp = new Date();

  const settingsObject = id
    ? { updatedOn: timestamp, language }
    : { language, createdOn: timestamp };

  return await createOrUpdateSettingsLanguageDao(rowId, settingsObject, user);
};

/**
 * Create or update language settings based on the provided data.
 *
 * @param {Object} data - The data for creating or updating language settings.
 * @param {number} data.id - The ID of the language settings (optional for creating new settings).
 * @param {string} data - The display data to be saved.
 * @param {number} userId - The user ID associated with the language settings.
 * @returns {Object} - The object that is prepared to be saved, with the correct values for either creating or updating the settings.
 * @throws {Error} - If there is an error during the database operation.
 */
export const createOrUpdateSettingsDisplay = async (
  { id, displayOptions },
  userId
) => {
  const rowId = Number(id);
  const user = Number(userId);
  const timestamp = new Date();

  const settingsObject = rowId
    ? { updatedOn: timestamp, ...displayOptions }
    : { ...displayOptions, createdOn: timestamp };

  return await createOrUpdateSettingsDisplayDao(rowId, settingsObject, user);
};

/**
 * Get the language settings by user ID.
 *
 * @param {number} userId - The ID of the user whose language settings are to be retrieved.
 * @returns {Object} - The language settings associated with the given user ID.
 * @throws {Error} - If there is an error during the database operation.
 */
export const getSettingsById = async (userId) => {
  const rowId = Number(userId);
  return await getSettingsByIdDao(rowId);
};

/**
 * Get all product categories with optional filters
 * @param {Object} params - The parameters for filtering categories
 * @param {string} params.description - Description to filter categories by
 * @param {string} params.code - Code to filter categories by
 * @param {number} limit - Filter by limit
 * @param {number} page - Filter by page
 * @returns {Promise<Array>} A list of categories matching the filters
 */
export const getAllProductCategories = async ({
  description,
  code,
  limit,
  page,
}) => {
  const { take, skip } = getSafePagination({ page, limit });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return getAllProductCategoriesDao(description, code, take, skip);
};

/**
 * Create a new product category
 * @param {number} userId - The ID of the user creating the category
 * @param {Object} data - The data for the new category
 * @param {string} data.code - The code of the category
 * @param {string} data.description - The description of the category
 * @returns {Promise<Object>} The created category
 */
export const createProductCategory = async (data) => {
  console.log('data', data);
  const createData = {
    code: data.code,
    description: data.description,
    createdOn: new Date(),
  };

  return createProductCategoryDao(createData);
};

/**
 * Update a product category by ID
 * @param {number} categoryId - The ID of the category to update
 * @param {Object} data - The updated data for the category
 * @param {string} data.description - The updated description of the category
 * @param {string} data.code - The updated code of the category
 * @returns {Promise<Object>} The updated category
 */
export const updateProductCategoryById = async (categoryId, data) => {
  const updateData = {
    ...data,
    updatedOn: new Date(),
  };

  return updateProductCategoryByIdDao(updateData, { id: Number(categoryId) });
};

/**
 * Delete a product category by ID
 * @param {number} categoryId - The ID of the category to delete
 * @returns {Promise<void>}
 */
export const deleteProductCategoryById = async (categoryId) => {
  return deleteProductCategoryByIdDao({ id: Number(categoryId) });
};
