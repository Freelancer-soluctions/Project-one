import Joi from 'joi';

export const SettingsLanguage = Joi.object({
  id: Joi.number().integer().optional(),
  language: Joi.string().valid('es', 'en').required(),
});

export const SettingsDisplay = Joi.object({
  id: Joi.number().integer().optional(),
  displayOptions: Joi.object({
    displayEvents: Joi.boolean().required(),
    displayNotes: Joi.boolean().required(),
    displayNews: Joi.boolean().required(),
    displayProfile: Joi.boolean().required(),
    displayLanguage: Joi.boolean().required(),
    displayReports: Joi.boolean().required(),
    displayPayroll: Joi.boolean().required(),
    displayStock: Joi.boolean().required(),
  }),
});

export const SettingsProductCategoryCreate = Joi.object({
  code: Joi.string().max(3).required(),
  description: Joi.string().max(50).required(),
});

export const SettingsProductCategoryUpdate = Joi.object({
  description: Joi.string().max(50).allow(''),
  code: Joi.string().max(3).allow(''),
});

export const SettingsProductCategoryFilters = Joi.object({
  description: Joi.string().max(50).allow(''),
  code: Joi.string().max(3).allow(''),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});
