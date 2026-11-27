import Joi from 'joi';

const PAYMENT_METHODS = ['CASH', 'CARD', 'TRANSFER', 'OTHER'] as const;
const PURCHASE_STATUSES = ['PENDING', 'RECEIVED', 'PAID', 'CANCELLED'] as const;

export const purchaseCreateSchema = Joi.object({
  providerId: Joi.number().integer().required(),
  total: Joi.number().min(0).required(),
  // `status` is intentionally absent: every new purchase starts PENDING and
  // only advances through `PATCH /purchases/:id/status`.
  paymentMethod: Joi.string()
    .valid(...PAYMENT_METHODS)
    .optional()
    .allow(null),
  invoiceNumber: Joi.string().max(50).optional().allow(null),
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

export const purchaseUpdateSchema = Joi.object({
  providerId: Joi.number().integer().optional(),
  total: Joi.number().min(0).optional(),
  paymentMethod: Joi.string()
    .valid(...PAYMENT_METHODS)
    .optional()
    .allow(null),
  invoiceNumber: Joi.string().max(50).optional().allow(null),
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

export const purchaseFiltersSchema = Joi.object({
  providerId: Joi.number().integer().optional().allow(''),
  status: Joi.string()
    .valid(...PURCHASE_STATUSES)
    .optional()
    .allow(''),
  startDate: Joi.date().iso().optional().allow(''),
  endDate: Joi.date().iso().optional().allow(''),
  minTotal: Joi.number().min(0).optional(),
  maxTotal: Joi.number().min(0).optional(),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});

// Lifecycle transition body for `PATCH /purchases/:id/status`.
export const purchaseStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...PURCHASE_STATUSES)
    .required(),
  paymentMethod: Joi.string()
    .valid(...PAYMENT_METHODS)
    .optional()
    .allow(null),
  invoiceNumber: Joi.string().max(50).optional().allow(null),
});
