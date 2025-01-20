import * as newsDao from './dao.js'

import {
  handleUpload,
  handleUploadUpdate,
  handleDeleteFile
} from '../../utils/cloudinary/cloudinary.js'
import { NewsStatusCode } from '../utils/enums/enums.js'

/**
 *
 * @param {string} description
 * @param {string} statusCode
 * @param {Date} toDate
 * @param {Date} fromDate
 * @returns all news from db
 */
export const getAllNews = async ({ description, fromDate, toDate, statusCode }) => {
  const data = await newsDao.getAllNews(description, fromDate, toDate, statusCode)
  return data
}

/**
 *
 * @returns One row filter by id
 */
export const getOneById = async (id) => {
  return newsDao.getOneRow({ where: { id } })
}

/**
 *
 * @param {*} data
 * @returns Created Row
 */
export const createOne = async (userId, data) => {
  const createData = {
    description: data.description,
    statusId: Number(data.statusId),
    createdBy: Number(userId),
    createdOn: new Date(),
    pendingBy: data.statusCode === NewsStatusCode.PENDING ? Number(userId) : null,
    pendingOn: data.statusCode === NewsStatusCode.PENDING ? new Date() : null
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
 *
 * @param {*} data
 * @returns Created Rows
 */
export const createMany = async (data) => {
  return newsDao.createManyRows(data)
}
/**
 *
 * @param {*} userId :: userId
 * @param {*} data ::
 * @returns Updated row
 */
export const updateById = async (userId, data) => {
  const { id, ...dataWithoutId } = data
  const rowId = Number(id)

  if (dataWithoutId.statusCode === NewsStatusCode.CLOSED) {
    dataWithoutId.closedBy = Number(userId)
    dataWithoutId.closedOn = new Date()
  }

  if (dataWithoutId.statusCode === NewsStatusCode.PENDING) {
    dataWithoutId.pendingBy = Number(userId)
    dataWithoutId.pendingOn = new Date()
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
  return newsDao.updateRow(dataWithoutId, { id: rowId })
}
/**
 *
 * @param {*} id
 * @returns Deleted row
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
 *
 * @returns All news status list
 */
export const getAllNewsStatus = async () => {
  const data = await newsDao.getAllNewsStatus()
  return data
}
