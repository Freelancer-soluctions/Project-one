import { handleCatchErrorAsync } from '../../utils/handleCatchErrorAsync.js'
import { globalResponse } from '../../utils/globalResponse.js'
import {
    getAll,
    createMany,
    createOne,
    deleteById,
    updateById
} from './service.js'


/**
 * create One
 *
 * @param {*} req
 * @param {*} res
 * @returns A message
 */
export const getAllRows = handleCatchErrorAsync(async (req, res) => {

    const items = await getAll()
    globalResponse(res, 200, { items })

})

/**
 * create One
 *
 * @param {*} req
 * @param {*} res
 * @returns A message
 */
export const createRow = handleCatchErrorAsync(async (req, res) => {

    const { body } = req
    await createOne(body)
    globalResponse(res, 201, { message: 'Item created successfully' })

})


/**
 * create One
 *
 * @param {*} req
 * @param {*} res
 * @returns A message
 */
export const createManyRows = handleCatchErrorAsync(async (req, res) => {

    const { body } = req
    await createMany(body)
    globalResponse(res, 201, { message: 'Items created successfully' })

})

/**
 * Update By ID
 *
 * @param {*} req
 * @param {*} res
 * @returns  a message
 */
export const updateRowById = handleCatchErrorAsync(async (req, res) => {
    
    const { id } = req.params
    const { body } = req
    await updateById( id, body )
    globalResponse(res, 200, { message: 'Items updated successfully' })

})

/**
 * Delete By ID
 *
 * @param {*} req
 * @param {*} res
 * @returns a message
 */
export const deleteRowById = handleCatchErrorAsync(async (req, res) => {
    
    const { id } = req.params
    const { body } = req
    await updateById( id, body )
    globalResponse(res, 200, { message: 'Items deleted successfully' })

})
