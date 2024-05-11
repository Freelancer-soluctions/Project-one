import prisma from '../../libs/prisma.js' 

/**
 * 
 * @param {*} params :: filter params 
 * @returns All rows by filter
 */

export const getRows = async ({ tableName, where, include, select } ) =>{

   return  prisma[tableName].findMany({
        ...(where && { where }),
        ...(include && { include }),
        ...(select && { select })
      })

}


/**

 * @param {*} params :: filter params 
 *
 * @returns One row by ID
 */
 export const getOneRow = async ({ tableName,where, include }) => {

    return prisma[tableName].findUnique({
      ...(where && { where }),
      ...(include && { include })
    })
    
  }

/**
 * 
 * @param {*} data :: Argument to create an item in DB 
 * @returns Created row in db
 */
export const createRow = async (tableName, data ) => {

    return prisma[tableName].create( { data } )
}

/**
 * 
 * @param {*} data :: Argument to create many items in Db.
 * @returns  Created row in db
 */

export const createManyRows = async ( tableName, data ) => {

    return prisma[tableName].createMany( {
        skipDuplicates : true,
        data
    } )
}

/**
 * 
 * @param {*} data :: Fields to update rows in Db.
 * @param {*} where :: DB filter
 * @returns 
 */
export const updateRow = async ( tableName, data , where ) => {

    return prisma[tableName].update( {
        where,
        data
    } )
}


/**
 * 
 * @param {*} where :: DB filter
 * @returns 
 */
export const deleteRow = async ( tableName, where ) => {

    return prisma[tableName].delete( { where } )

}