import { globalResponse } from '../../utils/globalResponse.js'
import { handleCatchErrorAsync } from '../../utils/handleCatchErrorAsync.js'
import * as noteService from './service.js'


/**
 * Get all
 *
 * @param {*} req
 * @param {*} res
 * @returns A message
 */
export const getAll = handleCatchErrorAsync(async (req, res) => {

    const items = await noteService.getAll();
    globalResponse(res, 200, items);

})


/**
 * Get one by id
 *
 * @param {*} req
 * @param {*} res
 * @returns A message
 */
export const getOneById = handleCatchErrorAsync(async (req, res) => {

    const { id } = req.params;
    const item = await noteService.getOneById(id);
    globalResponse(res, 200, item);

})

/**
 * create One
 *
 * @param {*} req
 * @param {*} res
 * @returns A message
 */
export const createOne = handleCatchErrorAsync(async (req, res) => {

    const { body, file } = req;
    await noteService.createOne({ ...body, file });
    globalResponse(res, 201, { message: 'Item created successfully' });

})


/**
 * create One
 *
 * @param {*} req
 * @param {*} res
 * @returns A message
 */
export const createMany = async (req, res) => {

    const { body } = req;
    await noteService.createMany(body);
    globalResponse(res, 201, { message: 'Items created successfully' });

}

/**
 * Update By ID
 *
 * @param {*} req
 * @param {*} res
 * @returns  a message
 */
export const updateById = handleCatchErrorAsync(async (req, res) => {

    const { id } = req.params;
    const { body, file } = req;
    await noteService.updateById(id, { ...body, file });
    globalResponse(res, 200, { message: 'Items updated successfully' });

})

/**
 * Delete By ID
 *
 * @param {*} req
 * @param {*} res
 * @returns a message
 */
export const deleteById = handleCatchErrorAsync(async (req, res) => {

    const { id } = req.params;
    await noteService.deleteById(id);
    globalResponse(res, 200, { message: 'Items deleted successfully' });

})
