import Joi from 'joi';

const PAYMENT_METHODS = ['CASH', 'CARD', 'TRANSFER', 'OTHER'] as const;
const SALE_STATUSES = ['PENDING', 'PAID', 'CANCELLED', 'REFUNDED'] as const;

export const saleFiltersSchema = Joi.object({
  clientId: Joi.number().integer().optional().allow(''),
  status: Joi.string()
    .valid(...SALE_STATUSES)
    .optional()
    .allow(''),
  startDate: Joi.date().iso().optional().allow(''),
  endDate: Joi.date().iso().optional().allow(''),
  minTotal: Joi.number().min(0).optional().allow(''),
  maxTotal: Joi.number().min(0).optional().allow(''),
  // La lista es paginada: el cliente siempre envía page/limit y el middleware
  // de query usa `allowUnknown: false`, así que deben declararse aquí.
  page: Joi.number().integer(),
  limit: Joi.number().integer(),
});

export const saleCreateSchema = Joi.object({
  clientId: Joi.number().integer().required(),
  total: Joi.number().min(0).required(),
  // `status` is intentionally absent: every new sale starts PENDING and only
  // advances through `PATCH /sales/:id/status`.
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

// Partial schema for PATCH requests (all fields optional)
export const saleUpdateSchema = Joi.object({
  clientId: Joi.number().integer().optional(),
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

// Lifecycle transition body for `PATCH /sales/:id/status`.
export const saleStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...SALE_STATUSES)
    .required(),
  paymentMethod: Joi.string()
    .valid(...PAYMENT_METHODS)
    .optional()
    .allow(null),
  invoiceNumber: Joi.string().max(50).optional().allow(null),
});
