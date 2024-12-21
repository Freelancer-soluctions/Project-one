import {
  createManyRows,
  createRow,
  deleteRow,
  getOneRow,
  getRows,
  updateRow
} from './dao.js'

/**
 *
 * @returns All Rows from DB
 */
export const getAll = async () => {
  return getRows({})
}

/**
 *
 * @returns One row filter by id
 */
export const getOneById = async (id) => {
  const rowId = Number(id)
  return getOneRow({ where: { id: rowId } })
}

/**
 *
 * @returns One row filter by id
 */
export const getOneByCode = async (code) => {
  return getOneRow({ where: { code } })
}

/**
 *
 * @param {*} data
 * @returns Created Row
 */
export const createOne = async ({ description, code }) => {
  return createRow({ description, code })
}

/**
 *
 * @param {*} data
 * @returns Created Rows
 */
export const createMany = async (data) => {
  return createManyRows(data)
}

/**
 *
 * @param {*} id :: rowId
 * @param {*} data ::
 * @returns Updated row
 */
export const updateById = async (id, data) => {
  const rowId = Number(id)
  return updateRow(data, { id: rowId })
}

/**
 *
 * @param {*} code :: code field
 * @param {*} data ::
 * @returns Updated row
 */
export const updateByCode = async (code, data) => {
  return updateRow(data, { code })
}

/**
 *
 * @param {*} id
 * @returns Deleted row
 */
export const deleteById = async (id) => {
  const rowId = Number(id)
  return deleteRow({ id: rowId })
}

/**
 *
 * @param {*} code
 * @returns Deleted row
 */
export const deleteByCode = async (code) => {
  return deleteRow({ code })
}
