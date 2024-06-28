import Joi from 'joi'

export const signInSchema = Joi.object({
  email: Joi.string().email({ tlds: false }).required(),
  password: Joi.string().min(6).max(16).required()
})

export const signUpSchema = Joi.object({
  firstName: Joi.string().min(4).max(50).required(),
  lastName: Joi.string().min(4).max(50).required(),
  birthday: Joi.date().required(),
  email: Joi.string().email({ tlds: false }).required(),
  password: Joi.string().min(6).max(16).required()
})

export const UserStatus = Joi.object({
  description: Joi.string()
    .min(3)
    .max(8)
    .required(),
  code: Joi.string()
    .min(3)
    .max(3)
    .required(),
  users: Joi.array().min(1)
})

export const UserStatusUpdate = Joi.object({
  description: Joi.string()
    .min(3)
    .max(8)
    .required(),
  code: Joi.string()
    .min(3)
    .max(3),
  users: Joi.array().min(1)
})

export const UserStatusArray = Joi.array().items(UserStatus).min(1)

export const User = Joi.object({
  email: Joi.string()
    .email({ tlds: false })
    .required(),
  name: Joi.string()
    .min(2)
    .max(80)
    .required(),
  startDate: Joi.date().required(),
  lastUpdatedOn: Joi.date().required(),
  lastUpdatedBy: Joi.date().required(),
  socialSecurity: Joi.string()
    .min(1)
    .max(9)
    .required(),
  telephone: Joi.string()
    .min(1)
    .max(13)
    .required(),
  birthday: Joi.date()
    .required(),
  zipcode: Joi.string()
    .alphanum()
    .min(1)
    .max(5)
    .required(),
  state: Joi.string()
    .min(1)
    .max(50)
    .required(),
  city: Joi.string()
    .min(1)
    .max(50)
    .required(),
  address: Joi.string()
    .min(1)
    .max(250)
    .required(),
  isAdmin: Joi.boolean(),
  isManager: Joi.boolean(),
  accessNews: Joi.boolean(),
  accessConfiguration: Joi.boolean(),
  document: Joi.string(),
  statusId: Joi.number()
    .integer()
    .required(),
  notesCreated: Joi.array().min(1),
  notesClosed: Joi.array().min(1),
  newsCreated: Joi.array().min(1),
  newsClosed: Joi.array().min(1)

})

export const UserUpdate = Joi.object({
  email: Joi.string()
    .email({ tlds: false }),
  name: Joi.string()
    .min(2)
    .max(80),
  startDate: Joi.date(),
  lastUpdatedOn: Joi.date(),
  lastUpdatedBy: Joi.date(),
  socialSecurity: Joi.string()
    .min(1)
    .max(9),
  telephone: Joi.string()
    .min(1)
    .max(13),
  birthday: Joi.date(),
  zipcode: Joi.string()
    .alphanum()
    .min(1)
    .max(5),
  state: Joi.string()
    .min(1)
    .max(50),
  city: Joi.string()
    .min(1)
    .max(50),
  address: Joi.string()
    .min(1)
    .max(250),
  isAdmin: Joi.boolean(),
  isManager: Joi.boolean(),
  accessNews: Joi.boolean(),
  accessConfiguration: Joi.boolean(),
  document: Joi.string(),
  statusId: Joi.number().integer(),
  notesCreated: Joi.array().min(1),
  notesClosed: Joi.array().min(1),
  newsCreated: Joi.array().min(1),
  newsClosed: Joi.array().min(1)

})

export const NoteStatus = Joi.object({
  description: Joi.string()
    .min(3)
    .max(10)
    .required(),
  code: Joi.string()
    .min(3)
    .max(3)
    .required(),
  notes: Joi.array().min(1)

})

export const NoteStatusUpdate = Joi.object({
  description: Joi.string()
    .min(3)
    .max(10)
    .required(),
  code: Joi.string()
    .min(3)
    .max(3),
  notes: Joi.array().min(1)

})

export const NoteStatusArray = Joi.array().items(NoteStatus).min(1)

export const Role = Joi.object({
  description: Joi.string()
    .min(3)
    .max(50)
    .required(),
  code: Joi.string()
    .min(3)
    .max(3)
    .required(),
  notes: Joi.array().min(1)

})

export const RoleUpdate = Joi.object({
  description: Joi.string()
    .min(3)
    .max(50)
    .required(),
  code: Joi.string()
    .min(3)
    .max(3),
  notes: Joi.array().min(1)

})

export const RoleArray = Joi.array().items(Role).min(1)

export const Note = Joi.object({
  note: Joi.string()
    .min(3)
    .max(2000)
    .required(),
  statusId: Joi.number()
    .integer()
    .required(),
  createdBy: Joi.number()
    .integer()
    .required(),
  closedBy: Joi.number()
    .integer()
    .required(),
  createdOn: Joi.date().required(),
  closedOn: Joi.date().required(),
  document: Joi.string()

})

export const NoteUpdate = Joi.object({
  note: Joi.string()
    .min(3)
    .max(2000),
  statusId: Joi.number()
    .integer(),
  createdBy: Joi.number()
    .integer(),
  closedBy: Joi.number()
    .integer(),
  createdOn: Joi.date(),
  closedOn: Joi.date(),
  document: Joi.string()

})

export const NewsStatus = Joi.object({
  description: Joi.string()
    .min(3)
    .max(10)
    .required(),
  code: Joi.string()
    .min(3)
    .max(3)
    .required(),
  news: Joi.array().min(1)
})

export const NewsStatusUpdate = Joi.object({
  description: Joi.string()
    .min(3)
    .max(10)
    .required(),
  code: Joi.string()
    .min(3)
    .max(3),
  news: Joi.array().min(1)
})

export const NewsStatusArray = Joi.array().items(NewsStatus).min(1)

export const News = Joi.object({
  description: Joi.string()
    .min(3)
    .max(400)
    .required(),
  statusId: Joi.number()
    .integer()
    .required(),
  questions: Joi.array().min(1),
  createdBy: Joi.number()
    .integer()
    .required(),
  closedBy: Joi.number()
    .integer()
    .required(),
  createdOn: Joi.date().required(),
  closedOn: Joi.date().required(),
  document: Joi.string()
})

export const NewsUpdate = Joi.object({
  description: Joi.string()
    .min(3)
    .max(400),
  statusId: Joi.number().integer(),
  questions: Joi.array().min(1),
  createdBy: Joi.number()
    .integer(),
  closedBy: Joi.number()
    .integer(),
  createdOn: Joi.date(),
  closedOn: Joi.date(),
  document: Joi.string()
})

export const Question = Joi.object({
  description: Joi.string()
    .min(3)
    .max(250)
    .required(),
  answer: Joi.boolean()
    .required(),
  newsId: Joi.number()
    .integer()
    .required()
})

export const QuestionUpdate = Joi.object({
  description: Joi.string()
    .min(3)
    .max(250),
  answer: Joi.boolean(),
  newsId: Joi.number()
    .integer()
    .required()
})

export const QuestionArray = Joi.array().items(Question).min(1)
