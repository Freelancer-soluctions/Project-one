import { getModel } from '../prisma/prisma-model.js';

/**
 * Get all items from db
 *@param {String} tableName
 * @returns all items from db
 */
export const getAll = async ({
  tableName,
  where,
  include,
  select,
}: {
  tableName: string;
  where?: Record<string, unknown>;
  include?: Record<string, boolean>;
  select?: Record<string, boolean>;
}) => {
  const items = await getModel(tableName).findMany({
    ...(where && { where }),
    ...(include && { include }),
    ...(select && { select }),
  });
  return Promise.resolve(items);
};

/**
 * Get Paginate items  from db
 *@param {String} tableName
 * @returns all items from db
 */
export const getAllPaginate = async ({
  tableName,
  where,
  page = 1,
  limit = 50,
  include,
}: {
  tableName: string;
  where?: Record<string, unknown>;
  page?: number;
  limit?: number;
  include?: Record<string, boolean>;
}) => {
  limit = limit || 50;
  const total = await getModel(tableName).count({
    ...(where && { where }),
  });
  const pages = Math.ceil(total / limit); // ROUND
  let currentPage = 1;

  if (page > pages && pages > 0) {
    currentPage = pages;
  } else if (page > 0) {
    currentPage = page;
  }
  const skip = (currentPage - 1) * limit;
  const items = await getModel(tableName).findMany({
    take: limit,
    skip,
    ...(where && { where }),
    ...(include && { include }),
  });
  return Promise.resolve({ items, currentPage, pages });
};

/**
 * Get one row
 *@param {String} tableName
 *@param {Number} id
 *
 * @returns One row by ID
 */
export const getOne = async ({
  tableName,
  where,
  include,
}: {
  tableName: string;
  where?: Record<string, unknown>;
  include?: Record<string, boolean>;
}) => {
  const foundObject = await getModel(tableName).findUnique({
    ...(where && { where }),
    ...(include && { include }),
  });
  return Promise.resolve(foundObject);
};

/**
 * Create a new row in the database
 * *@param {String} tableName
 * @param {object} createObject
 *
 */
export const create = async (tableName: string, createObject: object) => {
  const createdItem = await getModel(tableName).create({
    data: createObject,
  });
  return Promise.resolve(createdItem);
};

/**
 * Create  rows in bulk in the database
 * *@param {String} tableName
 * @param {object} createObjects
 *
 */
export const createMany = async (
  tableName: string,
  createObjects: object[]
) => {
  const createdObjects = await getModel(tableName).createMany({
    data: createObjects,
    skipDuplicates: true,
  });
  return Promise.resolve(createdObjects);
};

/**
 * update a row by id
 * @param {String} tableName
 * @param {object} updateObject
 * @param {String} slug
 *
 */
export const updateRowById = async (
  tableName: string,
  slug: string,
  updateObject: object
) => {
  const updatedObject = await getModel(tableName).update({
    where: {
      slug,
    },
    data: updateObject,
  });
  return Promise.resolve(updatedObject);
};

/**
 * delete a row by id
 * @param {String} tableName
 * @param {String} slug
 *
 */
export const deleteRowById = async (tableName: string, slug: string) => {
  const deletedObject = await getModel(tableName).delete({
    where: {
      slug,
    },
  });
  return Promise.resolve(deletedObject);
};
/**
 *
 * @param {*} item :: Object returned from BD
 * @param {*} keys :: fileds to exclude
 * @returnsdata item without excluded fields

 */
export const excludefromObject = (
  item: Record<string, unknown>,
  keys: string[]
) => {
  return Object.fromEntries(
    Object.entries(item).filter(([key]) => !keys.includes(key))
  );
};

/**
 *
 * @param {*} item :: Array returned from BD
 * @param {*} keys :: fileds to exclude
 * @returnsdata items without excluded fields

 */
export const excludefromArray = (
  items: Array<Record<string, unknown>>,
  keys: string[]
) => items.map((item) => excludefromObject(item, keys));
