import Joi from 'joi'
// Removing unused import
// import { orderStatus } from '../../utils/enums/enums.js'

/**
 * @openapi
 * components:
 *   schemas:
 *     ProviderOrderCreate:
 *       type: object
 *       required:
 *         - supplierId
 *       properties:
 *         supplierId:
 *           type: integer
 *           description: ID of the supplier.
 *         notes:
 *           type: string
 *           description: Notes for the provider order.
 *     ProviderOrderUpdate:
 *       type: object
 *       properties:
 *         supplierId:
 *           type: integer
 *           description: ID of the supplier.
 *         notes:
 *           type: string
 *           description: Notes for the provider order.
 */

export const validateCreateProviderOrder = (req, res, next) => {
  const schema = Joi.object({
    supplierId: Joi.number().integer().required(),
    notes: Joi.string().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};

export const validateUpdateProviderOrder = (req, res, next) => {
  const schema = Joi.object({
    supplierId: Joi.number().integer().optional(),
    notes: Joi.string().optional()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }
  next();
};