import * as prismaService from '../../utils/prisma/dao.js';
import { TABLESNAMES } from '../../utils/constants/enums.js';
import { prisma, Prisma } from '../../config/db.js';

const tableName = TABLESNAMES.PRODUCTS;
const tableName2 = TABLESNAMES.PRODUCTATTRIBUTES;
/**
 * Get all products with optional filters.
 *
 * @param {string} name - The name to filter products by (optional).
 * @param {string} productProviderCode - The product provider code filter (optional).
 * @param {string} productCategoryCode - The product category code filter (optional).
 * @param {string} statusCode - The status code to filter products by (optional).
 * @param {number} take - Number of records to retrieve.
 * @param {number} skip - Number of records to skip.
 * @returns {Promise<Object>} Object containing dataList and total count.
 */

export const getAllProducts = async (
  name,
  productProviderCode,
  productCategoryCode,
  statusCode,
  take,
  skip
) => {
  const whereClauses = [];

  if (name) {
    whereClauses.push(Prisma.sql`p."name" ILIKE ${'%' + name + '%'}`);
  }
  if (productProviderCode) {
    whereClauses.push(
      Prisma.sql`p."productProviderCode" = ${productProviderCode}`
    );
  }
  if (productCategoryCode) {
    whereClauses.push(
      Prisma.sql`p."productCategoryCode" = ${productCategoryCode}`
    );
  }
  if (statusCode) {
    whereClauses.push(Prisma.sql`p."statusCode" = ${statusCode}`);
  }

  const whereSql = whereClauses.length
    ? Prisma.sql`WHERE ${Prisma.join(whereClauses, Prisma.sql` AND `)}`
    : Prisma.empty;

  const products = await prisma.$queryRaw`
    SELECT p.*, 
    pc.id AS "categoryId", 
    pc.code AS "categoryCode",     
    pc.description AS "categoryDescription",

    pt.id AS "providerId", 
    pt.code AS "providerCode",     
    pt.name AS "providerDescription",

    ps.id AS "statusId", 
    ps.code AS "statusCode", 
    ps.description AS "statusDescription",
    u.name AS "userProductCreatedName",
    uu.name AS "userProductUpdatedName"
    FROM "products" p
    LEFT JOIN "productCategories" pc ON p."productCategoryId" = pc.id
    LEFT JOIN "productProviders" pt ON p."productProviderId" = pt.id
    LEFT JOIN "productStatus" ps ON p."productStatusId" = ps.id
    LEFT JOIN "users" u ON p."createdBy" = u.id
    LEFT JOIN "users" uu ON p."updatedBy" = uu.id
    ${whereSql}
    ORDER BY p."createdOn" DESC
    LIMIT ${take}
    OFFSET ${skip}

  `;
  const total = await prisma.products.count({
    where: {
      ...(name && {
        name: {
          contains: name,
          mode: 'insensitive', // equivale a ILIKE
        },
      }),

      ...(productProviderCode && {
        productProviderCode,
      }),

      ...(productCategoryCode && {
        productCategoryCode,
      }),

      ...(statusCode && {
        statusCode,
      }),
    },
  });

  return { dataList: products, total };
};

/**
 * Get all products for UI filters.
 *
 * @returns {Promise<Array>} List of all products.
 */
export const getAllProductsFilters = async () => {
  return await prisma.products.findMany();
};

/**
 * Get all available product statuses.
 *
 * @returns {Promise<Array>} List of product statuses.
 */

export const getAllProductStatus = async () => {
  const products = await prisma.productStatus.findMany();
  return Promise.resolve(products);
};

/**
 * Get all available product categories.
 *
 * @returns {Promise<Array>} List of product categories.
 */
export const getAllProductCategories = async () => {
  const products = await prisma.productCategories.findMany();
  return Promise.resolve(products);
};

/**
 * Get all available product providers.
 *
 * @returns {Promise<Array>} List of product providers.
 */
export const getAllProductProviders = async () => {
  const products = await prisma.productProviders.findMany();
  return Promise.resolve(products);
};

/**
 * Create a new product.
 *
 * @param {Object} data - The data for the new product.
 * @param {string} data.sku - The unique SKU of the product (max 16 characters).
 * @param {string} data.name - The name of the product (max 80 characters).
 * @param {number} data.productCategoryId - The ID of the product category.
 * @param {number} data.productProviderId - The ID of the product provider.
 * @param {number} data.price - The price of the product (decimal with 2 decimal places).
 * @param {number} data.cost - The cost of the product (decimal with 2 decimal places).
 * @param {string} data.description - The product description (max 2000 characters).
 * @param {string} [data.barCode] - The optional barcode of the product (max 25 characters).
 * @param {string} data.createdOn - The creation timestamp.
 * @param {number} data.createdBy - The ID of the user creating the product.
 * @returns {Promise<Object>} The created product.
 */
