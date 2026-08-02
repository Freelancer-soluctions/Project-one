import Joi from 'joi';

export const attendanceFiltersSchema = Joi.object({
  employeeId: Joi.number().integer().allow(''),
  fromDate: Joi.date().allow(''),
  toDate: Joi.date().allow(''),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});

export const attendanceCreateSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  date: Joi.date().required(),
  entryTime: Joi.string().max(5).required(),
  exitTime: Joi.string().max(5).required(),
  workedHours: Joi.number().precision(2).positive().required(),
});

// Partial update schema for PATCH requests
export const attendanceUpdateSchema = Joi.object({
  employeeId: Joi.number().integer().optional(),
  date: Joi.date().optional(),
  entryTime: Joi.string().max(5).optional(),
  exitTime: Joi.string().max(5).optional(),
  workedHours: Joi.number().precision(2).positive().optional(),
}).min(1); // At least one field must be present
