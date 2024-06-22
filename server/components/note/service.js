import {
  createManyRows,
  createRow,
  deleteRow,
  getOneRow,
  getRows,
  updateRow
} from './dao.js'

import {
  handleUpload,
  handleUploadUpdate,
  handleDeleteFile
} from '../../utils/cloudinary/cloudinary.js'
/**
 *
 * @returns All Rows from DB
 */
export const getAll = async () => {
  return getRows({
    include: {
      status: true,
      userNoteClosed: true,
      userNoteCreated: true
    }
  })
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
 * @param {*} data
 * @returns Created Row
 */
export const createOne = async ({
  note,
  statusId,
  createdBy,
  closedBy,
  createdOn,
  closedOn,
  file
}) => {
  const createData = {

    note,
    statusId: Number(statusId),
    createdBy: Number(createdBy),
    closedBy: Number(closedBy),
    createdOn: new Date(createdOn),
    closedOn: new Date(closedOn)

  }

  if (file) {
    const baseImage = Buffer.from(file.buffer).toString('base64')
    const imageURI = `data:${file.mimetype};base64,${baseImage}`
    const { public_id, secure_url } = await handleUpload(imageURI)
    createData.document = secure_url
    createData.documentId = public_id
  }

  return createRow(createData)
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
  const {
    note,
    statusId,
    createdBy,
    closedBy,
    createdOn,
    closedOn,
    file
  } = data

  const updateData = {

    note,
    statusId: Number(statusId),
    createdBy: Number(createdBy),
    closedBy: Number(closedBy),
    createdOn: new Date(createdOn),
    closedOn: new Date(closedOn)

  }
  if (file) {
    const { documentId } = await getOneById(rowId)
    const baseImage = Buffer.from(file.buffer).toString('base64')
    const imageURI = `data:${file.mimetype};base64,${baseImage}`

    if (documentId) {
      await handleUploadUpdate(imageURI, documentId)
    } else {
      const { public_id, secure_url } = await handleUpload(imageURI)
      updateData.document = secure_url
      updateData.documentId = public_id
    }
  }
  return updateRow(updateData, { id: rowId })
}
/**
 *
 * @param {*} id
 * @returns Deleted row
 */
export const deleteById = async (id) => {
  const rowId = Number(id)
  const { documentId } = await getOneById(rowId)

  if (documentId) {
    await handleDeleteFile(documentId)
  }

  return deleteRow({ id: rowId })
}