export const createRow = async (data) => {
  const savedProduct = await prisma.products.create({
    data: {
      sku: data.sku,
      name: data.name,
      price: data.price,
      cost: data.cost,
      description: data.description,
      barCode: data.barCode,
      createdOn: data.createdOn,

      // Claves foráneas
      productCategories: {
        connect: { id: data.productCategoryId },
      },
      productProviders: {
        connect: { id: data.productProviderId },
      },
      productStatus: {
        connect: { id: data.productStatusId },
      },
      userProductCreated: {
        connect: {
          id: data.createdBy,
        },
      },
    },
  });
  return Promise.resolve(savedProduct);
};

/**
 * Update a product by conditions.
 *
 * @param {Object} data - The updated data for the product.
 * @param {string} [data.sku] - The updated SKU (max 16 characters).
 * @param {string} [data.name] - The updated name (max 80 characters).
 * @param {number} [data.productCategoryId] - The updated product category ID.
 * @param {number} [data.productProviderId] - The updated product provider ID.
 * @param {number} [data.price] - The updated price (decimal with 2 decimal places).
 * @param {number} [data.cost] - The updated cost (decimal with 2 decimal places).
 * @param {string} [data.description] - The updated product description (max 2000 characters).
 * @param {string} [data.barCode] - The updated barcode (max 25 characters).
 * @param {string} data.updatedOn - The update timestamp.
 * @param {number} data.updatedBy - The ID of the user updating the product.
 * @param {Object} where - The conditions to identify the product to update.
 * @returns {Promise<Object>} The updated product.
 */
export const updateRow = async (data, where) => {
  const result = await prisma.products.update({
    where,
    data: {
      sku: data.sku,
      name: data.name,
      price: data.price,
      cost: data.cost,
      description: data.description,
      barCode: data.barCode,
      updatedOn: data.updatedOn,

      // Claves foráneas
      productCategories: {
        connect: { id: data.productCategoryId },
      },
      productProviders: {
        connect: { id: data.productProviderId },
      },
      productStatus: {
        connect: { id: data.productStatusId },
      },
      userProductUpdated: {
        connect: {
          id: data.updatedBy,
        },
      },
    },
  });
  return Promise.resolve(result);
};

/**
 * Delete a product by conditions.
 *
 * @param {Object} where - The conditions to identify the product to delete.
 * @returns {Promise<Object>} The deleted product.
 */
export const deleteRow = async (where) =>
  prismaService.deleteRow(tableName, where);

/**
 * Get all attributes for a product by conditions.
 *
 * @param {Object} where - The conditions to filter product attributes.
 * @returns {Promise<Array>} List of attributes for the specified product.
 */

export const getAllProductAttributesByProductId = async (where) => {
  const attributes = await prisma.productAttributes.findMany({
    where,
  });

  return Promise.resolve(attributes);
};

/**
 * Save or update product attributes.
 *
 * @param {Array} attributes - List of attributes to save or update.
 * @param {number} [attributes[].id] - The attribute ID (if exists, it will be updated; if not, a new one will be created).
 * @param {number} attributes[].productId - The product ID the attribute belongs to.
 * @param {string} attributes[].name - The attribute name.
 * @param {string} attributes[].description - The attribute description.
 * @returns {Promise<Array>} The saved or updated attributes.
 */
export const saveProductAttributes = async (attributes) => {
  const transaction = attributes.map((attr) => {
    if (attr.id) {
      // Si el atributo tiene ID, actualizarlo
      return prisma.productAttributes.update({
        where: { id: attr.id },
        data: {
          name: attr.name,
          description: attr.description,
        },
      });
    } else {
      // Si no tiene ID, crearlo
      return prisma.productAttributes.create({
        data: {
          productId: attr.productId,
          name: attr.name,
          description: attr.description,
          createdOn: attr.createdOn,
        },
      });
    }
  });

  // Ejecutar todo en una transacción
  return prisma.$transaction(transaction);
};

/**
 * Delete a product attribute by conditions.
 *
 * @param {Object} where - The conditions to identify the attribute to delete.
 * @returns {Promise<Object>} The deleted attribute.
 */
export const deleteProductsAttributeById = async (where) =>
  prismaService.deleteRow(tableName2, where);
