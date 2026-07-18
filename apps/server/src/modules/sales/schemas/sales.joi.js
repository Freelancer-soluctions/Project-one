import Joi from 'joi';

export const saleFiltersSchema = Joi.object({
  clientId: Joi.number().integer().optional().allow(''),
  fromDate: Joi.date().iso().optional().allow(''),
  toDate: Joi.date().iso().optional().allow(''),
  minTotal: Joi.number().min(0).optional().allow(''),
  maxTotal: Joi.number().min(0).optional().allow(''),
});

export const saleCreateSchema = Joi.object({
  clientId: Joi.number().integer().required(),
  total: Joi.number().min(0).required(),
  details: Joi.array()
    .items(
      Joi.object({
        productId: Joi.number().integer().required(),
        quantity: Joi.number().integer().min(1).required(),
        price: Joi.number().min(0).required(),
      })
    )
    .required()
    .min(1),
});

// Partial schema for PATCH requests (all fields optional)
export const saleUpdateSchema = Joi.object({
  clientId: Joi.number().integer().optional(),
  total: Joi.number().min(0).optional(),
  details: Joi.array()
    .items(
      Joi.object({
        productId: Joi.number().integer().optional(),
        quantity: Joi.number().integer().min(1).optional(),
        price: Joi.number().min(0).optional(),
      })
    )
    .optional()
    .min(1),
});