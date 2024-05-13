import globalResponse from '../../utils/responses&Errors/globalResponse.js'
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'
import * as newsStatusService from './service.js'

/**
 * Get all
 *
 * @param {*} req
 * @param {*} res
 * @returns A message
 */
export const getAll = handleCatchErrorAsync(async (req, res) => {
  const items = await newsStatusService.getAll()
  globalResponse(res, 200, items)
})

/**
 * Get one by id
 *
 * @param {*} req
 * @param {*} res
 * @returns A message
 */
export const getOneById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  const item = await newsStatusService.getOneById(id)
  globalResponse(res, 200, item)
})

/**
 * create One
 *
 * @param {*} req
 * @param {*} res
 * @returns A message
 */
export const createOne = handleCatchErrorAsync(async (req, res) => {
  const { body } = req
  await newsStatusService.createOne(body)
  globalResponse(res, 201, { message: 'Item created successfully' })
})

/**
 * create One
 *
 * @param {*} req
 * @param {*} res
 * @returns A message
 */
export const createMany = async (req, res) => {
  const { body } = req
  await newsStatusService.createMany(body)
  globalResponse(res, 201, { message: 'Items created successfully' })
}

/**
 * Update By ID
 *
 * @param {*} req
 * @param {*} res
 * @returns  a message
 */
export const updateById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  const { body } = req
  await newsStatusService.updateById(id, body)
  globalResponse(res, 200, { message: 'Items updated successfully' })
})

/**
 * Delete By ID
 *
 * @param {*} req
 * @param {*} res
 * @returns a message
 */
export const deleteById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  await newsStatusService.deleteById(id)
  globalResponse(res, 200, { message: 'Items deleted successfully' })
})
