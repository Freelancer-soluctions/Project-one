import prisma from '../../libs/prisma.js' 

/**
 * 
 * @param {*} params :: filter params 
 * @returns All rows by filter
 */

export const getRows = async ({  where, include, select } ) =>{

   return  prisma.news.findMany({
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
 export const getOneRow = async ({ where, include }) => {

    return prisma.news.findUnique({
      ...(where && { where }),
      ...(include && { include })
    })
    
  }

/**
 * 
 * @param {*} data :: Argument to create an item in DB 
 * @returns Created row in db
 */
export const createRow = async ( data ) => {

    return prisma.news.create( { data } )
}

/**
 * 
 * @param {*} data :: Argument to create many items in Db.
 * @returns  Created row in db
 */

export const createManyRows = async ( data ) => {

    return prisma.news.createMany( {
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

    return prisma.news.update( {
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

    return prisma.news.delete( { where } )

}