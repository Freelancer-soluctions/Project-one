import { tableNames } from '../utils/enums/enums.js'
import prisma from '../../config/db.js'

const tableName = tableNames.NOTES
/**
 * Retrieves all notes from the database based on the provided filters.
 *
 * @param {string} description - The description to filter news by.
 * @returns {Promise<Array>} A list of news matching the filters from the database.
 */

export const getAllNotes = async (description) => {
  return await prisma.noteColumns.findMany({
    include: {
      notes: {
        where: description
          ? {
              content: {
                contains: description, // Filtra por contenido si description está presente
                mode: 'insensitive' // Ignora mayúsculas/minúsculas
              }
            }
          : {} // Si no hay filtro, trae todas las notas
      }
    }
  })
}

/**
 * Creates a note row in the database with the provided data.
 *
 * @param {Object} data - The data to insert into the database.
 * @returns {Promise<Object>} The created row in the database.
 */

export const createNote = async (data) => {
  const result = await prisma.news.create({
    data: {
      ...data,
      userNoteCreated: {
        connect: {
          id: data.createdBy
        }
      },
      noteColumns: {
        connect: {
          id: data.columnId
        }
      }
    }
  })
  return Promise.resolve(result)
}

// /**

//  * @param {*} params :: filter params
//  *
//  * @returns One row by ID
//  */
// export const getOneRow = async ({ where, include }) => prismaService.getOneRow({
//   tableName,
//   where,
//   include
// })

// /**
//  *
//  * @param {*} data :: Argument to create an item in DB
//  * @returns Created row in db
//  */
// export const createRow = async (data) => prismaService.createRow(tableName, data)

// /**
//  *
//  * @param {*} data :: Argument to create many items in Db.
//  * @returns  Created row in db
//  */

// export const createManyRows = async (data) => prismaService.createManyRows(tableName, data)

// /**
//  *
//  * @param {*} data :: Fields to update rows in Db.
//  * @param {*} where :: DB filter
//  * @returns
//  */
// export const updateRow = async (data, where) => prismaService.updateRow(tableName, data, where)

// /**
//  *
//  * @param {*} where :: DB filter
//  * @returns
//  */
// export const deleteRow = async (where) => prismaService.deleteRow(tableName, where)
