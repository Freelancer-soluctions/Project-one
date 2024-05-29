// import Joi from "joi";
import { z } from "zod"
import { AUTH_VALIDATIONS } from "./schemaMessages";


export const loginSchema = z.object({
    email: z.string({ required_error: AUTH_VALIDATIONS.email.empty })
        .email({ message: AUTH_VALIDATIONS.email.invalid }),

    password: z.string({required_error: AUTH_VALIDATIONS.password.empty})
        .min(6, { message: AUTH_VALIDATIONS.password.minLength(6)})
        .max(128, { message: AUTH_VALIDATIONS.password.maxLength(128)})

    
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