import Joi from 'joi';

/**
 * Validation schema for updating an existing provider order (partial update).
 * All fields are optional, but at least one field must be provided.
 * 
 * @property {number} [total] - Total order amount
 * @property {string} [status] - Order status (PENDING, PROCESSING, COMPLETED, CANCELLED)
 * @property {number} [supplierId] - Supplier ID
 * @property {string} [notes] - Order notes
 * @property {number} [updatedBy] - User ID who updated the order
 */
export const providerOrderUpdateSchema = Joi.object({
  total: Joi.number().integer().positive(),
  status: Joi.string().valid('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'),
  supplierId: Joi.number().integer().positive(),
  notes: Joi.string().max(2000),
  updatedBy: Joi.number().integer().positive(),
}).min(1).message('At least one field must be provided');