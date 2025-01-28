import prisma from '../../config/db.js'

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
export const createOrUpdateSettingsLanguage = async (id, data) => {
  if (id) {
    // Actualiza el registro si el id existe
    return await prisma.settings.update({
      where: { id },
      data
    })
  } else {
    // Crea un nuevo registro si el id no existe
    return await prisma.settings.create({
      data
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
export const getLanguageById = async (userId) => {
  const result = await prisma.settings.findUnique({
    where: {
      createdby: userId
    }
  })
  return Promise.resolve(result)
}
