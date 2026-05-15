import { prisma } from '../../config/db.js';

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
export const createOrUpdateSettingsLanguage = async (id, data, userId) => {
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
export const createOrUpdateSettingsDisplay = async (id, data, userId) => {
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
export const getSettingsById = async (userId) => {
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
  description = '',
  code = '',
  take,
  skip
) => {
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
export const createProductCategory = async (data) => {
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
export const updateProductCategory = async (data, where) => {
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
export const deleteProductCategory = async (where) => {
  return prisma.productCategories.delete({
    where,
  });
};
