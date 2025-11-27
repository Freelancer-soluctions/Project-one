import { prisma } from '../../config/db.js'

/**
 * Create or update language settings.
 *
 * @function
 * @async
 * @param {number} id - The ID of the settings to be updated. If not provided, a new setting will be created.
 * @param {Object} data - The data object to be saved in the database.
 * @returns {Promise<Object>} - Returns the created or updated settings object.
 * @throws {Error} - Throws an error if the database operation fails.
 */
export const createOrUpdateSettingsLanguage = async (id, data, userId) => {
  if (id) {
    // Actualiza el registro si el id existe
    return await prisma.settings.update({
      where: { id },
      data
    })
  } else {
    // Crea un nuevo registro si el id no existe
    return await prisma.settings.create({
      data: {
        language: data.language,
        createdOn: data.createdOn,
        userSettingCreated: {
          connect: {
            id: userId
          }
        }
      }
    })
  }
}

/**
 * Create or update language settings.
 *
 * @function
 * @async
 * @param {number} id - The ID of the settings to be updated. If not provided, a new setting will be created.
 * @param {string} data - The display data to be saved.
 * @returns {Promise<Object>} - Returns the created or updated settings object.
 * @throws {Error} - Throws an error if the database operation fails.
 */
export const createOrUpdateSettingsDisplay = async (id, data, userId) => {
  if (id) {
    // Actualiza el registro si el id existe
    return await prisma.settings.update({
      where: { id },
      data
    })
  } else {
    // Crea un nuevo registro si el id no existe
    return await prisma.settings.create({
      data: {
        ...data,
        userSettingCreated: {
          connect: {
            id: userId
          }
        }
      }
    })
  }
}

/**
 * Get language settings by user ID (Alternative implementation).
 *
 * @function
 * @async
 * @param {number} userId - The ID of the user whose language settings are to be retrieved.
 * @returns {Promise<Object>} - Returns the language settings for the specified user.
 * @throws {Error} - Throws an error if the database operation fails.
 */
export const getSettingsById = async (userId) => {
  const result = await prisma.settings.findFirst({
    where: {
      userId
    }
  })
  return Promise.resolve(result)
}

/**
 * Get all product categories from the database with optional filters
 * @param {string} description - Description to filter categories by
 * @param {string} code - Code to filter categories by
 * @returns {Promise<Array>} A list of categories matching the filters
 */
export const getAllProductCategories = async (description = '', code = '') => {
  return prisma.productCategories.findMany({
    where: {
      description: {
        contains: description,
        mode: 'insensitive'
      },
      code: {
        contains: code,
        mode: 'insensitive'
      }
    },
    orderBy: {
      code: 'asc'
    }
  })
}

/**
 * Create a new product category in the database
 * @param {Object} data - The data for the new category
 * @param {string} data.code - The unique code of the category
 * @param {string} data.description - The description of the category
 * @param {string} data.createdOn - The date of creation of the category
 * @returns {Promise<Object>} The created category
 */
export const createProductCategory = async (data) => {
  return prisma.productCategories.create({
    data: {
      code: data.code,
      description: data.description,
      createdOn: new Date()
    }
  })
}

/**
 * Update a product category in the database
 * @param {Object} data - The updated data for the category
 * @param {string} data.description - The updated description of the category
 * @param {Object} where - The conditions to find the category to update
 * @param {number} where.id - The ID of the category to update
 * @returns {Promise<Object>} The updated category
 */
export const updateProductCategory = async (data, where) => {
  return prisma.productCategories.update({
    where,
    data: {
      description: data.description,
      code: data.code,
      updatedOn: new Date()
    }
  })
}

/**
 * Delete a product category from the database
 * @param {Object} where - The conditions to find the category to delete
 * @param {number} where.id - The ID of the category to delete
 * @returns {Promise<Object>} The deleted category
 */
export const deleteProductCategory = async (where) => {
  return prisma.productCategories.delete({
    where
  })
}
