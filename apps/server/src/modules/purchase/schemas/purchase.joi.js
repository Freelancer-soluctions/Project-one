import Joi from 'joi';

export const purchaseCreateUpdateSchema = Joi.object({
  providerId: Joi.number().integer().required(),
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

export const purchaseFiltersSchema = Joi.object({
  providerId: Joi.number().integer().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  minTotal: Joi.number().min(0).optional(),
  maxTotal: Joi.number().min(0).optional(),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});
