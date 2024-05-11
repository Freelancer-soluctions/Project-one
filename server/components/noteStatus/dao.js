import * as prismaService from '../utils/dao.js'

const tableName = 'noteStatus'
/**
 * 
 * @param {*} params :: filter params 
 * @returns All rows by filter
 */

export const getRows = async ({ where, include, select }) => prismaService.getRows({
    tableName,
    where,
    include,
    select
})


/**

 * @param {*} params :: filter params 
 *
 * @returns One row by ID
 */
export const getOneRow = async ({ where, include }) => prismaService.getOneRow({
    tableName,
    where,
    include
})

/**
 * 
 * @param {*} data :: Argument to create an item in DB 
 * @returns Created row in db
 */
export const createRow = async (data) => prismaService.createRow( tableName, data )

/**
 * 
 * @param {*} data :: Argument to create many items in Db.
 * @returns  Created row in db
 */

export const createManyRows = async ( data ) => prismaService.createManyRows( tableName, data )

/**
 * 
 * @param {*} data :: Fields to update rows in Db.
 * @param {*} where :: DB filter
 * @returns 
 */
export const updateRow = async (data, where) => prismaService.updateRow( tableName, data, where )

/**
 * 
 * @param {*} where :: DB filter
 * @returns 
 */
export const deleteRow = async (where) => prismaService.deleteRow( tableName, where )