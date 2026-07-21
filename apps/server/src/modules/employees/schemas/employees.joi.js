import Joi from 'joi';

export const employeeFiltersSchema = Joi.object({
  name: Joi.string().max(100).allow(''),
  lastName: Joi.string().max(100).allow(''),
  dni: Joi.string().max(10).allow(''),
  email: Joi.string().email().allow(''),
  department: Joi.string().max(100).allow(''),
  position: Joi.string().max(100).allow(''),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});

export const employeeCreateSchema = Joi.object({
  name: Joi.string().max(100).required(),
  lastName: Joi.string().max(100).required(),
  dni: Joi.string().max(10).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().max(15).allow(''),
  address: Joi.string().max(120).allow(''),
  startDate: Joi.date().required(),
  position: Joi.string().max(100).required(),
  department: Joi.string().max(100).required(),
  salary: Joi.number().precision(2).positive().required(),
});

export const employeeUpdateSchema = Joi.object({
  name: Joi.string().max(100).optional().min(1),
  lastName: Joi.string().max(100).optional().min(1),
  dni: Joi.string().max(10).optional().min(1),
  email: Joi.string().email().optional().min(1),
  phone: Joi.string().max(15).optional().min(1),
  address: Joi.string().max(120).optional().min(1),
  startDate: Joi.date().optional(),
  position: Joi.string().max(100).optional().min(1),
  department: Joi.string().max(100).optional().min(1),
  salary: Joi.number().precision(2).positive().optional(),
});
