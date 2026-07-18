import Joi from 'joi';

export const payrollFiltersSchema = Joi.object({
  employeeId: Joi.number().integer().allow(''),
  month: Joi.number().integer().min(1).max(12).allow(''),
  year: Joi.number().integer().min(1900).max(2100).allow(''),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});

export const payrollCreateSchema = Joi.object({
   employeeId: Joi.number().integer().required(),
   month: Joi.number().integer().min(1).max(12).required(),
   year: Joi.number().integer().min(1900).max(2100).required(),
   baseSalary: Joi.number().precision(2).positive().required(),
   extraHours: Joi.number().precision(2).min(0).required(),
   deductions: Joi.number().precision(2).min(0).required(),
   totalPayment: Joi.number().precision(2).positive().required(),
});

export const payrollUpdateSchema = Joi.object({
   employeeId: Joi.number().integer().min(1),
   month: Joi.number().integer().min(1).max(12),
   year: Joi.number().integer().min(1900).max(2100),
   baseSalary: Joi.number().precision(2).min(1),
   extraHours: Joi.number().precision(2).min(0),
   deductions: Joi.number().precision(2).min(0),
   totalPayment: Joi.number().precision(2).min(1),
}).min(1);
