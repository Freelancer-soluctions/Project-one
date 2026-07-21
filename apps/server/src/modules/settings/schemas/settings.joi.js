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

export const SettingsProductCategoryFilters = Joi.object({
  description: Joi.string().max(50).allow(''),
  code: Joi.string().max(3).allow(''),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});

// Partial schemas for PATCH (all optional + string min(1))
export const SettingsLanguagePartial = Joi.object({
  id: Joi.number().integer().optional(),
  language: Joi.string().valid('es', 'en').optional().min(1),
});

export const SettingsDisplayPartial = Joi.object({
  id: Joi.number().integer().optional(),
  displayOptions: Joi.object({
    displayEvents: Joi.boolean().optional(),
    displayNotes: Joi.boolean().optional(),
    displayNews: Joi.boolean().optional(),
    displayProfile: Joi.boolean().optional(),
    displayLanguage: Joi.boolean().optional(),
    displayReports: Joi.boolean().optional(),
    displayPayroll: Joi.boolean().optional(),
    displayStock: Joi.boolean().optional(),
  }).optional(),
});

export const SettingsProductCategoryCreatePartial = Joi.object({
  code: Joi.string().max(3).optional().min(1),
  description: Joi.string().max(50).optional().min(1),
});

export const SettingsProductCategoryUpdateSchema = Joi.object({
  description: Joi.string().max(50).optional().min(1),
  code: Joi.string().max(3).optional().min(1),
});

export const SettingsProductCategoryFiltersPartial = Joi.object({
  description: Joi.string().max(50).optional().min(1),
  code: Joi.string().max(3).optional().min(1),
  limit: Joi.number().integer().optional(),
  page: Joi.number().integer().optional(),
});

// Schema for PATCH /:id (settings by userId)
export const SettingsUpdate = Joi.object({
  language: Joi.string().valid('es', 'en').optional().min(1),
  displayOptions: Joi.object({
    displayEvents: Joi.boolean().optional(),
    displayNotes: Joi.boolean().optional(),
    displayNews: Joi.boolean().optional(),
    displayProfile: Joi.boolean().optional(),
    displayLanguage: Joi.boolean().optional(),
    displayReports: Joi.boolean().optional(),
    displayPayroll: Joi.boolean().optional(),
    displayStock: Joi.boolean().optional(),
  }).optional(),
});