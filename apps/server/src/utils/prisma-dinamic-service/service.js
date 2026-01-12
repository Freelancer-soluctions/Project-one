import { prisma } from '../config/db.js';

/**
 * Get all items from db
 *@param {String} tableName
 * @returns all items from db
 */
export const getAll = async ({ tableName, where, include, select }) => {
  const items = await prisma[tableName].findMany({
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
}) => {
  limit = limit || 50;
  const total = await prisma[tableName].count({
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
  const items = await prisma[tableName].findMany({
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
export const getOne = async ({ tableName, where, include }) => {
  const foundObject = await prisma[tableName].findUnique({
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
export const create = async (tableName, createObject) => {
  const createdItem = await prisma[tableName].create({
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
export const createMany = async (tableName, createObjects) => {
  const createdObjects = await prisma[tableName].createMany({
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
export const updateRowById = async (tableName, slug, updateObject) => {
  const updatedObject = await prisma[tableName].update({
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
export const deleteRowById = async (tableName, slug) => {
  const deletedObject = await prisma[tableName].delete({
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
export const excludefromObject = (item, keys) => {
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
export const excludefromArray = (items, keys) =>
  items.map((item) => excludefromObject(item, keys));
