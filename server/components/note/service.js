import {
    createManyRows,
    createRow,
    deleteRow,
    getOneRow,
    getRows,
    updateRow
} from './dao.js';

import {
    handleUpload,
    handleUploadUpdate,
    handleDeleteFile
} from '../../utils/cloudinary/cloudinary.js';
/**
 * 
 * @returns All Rows from DB
 */
export const getAll = async () => {

    return getRows({});
}


/**
 * 
 * @returns One row filter by id
 */
export const getOneById = async (id) => {

    const rowId = Number(id)
    return getOneRow({ where: { id: rowId } });

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
    createdAt,
    closedAt,
    file }) => {

    const createData = {

        note,
        statusId: Number(statusId),
        createdBy: Number(createdBy),
        closedBy: Number(closedBy),
        createdAt: new Date(createdAt),
        closedAt: new Date(closedAt)

    }

    if (file) {
        const baseImage = Buffer.from(file.buffer).toString("base64");
        let imageURI = `data:${file.mimetype};base64,${baseImage}`;
        const { public_id, secure_url } = await handleUpload(imageURI);
        createData.document = secure_url;
        createData.documentId = public_id;

    }

    return createRow(createData);

}

/**
 * 
 * @param {*} data 
 * @returns Created Rows
 */
export const createMany = async (data) => {

    return createManyRows(data);

}
/**
 * 
 * @param {*} id :: rowId
 * @param {*} data :: 
 * @returns Updated row
 */
export const updateById = async (id, data) => {

    const rowId = Number(id);
    const { file, ...newsData } = data;

    if (file) {

        const { documentId } = await getOneById(rowId)
        const baseImage = Buffer.from(file.buffer).toString("base64");
        let imageURI = `data:${file.mimetype};base64,${baseImage}`;

        if (documentId) {

            await handleUploadUpdate(imageURI, documentId);

        } else {

            const { public_id, secure_url } = await handleUpload(imageURI);
            newsData.document = secure_url;
            newsData.documentId = public_id;

        }

    }
    return updateRow(newsData, { id: rowId });

}
/**
 * 
 * @param {*} id 
 * @returns Deleted row
 */
export const deleteById = async (id) => {

    const rowId = Number(id);
    const { documentId } = await getOneById(rowId)

    if (documentId) {

        await handleDeleteFile(documentId)

    }

    return deleteRow({ id: rowId });

}

