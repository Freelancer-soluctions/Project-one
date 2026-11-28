import { z } from 'zod';
import {
  getZodErrorMessage,
  getZodMinMaxErrorMessage,
} from '@/utils/zod-i18n-map';

export const signInSchema = z.object({
  email: z
    .string({ error: getZodErrorMessage('zod.auth.email.empty') })
    .email({ error: getZodErrorMessage('zod.auth.email.invalid') }),

  password: z
    .string({ error: getZodErrorMessage('zod.auth.password.empty') })
    .min(6, {
      error: getZodMinMaxErrorMessage('zod.auth.password.minLength', 6),
    })
    .max(16, {
      error: getZodMinMaxErrorMessage('zod.auth.password.maxLength', 16),
    }),
});

export const signUpSchema = z.object({
  // firstName: Joi.string().min(4).max(50).required(),
  // lastName: Joi.string().min(4).max(50).required(),
  // birthday: Joi.date().required(),

  email: z
    .string({ error: getZodErrorMessage('zod.auth.email.empty') })
    .email({ error: getZodErrorMessage('zod.auth.email.invalid') }),

  password: z
    .string({ error: getZodErrorMessage('zod.auth.password.empty') })
    .min(6, {
      error: getZodMinMaxErrorMessage('zod.auth.password.minLength', 6),
    })
    .max(16, {
      error: getZodMinMaxErrorMessage('zod.auth.password.maxLength', 16),
    }),
});

// export const loginSchema = Joi.object({
//     email: Joi.string().email({ tlds: false }).required().messages({
//       "string.empty": AUTH_VALIDATIONS.email.empty,
//       "string.email": AUTH_VALIDATIONS.email.invalid,
//     }),
//     password: Joi.string()
//       .min(6)
//       .max(128)
//       .required()
//       .messages({
//         "string.empty": AUTH_VALIDATIONS.password.empty,
//         "string.min": AUTH_VALIDATIONS.password.minLength(6),
//         "string.max": AUTH_VALIDATIONS.password.maxLength(128),
//       }),
// });
