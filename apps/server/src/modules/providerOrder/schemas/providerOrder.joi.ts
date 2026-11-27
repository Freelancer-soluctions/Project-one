import Joi from 'joi';
import { ORDER_STATUSES } from '../../orders/orderLifecycle.js';
import { money } from '../../orders/money.joi.js';

const providerOrderDetailSchema = Joi.object({
  productId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).required(),
  estimatedPrice: money.required(),
});

const deliveryDate = Joi.date().iso().allow(null);
const orderStatus = Joi.string().valid(...ORDER_STATUSES);

/**
 * `purchaseId` is intentionally absent: only the conversion service writes the
 * purchase link, so a client sending it is rejected by the strict whitelist.
 */
export const providerOrderCreateSchema = Joi.object({
  supplierId: Joi.number().integer().positive().required(),
  status: orderStatus.optional(),
  notes: Joi.string().max(500).allow('', null).optional(),
  expectedDeliveryDate: deliveryDate.optional(),
  deliveredOn: deliveryDate.optional(),
  details: Joi.array().items(providerOrderDetailSchema).min(1).required(),
});

export const providerOrderUpdateSchema = Joi.object({
  supplierId: Joi.number().integer().positive().optional(),
  status: orderStatus.optional(),
  notes: Joi.string().max(500).allow('', null).optional(),
  expectedDeliveryDate: deliveryDate.optional(),
  deliveredOn: deliveryDate.optional(),
  details: Joi.array().items(providerOrderDetailSchema).min(1).optional(),
});

export const providerOrderFiltersSchema = Joi.object({
  supplierId: Joi.number().integer().positive().allow('').optional(),
  status: orderStatus.allow('').optional(),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});
