import Joi from 'joi';

export const permissionFiltersSchema = Joi.object({
  employeeId: Joi.number().integer().optional(),
  type: Joi.string()
    .valid('SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'OTHER')
    .optional()
    .allow(''),
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').optional(),
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().min(Joi.ref('fromDate')).optional(),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});

export const permissionCreateUpdateSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  type: Joi.string()
    .valid('SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'OTHER')
    .required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  reason: Joi.string().max(500).required(),
  status: Joi.string()
    .valid('PENDING', 'APPROVED', 'REJECTED')
    .default('PENDING'),
  approvedBy: Joi.number().integer().optional(),
  approvedAt: Joi.date().iso().optional(),
  comments: Joi.string().max(1000).optional(),
});
