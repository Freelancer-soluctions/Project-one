import Joi from 'joi';

export const UserStatus = Joi.object({
  description: Joi.string().min(3).max(8).required(),
  code: Joi.string().min(3).max(3).required(),
  users: Joi.array().min(1),
});

export const UserStatusUpdate = Joi.object({
  description: Joi.string().min(3).max(8).required(),
  code: Joi.string().min(3).max(3),
  users: Joi.array().min(1),
});

export const UserStatusArray = Joi.array().items(UserStatus).min(1);

export const User = Joi.object({
  email: Joi.string().email({ tlds: false }).required(),
  name: Joi.string().min(2).max(80).required(),
  startDate: Joi.date().required(),
  lastUpdatedOn: Joi.date().required(),
  lastUpdatedBy: Joi.date().required(),
  socialSecurity: Joi.string().min(1).max(9).required(),
  telephone: Joi.string().min(1).max(13).required(),
  birthday: Joi.date().required(),
  zipcode: Joi.string().alphanum().min(1).max(5).required(),
  state: Joi.string().min(1).max(50).required(),
  city: Joi.string().min(1).max(50).required(),
  address: Joi.string().min(1).max(250).required(),
  isAdmin: Joi.boolean(),
  isManager: Joi.boolean(),
  accessNews: Joi.boolean(),
  accessConfiguration: Joi.boolean(),
  document: Joi.string(),
  statusId: Joi.number().integer().required(),
  notesCreated: Joi.array().min(1),
  notesClosed: Joi.array().min(1),
  newsCreated: Joi.array().min(1),
  newsClosed: Joi.array().min(1),
});

export const UserUpdate = Joi.object({
  email: Joi.string().email({ tlds: false }),
  name: Joi.string().min(2).max(80),
  startDate: Joi.date(),
  lastUpdatedOn: Joi.date(),
  lastUpdatedBy: Joi.date(),
  socialSecurity: Joi.string().min(1).max(9),
  telephone: Joi.string().min(1).max(13),
  birthday: Joi.date(),
  zipcode: Joi.string().alphanum().min(1).max(5),
  state: Joi.string().min(1).max(50),
  city: Joi.string().min(1).max(50),
  address: Joi.string().min(1).max(250),
  isAdmin: Joi.boolean(),
  isManager: Joi.boolean(),
  accessNews: Joi.boolean(),
  accessConfiguration: Joi.boolean(),
  document: Joi.string(),
  statusId: Joi.number().integer(),
  notesCreated: Joi.array().min(1),
  notesClosed: Joi.array().min(1),
  newsCreated: Joi.array().min(1),
  newsClosed: Joi.array().min(1),
});

export const Role = Joi.object({
  description: Joi.string().min(3).max(50).required(),
  code: Joi.string().min(3).max(3).required(),
});

export const RoleUpdate = Joi.object({
  description: Joi.string().min(3).max(50).required(),
  code: Joi.string().min(3).max(3),
});

export const RoleArray = Joi.array().items(Role).min(1);

export const userFiltersSchema = Joi.object({
  name: Joi.string().max(100).allow(''),
  email: Joi.string().email().allow(''),
  status: Joi.string().allow(''),
  limit: Joi.number().integer(),
  page: Joi.number().integer(),
});

export const userCreateUpdateSchema = Joi.object({
  name: Joi.string().max(100).required(),
  email: Joi.string().email().required(),
  address: Joi.string().max(250).allow(''),
  birthday: Joi.date().required(),
  city: Joi.string().max(35).allow(''),
  isAdmin: Joi.boolean().default(false),
  picture: Joi.string().allow(''),
  document: Joi.string().allow(''),
  roleId: Joi.number().integer().required(),
  socialSecurity: Joi.string().max(9).required(),
  startDate: Joi.date().required(),
  state: Joi.string().max(50).allow(''),
  statusId: Joi.number().integer().required(),
  telephone: Joi.string().max(15).required(),
  zipcode: Joi.string().max(9).required(),
  permissions: Joi.array().items(Joi.number().integer().optional()).optional(),
});
