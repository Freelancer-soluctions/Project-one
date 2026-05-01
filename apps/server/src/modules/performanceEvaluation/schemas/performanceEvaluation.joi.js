import Joi from 'joi';

export const performanceEvaluationFiltersSchema = Joi.object({
  employeeId: Joi.number().integer().optional(),
  fromDate: Joi.date().allow(''),
  toDate: Joi.date().allow(''),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});

export const performanceEvaluationCreateUpdateSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  date: Joi.date().iso().required(),
  calification: Joi.number().integer().min(1).max(10).required(),
  comments: Joi.string().max(200).optional().allow(''),
});
