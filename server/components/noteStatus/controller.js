import globalResponse from '../../utils/responses&Errors/globalResponse.js'
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'
import * as noteStatusService from './service.js'

/**
 * Get all
 *
 * @param {*} req
 * @param {*} res
 * @returns A message
 */
export const getAll = handleCatchErrorAsync(async (req, res) => {
  const items = await noteStatusService.getAll()
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
  const item = await noteStatusService.getOneById(id)
  globalResponse(res, 200, item)
})

/**
 * Get one by code
 *
 * @param {*} req
 * @param {*} res
 * @returns A message
 */
export const getOneByCode = handleCatchErrorAsync(async (req, res) => {
  const { code } = req.params
  const item = await noteStatusService.getOneByCode(code)
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
  await noteStatusService.createOne(body)
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
  await noteStatusService.createMany(body)
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
  await noteStatusService.updateById(id, body)
  globalResponse(res, 200, { message: 'Items updated successfully' })
})

/**
 * Update By Code
 *
 * @param {*} req
 * @param {*} res
 * @returns  a message
 */
export const updateByCode = handleCatchErrorAsync(async (req, res) => {
  const { code } = req.params
  const { body } = req
  await noteStatusService.updateByCode(code, body)
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
  await noteStatusService.deleteById(id)
  globalResponse(res, 200, { message: 'Items deleted successfully' })
})

/**
 * Delete By Code
 *
 * @param {*} req
 * @param {*} res
 * @returns a message
 */
export const deleteByCode = handleCatchErrorAsync(async (req, res) => {
  const { code } = req.params
  await noteStatusService.deleteByCode(code)
  globalResponse(res, 200, { message: 'Items deleted successfully' })
})
