import Joi from 'joi';
import { ORDER_STATUSES } from '../../orders/orderLifecycle.js';

/**
 * Money must be >= 0 and have at most 2 decimals. Joi's `precision()`
 * silently rounds (1.999 -> 2.00), which would hide bad input, so the
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
