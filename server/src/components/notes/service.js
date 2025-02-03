import * as notesDao from './dao.js'

/**
 * Get all notes from the database with optional filters.
 *
 * @param {Object} params - The parameters for filtering the news.
 * @param {string} params.description - The description filter.
 * @returns {Promise<Array>} A list of news items matching the filters.
 */
export const getAllNotes = async ({ description }) => {
  const data = await notesDao.getAllNotes(description)
  return data
}

/**
 * Create a new notes item in the database.
 *
 * @param {Object} data - The data for the new notes item.
 * @param {number} data.createdBy - The ID of the user creating the notes.
 * @param {string} data.title - The description of the notes item.
 * @param {string} data.content - The description of the notes item.
 * @param {string} data.color - The description of the notes item.
 * @param {number} data.columnId - The ID of the status for the notes item.
 * @returns {Promise<Object>} The created notes item.
 */
export const createNote = async (data) => {
  const createData = {
    title: data.title,
    content: data.content,
    color: data.color,
    columnId: Number(data.columnId),
    createdBy: Number(data.createdBy),
    createdOn: new Date()
  }

  return notesDao.createNote(createData)
}

// /**
//  *
//  * @returns One row filter by id
//  */
// export const getOneById = async (id) => {
//   const rowId = Number(id)
//   return getOneRow({ where: { id: rowId } })
// }

// /**
//  *
//  * @param {*} data
//  * @returns Created Row
//  */
// export const createOne = async ({
//   note,
//   statusId,
//   createdBy,
//   closedBy,
//   createdOn,
//   closedOn,
//   file
// }) => {
//   const createData = {

//     note,
//     statusId: Number(statusId),
//     createdBy: Number(createdBy),
//     closedBy: Number(closedBy),
//     createdOn: new Date(createdOn),
//     closedOn: new Date(closedOn)

//   }

//   if (file) {
//     const baseImage = Buffer.from(file.buffer).toString('base64')
//     const imageURI = `data:${file.mimetype};base64,${baseImage}`
//     const { public_id, secure_url } = await handleUpload(imageURI)
//     createData.document = secure_url
//     createData.documentId = public_id
//   }

//   return createRow(createData)
// }

// /**
//  *
//  * @param {*} data
//  * @returns Created Rows
//  */
// export const createMany = async (data) => {
//   return createManyRows(data)
// }
// /**
//  *
//  * @param {*} id :: rowId
//  * @param {*} data ::
//  * @returns Updated row
//  */
// export const updateById = async (id, data) => {
//   const rowId = Number(id)
//   const {
//     note,
//     statusId,
//     createdBy,
//     closedBy,
//     createdOn,
//     closedOn,
//     file
//   } = data

//   const updateData = {

//     note,
//     statusId: Number(statusId),
//     createdBy: Number(createdBy),
//     closedBy: Number(closedBy),
//     createdOn: new Date(createdOn),
//     closedOn: new Date(closedOn)

//   }
//   if (file) {
//     const { documentId } = await getOneById(rowId)
//     const baseImage = Buffer.from(file.buffer).toString('base64')
//     const imageURI = `data:${file.mimetype};base64,${baseImage}`

//     if (documentId) {
//       await handleUploadUpdate(imageURI, documentId)
//     } else {
//       const { public_id, secure_url } = await handleUpload(imageURI)
//       updateData.document = secure_url
//       updateData.documentId = public_id
//     }
//   }
//   return updateRow(updateData, { id: rowId })
// }
// /**
//  *
//  * @param {*} id
//  * @returns Deleted row
//  */
// export const deleteById = async (id) => {
//   const rowId = Number(id)
//   const { documentId } = await getOneById(rowId)

//   if (documentId) {
//     await handleDeleteFile(documentId)
//   }

//   return deleteRow({ id: rowId })
// }
