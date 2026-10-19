import { prisma } from '../../config/db.js';
import type { Prisma } from '@prisma/client';
import type {
  CreateProductCategoryInput,
  ProductCategory,
  ProductCategoryServiceResult,
  Setting,
  SettingDisplayData,
  SettingLanguageData,
  UpdateProductCategoryInput,
} from './types.js';

/**
 * Create or update language settings.
 *
 * @param {number} id - Settings ID (0 for new record).
 * @param {Object} data - Settings data to save.
 * @param {string} data.language - Language code.
 * @param {Date} [data.createdOn] - Creation timestamp (for new records).
 * @param {Date} [data.updatedOn] - Update timestamp (for updates).
 * @param {number} userId - User ID to associate settings with.
 * @returns {Promise<Object>} The created or updated settings object.
 */
export const createOrUpdateSettingsLanguage = async (
  id: number | undefined,
  data: SettingLanguageData,
  userId: number
): Promise<Setting> => {
  if (id) {
    // Actualiza el registro si el id existe
    return await prisma.settings.update({
      where: { id },
      data,
    });
  } else {
    // Crea un nuevo registro si el id no existe
    return await prisma.settings.create({
      data: {
        language: data.language,
        createdOn: data.createdOn,
        userSettingCreated: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }
};

/**
 * Create or update display settings.
 *
 * @param {number} id - Settings ID (0 for new record).
 * @param {Object} data - Display settings data to save.
 * @param {Object} data.displayOptions - Display options object.
 * @param {Date} [data.createdOn] - Creation timestamp (for new records).
 * @param {Date} [data.updatedOn] - Update timestamp (for updates).
 * @param {number} userId - User ID to associate settings with.
 * @returns {Promise<Object>} The created or updated settings object.
 */
export const createOrUpdateSettingsDisplay = async (
  id: number | undefined,
  data: SettingDisplayData,
  userId: number
): Promise<Setting> => {
  if (id) {
    // Actualiza el registro si el id existe
    return await prisma.settings.update({
      where: { id },
      data,
    });
  } else {
    // Crea un nuevo registro si el id no existe
    return await prisma.settings.create({
      data: {
        ...data,
        userSettingCreated: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }
};

/**
 * Get user settings by user ID.
 *
 * @param {number} userId - User ID.
 * @returns {Promise<Object|null>} The settings for the specified user, or null if not found.
 */
export const getSettingsById = async (
  userId: number
): Promise<Setting | null> => {
  const result = await prisma.settings.findFirst({
    where: {
      userId,
    },
  });
  return Promise.resolve(result);
};

/**
 * Get all product categories with optional filters.
 *
 * @param {string} [description] - Description to filter categories by.
 * @param {string} [code] - Code to filter categories by.
 * @param {number} take - Number of records to retrieve.
 * @param {number} skip - Number of records to skip.
 * @returns {Promise<Object>} Object containing dataList and total count.
 */
export const getAllProductCategories = async (
  description: string = '',
  code: string = '',
  take: number,
  skip: number
): Promise<ProductCategoryServiceResult> => {
  const dataList = await prisma.productCategories.findMany({
    where: {
      description: {
        contains: description,
        mode: 'insensitive',
      },
      code: {
        contains: code,
        mode: 'insensitive',
      },
    },
    orderBy: {
      code: 'asc',
    },
    take,
    skip,
  });
  const total = await prisma.productCategories.count({
    where: {
      description: {
        contains: description,
        mode: 'insensitive',
      },
      code: {
        contains: code,
        mode: 'insensitive',
      },
    },
    orderBy: {
      code: 'asc',
    },
  });
  return { dataList, total };
};

/**
 * Create a new product category.
 *
 * @param {Object} data - The data for the new category.
 * @param {string} data.code - The unique code of the category.
 * @param {string} data.description - The description of the category.
 * @returns {Promise<Object>} The created category.
 */
export const createProductCategory = async (
  data: CreateProductCategoryInput
): Promise<ProductCategory> => {
  return prisma.productCategories.create({
    data: {
      code: data.code,
      description: data.description,
      createdOn: new Date(),
    },
  });
};

/**
 * Update a product category by conditions.
 *
 * @param {Object} data - The updated data for the category.
 * @param {string} [data.description] - The updated description of the category.
 * @param {string} [data.code] - The updated code of the category.
 * @param {Object} where - The conditions to find the category to update.
 * @param {number} where.id - The ID of the category to update.
 * @returns {Promise<Object>} The updated category.
 */
export const updateProductCategory = async (
  data: UpdateProductCategoryInput,
  where: Prisma.productCategoriesWhereUniqueInput
): Promise<ProductCategory> => {
  return prisma.productCategories.update({
    where,
    data: {
      description: data.description,
      code: data.code,
      updatedOn: new Date(),
    },
  });
};

/**
 * Delete a product category by conditions.
 *
 * @param {Object} where - The conditions to find the category to delete.
 * @param {number} where.id - The ID of the category to delete.
 * @returns {Promise<Object>} The deleted category.
 */
export const deleteProductCategory = async (
  where: Prisma.productCategoriesWhereUniqueInput
): Promise<ProductCategory> => {
  return prisma.productCategories.delete({
    where,
  });
};

/**
 * Partially update settings by ID.
 *
 * @param {number} id - Settings ID.
 * @param {Object} data - Partial settings data to update.
 * @param {string} [data.language] - Language code to update.
 * @param {Object} [data.displayOptions] - Display options to update.
 * @returns {Promise<Object>} The updated settings object.
 */
export const patchSettingsById = async (
  id: number,
  data: Prisma.settingsUpdateInput
): Promise<Setting> => {
  return await prisma.settings.update({
    where: { id },
    data,
  });
};
