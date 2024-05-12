import Joi from 'joi'
export const signInSchema = Joi.object({
  email: Joi.string().email({ tlds: false }).required(),
  password: Joi.string().min(6).max(128).required()
})

export const signUpSchema = Joi.object({
  name: Joi.string().min(2).max(128).required(),
  lastName: Joi.string().min(2).max(128).required(),
  email: Joi.string().email({ tlds: false }).required(),
  password: Joi.string().min(6).max(128).required()
})
