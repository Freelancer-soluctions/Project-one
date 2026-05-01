import Joi from 'joi';

// Inventory Movement Schemas
export const inventoryMovementFiltersSchema = Joi.object({
  productId: Joi.number().integer().positive().optional(),
  warehouseId: Joi.number().integer().positive().optional(),
  type: Joi.string()
    .valid('ENTRY', 'EXIT', 'TRANSFERENCE', 'ADJUSTMENT')
    .optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});

export const inventoryMovementCreateUpdateSchema = Joi.object({
  productId: Joi.number().integer().positive().required(),
  warehouseId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().required(),
  type: Joi.string()
    .valid('ENTRY', 'EXIT', 'TRANSFERENCE', 'ADJUSTMENT')
    .required(),
  reason: Joi.string().max(200).optional(),
  purchaseId: Joi.number().integer().positive().optional(),
  saleId: Joi.number().integer().positive().optional(),
});
