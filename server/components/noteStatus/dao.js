import prisma from '../../libs/prisma.js' 

/**
 * 
 * @param {*} params :: filter params 
 * @returns All rows by filter
 */

export const getRows = async ({  where, include, select } ) =>{

   return  prisma.noteStatus.findMany({
        ...(where && { where }),
        ...(include && { include }),
        ...(select && { select })
      })

}

/**
 * 
 * @param {*} data :: Argument to create an item in DB 
 * @returns Created row in db
 */
export const createRow = async ( data ) => {

    return prisma.noteStatus.create( { data } )
}

/**
 * 
 * @param {*} data :: Argument to create many items in Db.
 * @returns  Created row in db
 */

export const createManyRows = async ( data ) => {

    return prisma.noteStatus.createMany( {
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
export const updateRow = async ( data , where ) => {

    return prisma.noteStatus.update( {
        where,
        data
    } )
}

/**
 * 
 * @param {*} where :: DB filter
 * @returns 
 */
export const deleteRow = async ( where ) => {

    return prisma.noteStatus.delete( { where } )

}