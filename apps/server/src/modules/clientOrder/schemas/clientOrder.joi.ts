import Joi from 'joi';
import { ORDER_STATUSES } from '../../orders/orderLifecycle.js';
import { money } from '../../orders/money.joi.js';

const clientOrderDetailSchema = Joi.object({
  productId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().min(1).required(),
  unitPrice: money.required(),
});

const deliveryDate = Joi.date().iso().allow(null);
const orderStatus = Joi.string().valid(...ORDER_STATUSES);

/**
 * `saleId` is intentionally absent: only the conversion service writes the
 * sale link, so a client sending it is rejected by the strict whitelist.
 */
export const clientOrderCreateSchema = Joi.object({
  clientId: Joi.number().integer().positive().required(),
  status: orderStatus.optional(),
  notes: Joi.string().max(500).allow('', null).optional(),
  expectedDeliveryDate: deliveryDate.optional(),
  deliveredOn: deliveryDate.optional(),
  details: Joi.array().items(clientOrderDetailSchema).min(1).required(),
});

export const clientOrderUpdateSchema = Joi.object({
  clientId: Joi.number().integer().positive().optional(),
  status: orderStatus.optional(),
  notes: Joi.string().max(500).allow('', null).optional(),
  expectedDeliveryDate: deliveryDate.optional(),
  deliveredOn: deliveryDate.optional(),
  details: Joi.array().items(clientOrderDetailSchema).min(1).optional(),
});

export const clientOrderFiltersSchema = Joi.object({
  clientId: Joi.number().integer().positive().allow('').optional(),
  status: orderStatus.allow('').optional(),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});
