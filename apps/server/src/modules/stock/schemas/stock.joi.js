import Joi from 'joi';

export const stockFiltersSchema = Joi.object({
  productId: Joi.string().allow('').optional(),
  warehouseId: Joi.string().allow('').optional(),
  lot: Joi.string().max(50).allow('').optional(),
  unitMeasure: Joi.string()
    .valid('PIECES', 'KILOGRAMS', 'LITERS', 'METERS')
    .allow('')
    .optional(),
  stocksExpirated: Joi.boolean().allow('').optional(),
  stocksLow: Joi.boolean().allow('').optional(),
});

export const stockCreateUpdateSchema = Joi.object({
  quantity: Joi.number().integer().min(0).required(),
  minimum: Joi.number().integer().min(0).required(),
  maximum: Joi.number().integer().min(0).allow(null),
  lot: Joi.string().max(50).allow(''),
  unitMeasure: Joi.string()
    .valid('PIECES', 'KILOGRAMS', 'LITERS', 'METERS')
    .required(),
  expirationDate: Joi.date().allow(null),
  productId: Joi.number().integer().required(),
  warehouseId: Joi.number().integer().required(),
});
