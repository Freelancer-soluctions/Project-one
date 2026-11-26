import Joi from 'joi';
import { ORDER_STATUSES } from '../../orders/orderLifecycle.js';

/**
 * Money must be >= 0 and have at most 2 decimals. Joi's `precision()`
 * silently rounds (10.123 -> 10.12), which would hide bad input, so the
 * precision check is explicit (RN-ORD-001).
 */
const money = Joi.number()
  .min(0)
  .custom((value: number, helpers: Joi.CustomHelpers) => {
    const scaled = value * 100;
    return Math.abs(Math.round(scaled) - scaled) < 1e-9
      ? value
      : helpers.error('any.invalid');
  });

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
