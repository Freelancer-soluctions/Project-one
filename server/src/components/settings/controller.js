import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'
import globalResponse from '../../utils/responses&Errors/globalResponse.js'

import * as settingsService from './service.js'

/**
 * Create or update a user's language settings.
 *
 * @function
 * @async
 * @param {Object} req - The request object containing the data for the language settings.
 * @param {Object} req.body - The body of the request, containing the language settings to be created or updated.
 * @param {Object} res - The response object to send the result.
 * @returns {void} - Sends a response with the status code and the result of the operation.
 * @throws {Error} - If there is an error, it will be handled by the catch handler.
 */
export const createOrUpdateSettingsLanguage = handleCatchErrorAsync(async (req, res) => {
  const { body } = req
  console.log('createOrUpdateSettingsLanguage', body)
  const result = await settingsService.createOrUpdateSettingsLanguage(body)
  globalResponse(res, 200, result)
})

/**
 * Get the language settings by its ID.
 *
 * @function
 * @async
 * @param {Object} req - The request object containing the ID of the language settings to retrieve.
 * @param {Object} req.params - The parameters of the request, containing the `id` of the language settings.
 * @param {string} req.params.id - The ID of the language settings to retrieve.
 * @param {Object} res - The response object to send the result.
 * @returns {void} - Sends a response with the status code and the language settings associated with the given ID.
 * @throws {Error} - If there is an error, it will be handled by the catch handler.
 */
export const getLanguageById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  console.log('getLanguageByIddd', id)
  const result = await settingsService.getLanguageById(id)
  console.log('getLanguageById', result)
  globalResponse(res, 200, result)
})
