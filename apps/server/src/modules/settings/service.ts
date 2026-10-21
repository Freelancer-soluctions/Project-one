import {
  getSettingsById as getSettingsByIdDao,
  createOrUpdateSettingsLanguage as createOrUpdateSettingsLanguageDao,
  createOrUpdateSettingsDisplay as createOrUpdateSettingsDisplayDao,
  getAllProductCategories as getAllProductCategoriesDao,
  createProductCategory as createProductCategoryDao,
  updateProductCategory as updateProductCategoryByIdDao,
  deleteProductCategory as deleteProductCategoryByIdDao,
  patchSettingsById as patchSettingsByIdDao,
} from './dao.js';
import type {
  CreateProductCategoryInput,
  PatchSettingData,
  ProductCategory,
  ProductCategoryFilters,
  ProductCategoryServiceResult,
  Setting,
  SettingDisplayInput,
  SettingLanguageInput,
  UpdateProductCategoryInput,
  UpdateSettingInput,
} from './types.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';

/**
 * Create or update language settings based on the provided data.
 *
 * @param {Object} data - The data for creating or updating language settings.
 * @param {number} [data.id] - The ID of the language settings (optional for creating new settings).
 * @param {string} data.language - The language code to be saved.
 * @param {number} userId - The user ID associated with the language settings.
 * @returns {Promise<Object>} The created or updated language settings.
 * @throws {ClientError} If there is an error during the database operation.
 */
export const createOrUpdateSettingsLanguage = async (
  { language, id }: SettingLanguageInput,
  userId: number
): Promise<Setting> => {
  const rowId = Number(id);
  const user = Number(userId);
  const timestamp = new Date();

  const settingsObject = id
    ? { updatedOn: timestamp, language }
    : { language, createdOn: timestamp };

  return await createOrUpdateSettingsLanguageDao(rowId, settingsObject, user);
};

/**
 * Create or update display settings based on the provided data.
 *
 * @param {Object} data - The data for creating or updating display settings.
 * @param {number} [data.id] - The ID of the settings (optional for creating new settings).
 * @param {Object} data.displayOptions - Display options object to be saved.
 * @param {number} userId - The user ID associated with the settings.
 * @returns {Promise<Object>} The created or updated display settings.
 * @throws {ClientError} If there is an error during the database operation.
 */
export const createOrUpdateSettingsDisplay = async (
  { id, displayOptions }: SettingDisplayInput,
  userId: number
): Promise<Setting> => {
  const rowId = Number(id);
  const user = Number(userId);
  const timestamp = new Date();

  const settingsObject = rowId
    ? { updatedOn: timestamp, ...displayOptions }
    : { ...displayOptions, createdOn: timestamp };

  return await createOrUpdateSettingsDisplayDao(rowId, settingsObject, user);
};

/**
 * Get user settings by user ID.
 *
 * @param {number} userId - The ID of the user whose settings are to be retrieved.
 * @returns {Promise<Object|null>} The settings associated with the given user ID.
 * @throws {ClientError} If there is an error during the database operation.
 */
export const getSettingsById = async (
  userId: number
): Promise<Setting | null> => {
  const rowId = Number(userId);
  return await getSettingsByIdDao(rowId);
};

/**
 * Get all product categories with optional filters.
 *
 * @param {Object} params - The parameters for filtering categories
 * @param {string} [params.description] - Description to filter categories by
 * @param {string} [params.code] - Code to filter categories by
 * @param {number} params.limit - Filter by limit
 * @param {number} params.page - Filter by page
 * @returns {Promise<Object>} A paginated list of categories matching the filters.
 * @throws {Error} When pagination parameters are missing or invalid.
 */
export const getAllProductCategories = async ({
  description,
  code,
  limit,
  page,
}: ProductCategoryFilters): Promise<ProductCategoryServiceResult> => {
  const { take, skip } = getSafePagination({ page, limit });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return getAllProductCategoriesDao(description, code, take, skip);
};

/**
 * Create a new product category.
 *
 * @param {Object} data - The data for the new category.
 * @param {string} data.code - The code of the category.
 * @param {string} data.description - The description of the category.
 * @returns {Promise<Object>} The created category.
 */
export const createProductCategory = async (
  data: CreateProductCategoryInput
): Promise<ProductCategory> => {
  console.log('data', data);
  const createData = {
    code: data.code,
    description: data.description,
    createdOn: new Date(),
  };

  return createProductCategoryDao(createData);
};

/**
 * Update a product category by ID.
 *
 * @param {number} categoryId - The ID of the category to update.
 * @param {Object} data - The updated data for the category.
 * @param {string} [data.description] - The updated description of the category.
 * @param {string} [data.code] - The updated code of the category.
 * @returns {Promise<Object>} The updated category.
 */
export const updateProductCategoryById = async (
  categoryId: number,
  data: UpdateProductCategoryInput
): Promise<ProductCategory> => {
  const updateData = {
    ...data,
    updatedOn: new Date(),
  };

  return updateProductCategoryByIdDao(updateData, { id: Number(categoryId) });
};

/**
 * Delete a product category by ID.
 *
 * @param {number} categoryId - The ID of the category to delete.
 * @returns {Promise<Object>} The deleted category.
 */
export const deleteProductCategoryById = async (
  categoryId: number
): Promise<ProductCategory> => {
  return deleteProductCategoryByIdDao({ id: Number(categoryId) });
};

/**
 * Partially update settings by ID.
 *
 * El body del PATCH llega con `displayOptions` ANIDADO, pero el modelo
 * `settings` no tiene esa columna: guarda 8 columnas planas. El aplanado se
 * hace aquí (mismo criterio que `createOrUpdateSettingsDisplay`, que ya
 * despliega `{ ...displayOptions }`) para que el dao reciba siempre una fila
 * válida de Prisma. Sin esto, `prisma.settings.update` rechaza la clave
 * `displayOptions` en runtime y el endpoint queda roto
 * (server-ts-latent-defects, fix 2).
 *
 * `language` se preserva cuando llega junto a `displayOptions` en el mismo
 * PATCH: el controller acepta ambos campos y un spread de solo `displayOptions`
 * lo descartaría.
 *
 * @param {number} settingsId - The ID of the settings to update.
 * @param {Object} data - Partial settings data to update.
 * @param {string} [data.language] - Language code to update.
 * @param {Object} [data.displayOptions] - Display options to update (se aplana).
 * @returns {Promise<Object>} The updated settings.
 */
export const patchSettingsById = async (
  settingsId: number,
  data: UpdateSettingInput
): Promise<Setting> => {
  const { language, displayOptions } = data;

  const updateData: PatchSettingData = {
    ...(language !== undefined && { language }),
    ...(displayOptions !== undefined && { ...displayOptions }),
  };

  return await patchSettingsByIdDao(Number(settingsId), updateData);
};
