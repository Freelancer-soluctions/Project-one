import {
  getSettingsById as getSettingsByIdDao,
  createOrUpdateSettingsLanguage as createOrUpdateSettingsLanguageDao,
  createOrUpdateSettingsDisplay as createOrUpdateSettingsDisplayDao,
} from "./dao.js";

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
  { id, language },
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
