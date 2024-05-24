import globalResponse from '../../utils/responses&Errors/globalResponse.js'
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'
import * as roleService from './service.js'

/**
 * Get all
 *
 * @param {*} req
 * @param {*} res
 * @returns A message
 */
export const getAll = handleCatchErrorAsync(async (req, res) => {
  const items = await roleService.getAll()
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
  const item = await roleService.getOneById(id)
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
  const item = await roleService.getOneByCode(code)
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
  await roleService.createOne(body)
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
  await roleService.createMany(body)
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
  await roleService.updateById(id, body)
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
  await roleService.updateByCode(code, body)
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
  await roleService.deleteById(id)
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
  await roleService.deleteByCode(code)
  globalResponse(res, 200, { message: 'Items deleted successfully' })
})
