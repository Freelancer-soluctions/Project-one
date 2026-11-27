import Joi from 'joi';

/**
 * Shared money validator used by clientOrder and providerOrder detail schemas.
 * Money must be >= 0 and have at most 2 decimals. Joi's `precision()`
 * silently rounds (10.123 -> 10.12), which would hide bad input, so the
 * precision check is explicit (RN-ORD-001).
 */
export const money = Joi.number()
  .min(0)
  .custom((value: number, helpers: Joi.CustomHelpers) => {
    const scaled = value * 100;
    return Math.abs(Math.round(scaled) - scaled) < 1e-9
      ? value
      : helpers.error('any.invalid');
  });
