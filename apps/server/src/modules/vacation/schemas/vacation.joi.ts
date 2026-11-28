import Joi from 'joi';

export const vacationFiltersSchema = Joi.object({
  employeeId: Joi.number().integer().allow(''),
  status: Joi.string()
    .valid('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')
    .allow(''),
  fromDate: Joi.date().allow(''),
  toDate: Joi.date().allow(''),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});

// Campos de trazabilidad (approvedBy/approvedAt/rejectedBy/rejectedAt) NO aparecen
// aquí: Joi con unknown keys desactivado rechaza cualquier intento de forjarlos (RN-VP-003).
export const vacationCreateSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  status: Joi.string()
    .valid('PENDING', 'APPROVED', 'REJECTED')
    .default('PENDING'),
  reason: Joi.string().max(500).allow('', null),
  comments: Joi.string().max(1000).allow('', null),
  paid: Joi.boolean().default(true),
});

export const vacationUpdateSchema = Joi.object({
  employeeId: Joi.number().integer().min(1).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  status: Joi.string()
    .valid('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')
    .optional(),
  reason: Joi.string().max(500).allow('', null).optional(),
  comments: Joi.string().max(1000).allow('', null).optional(),
  paid: Joi.boolean().optional(),
});

export const vacationAccrualSchema = Joi.object({
  period: Joi.string()
    .pattern(/^\d{4}-(0[1-9]|1[0-2])$/)
    .required(),
});

export const vacationBalanceQuerySchema = Joi.object({
  employeeId: Joi.number().integer().min(1).required(),
  year: Joi.number().integer().min(2000).max(2100).required(),
});
