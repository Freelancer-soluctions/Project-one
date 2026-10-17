import Joi from 'joi';

export const SignInSchema = Joi.object({
  email: Joi.string().email({ tlds: false }).required(),
  password: Joi.string().min(6).max(16).required(),
});

export const SignUpSchema = Joi.object({
  firstName: Joi.string().min(4).max(50).required(),
  lastName: Joi.string().min(4).max(50).required(),
  birthday: Joi.date().required(),
  email: Joi.string().email({ tlds: false }).required(),
  password: Joi.string().min(6).max(16).required(),
});
