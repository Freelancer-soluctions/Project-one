import Joi from 'joi';

export const ProductsCreate = Joi.object({
  sku: Joi.string().max(16).required(),
  name: Joi.string().max(80).required(),
  productCategoryId: Joi.number().integer().required(),
  productProviderId: Joi.number().integer().required(),
  price: Joi.number().precision(2).positive().required(),
  cost: Joi.number().precision(2).positive().required(),
  description: Joi.string().max(2000).allow(null, ''),
  productStatusId: Joi.number().integer().required(),
  barCode: Joi.string().max(25).allow(null, ''),
});

export const ProductsFilters = Joi.object({
  name: Joi.string().min(1).max(80).allow(''),
  statusCode: Joi.string().min(3).max(3).allow(''),
  productProviderCode: Joi.string().min(3).max(3).allow(''),
  productCategoryCode: Joi.string().min(3).max(3).allow(''),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});

export const ProductsUpdate = Joi.object({
  sku: Joi.string().max(16).optional().min(1),
  name: Joi.string().max(80).optional().min(1),
  productCategoryId: Joi.number().integer().optional(),
  productProviderId: Joi.number().integer().optional(),
  price: Joi.number().precision(2).positive().optional(),
  cost: Joi.number().precision(2).positive().optional(),
  description: Joi.string().max(2000).optional().allow(null, ''),
  productStatusId: Joi.number().integer().optional(),
  barCode: Joi.string().max(25).optional().allow(null, ''),
});

export const ProductAttributes = Joi.array().items(
  Joi.object({
    id: Joi.number().integer().optional(),
    name: Joi.string().max(50).required(),
    description: Joi.string().max(50).required(),
    createdOn: Joi.date().required(),
    productId: Joi.number().integer().required(),
  })
);
