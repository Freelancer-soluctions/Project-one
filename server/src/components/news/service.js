import * as newsDao from './dao.js'
import {
  handleUpload,
  handleUploadUpdate,
  handleDeleteFile
} from '../../utils/cloudinary/cloudinary.js'
import { NEWSSTATUSCODE } from '../utils/enums/enums.js'

/**
 * Get all news from the database with optional filters.
 *
 * @param {Object} params - The parameters for filtering the news.
 * @param {string} params.description - The description filter.
 * @param {Date} params.fromDate - The start date filter.
 * @param {Date} params.toDate - The end date filter.
 * @param {string} params.statusCode - The status code filter.
 * @returns {Promise<Array>} A list of news items matching the filters.
 */
export const getAllNews = async ({ description, fromDate, toDate, statusCode }) => {
  const data = await newsDao.getAllNews(description, fromDate, toDate, statusCode)
  return data
}

/**
 * Get one news item from the database by its ID.
 *
 * @param {number} id - The ID of the news item.
 * @returns {Promise<Object>} The news item matching the ID.
 */
export const getOneById = async (id) => {
  return newsDao.getOneRow({ where: { id } })
}

/**
 * Create a new news item in the database.
 *
 * @param {number} userId - The ID of the user creating the news.
 * @param {Object} data - The data for the new news item.
 * @param {string} data.description - The description of the news item.
 * @param {number} data.statusId - The ID of the status for the news item.
 * @param {string} data.statusCode - The status code of the news item.
 * @returns {Promise<Object>} The created news item.
 */
export const createOne = async (userId, data) => {
  const createData = {
    description: data.description,
    statusId: Number(data.statusId),
    createdBy: Number(userId),
    createdOn: new Date(),
    pendingBy: data.statusCode === NEWSSTATUSCODE.PENDING ? Number(userId) : null,
    pendingOn: data.statusCode === NEWSSTATUSCODE.PENDING ? new Date() : null
  }

  // if (file) {
  //   const baseImage = Buffer.from(file.buffer).toString('base64')
  //   const imageURI = `data:${file.mimetype};base64,${baseImage}`
  //   const { public_id, secure_url } = await handleUpload(imageURI)
  //   createData.document = secure_url
  //   createData.documentId = public_id
  // }

  return newsDao.createRow(createData)
}

/**
 * Update an existing news item in the database by its ID.
 *
 * @param {number} userId - The ID of the user updating the news.
 * @param {Object} data - The updated data for the news item.
 * @param {number} data.id - The ID of the news item to update.
 * @param {string} data.statusCode - The status code of the news item.
 * @returns {Promise<Object>} The updated news item.
 */
export const updateById = async (userId, newId, data) => {
  const rowId = Number(newId)

  if (data.statusCode === NEWSSTATUSCODE.CLOSED) {
    data.closedBy = Number(userId)
    data.closedOn = new Date()
  }

  if (data.statusCode === NEWSSTATUSCODE.PENDING) {
    data.pendingBy = Number(userId)
    data.pendingOn = new Date()
  }

  // if (data.document) {
  // const { documentId } = await getOneById(rowId)
  //   const baseImage = Buffer.from(file.buffer).toString('base64')
  //   const imageURI = `data:${file.mimetype};base64,${baseImage}`

  //   if (documentId) {
  //     await handleUploadUpdate(imageURI, documentId)
  //   } else {
  //     const { public_id, secure_url } = await handleUpload(imageURI)
  //     newsData.document = secure_url
  //     newsData.documentId = public_id
  //   }
  // }
  return newsDao.updateRow(data, { id: rowId })
}
/**
 * Delete a news item from the database by its ID.
 *
 * @param {number} id - The ID of the news item to delete.
 * @returns {Promise<Object>} The result of the deletion.
 */
export const deleteById = async (id) => {
  const rowId = Number(id)
  // const { documentId } = await getOneById(rowId)

  // if (documentId) {
  //   await handleDeleteFile(documentId)
  // }

  return newsDao.deleteRow({ id: rowId })
}

/**
 * Get all available news statuses from the database.
 *
 * @returns {Promise<Array>} A list of all news statuses.
 */

export const getAllNewsStatus = async () => {
  const data = await newsDao.getAllNewsStatus()
  return data
}
