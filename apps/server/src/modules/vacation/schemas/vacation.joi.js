import Joi from 'joi';

export const vacationFiltersSchema = Joi.object({
  employeeId: Joi.number().integer().allow(''),
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').allow(''),
  fromDate: Joi.date().allow(''),
  toDate: Joi.date().allow(''),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});

export const vacationCreateSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  status: Joi.string()
    .valid('PENDING', 'APPROVED', 'REJECTED')
    .default('PENDING'),
});

export const vacationUpdateSchema = Joi.object({
  employeeId: Joi.number().integer().min(1).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').optional(),
});
