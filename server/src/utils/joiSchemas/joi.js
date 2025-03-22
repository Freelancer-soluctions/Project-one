import Joi from 'joi'

export const SignInSchema = Joi.object({
  email: Joi.string().email({ tlds: false }).required(),
  password: Joi.string().min(6).max(16).required()
})

export const SignUpSchema = Joi.object({
  firstName: Joi.string().min(4).max(50).required(),
  lastName: Joi.string().min(4).max(50).required(),
  birthday: Joi.date().required(),
  email: Joi.string().email({ tlds: false }).required(),
  password: Joi.string().min(6).max(16).required()
})

export const UserStatus = Joi.object({
  description: Joi.string().min(3).max(8).required(),
  code: Joi.string().min(3).max(3).required(),
  users: Joi.array().min(1)
})

export const UserStatusUpdate = Joi.object({
  description: Joi.string().min(3).max(8).required(),
  code: Joi.string().min(3).max(3),
  users: Joi.array().min(1)
})

export const UserStatusArray = Joi.array().items(UserStatus).min(1)

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
  newsClosed: Joi.array().min(1)
})

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
  newsClosed: Joi.array().min(1)
})

export const Role = Joi.object({
  description: Joi.string().min(3).max(50).required(),
  code: Joi.string().min(3).max(3).required()
})

export const RoleUpdate = Joi.object({
  description: Joi.string().min(3).max(50).required(),
  code: Joi.string().min(3).max(3)
})

export const RoleArray = Joi.array().items(Role).min(1)

export const NotesFilters = Joi.object({
  searchTerm: Joi.string().min(1).max(150).allow(''),
  statusCode: Joi.string().min(3).max(3).allow('')
})

export const NoteCreate = Joi.object({
  title: Joi.string().max(50).required(),
  content: Joi.string().max(2000).required(),
  color: Joi.string().max(6).required(),
  columnId: Joi.number().integer().required()
})

export const NoteUpdate = Joi.object({
  title: Joi.string().max(50).required(),
  content: Joi.string().max(2000).required()
})
export const NoteColumnUpdate = Joi.object({
  color: Joi.string().min(3).max(6).required(),
  columnId: Joi.number().integer().required(),
  id: Joi.number().required()
})

export const News = Joi.object({
  description: Joi.string().min(1).max(400).required(),
  statusId: Joi.number().integer().required(),
  statusCode: Joi.string().max(3).required(),
  document: Joi.string().allow('')
})

export const NewsFilters = Joi.object({
  description: Joi.string().min(1).max(30).allow(''),
  statusCode: Joi.string().min(3).max(3).allow(''),
  toDate: Joi.date().allow(''),
  fromDate: Joi.date().allow('')
})

export const NewsUpdate = Joi.object({
  description: Joi.string().min(1).max(400).required(),
  statusId: Joi.number().integer().required(),
  statusCode: Joi.string().max(3).required(),
  document: Joi.string().allow('')
})

export const SettingsLanguage = Joi.object({
  id: Joi.number().integer().optional(),
  language: Joi.string().valid('es', 'en').required()
})

export const SettingsDisplay = Joi.object({
  id: Joi.number().integer().optional(),
  displayOptions: Joi.object({
    displayEvents: Joi.boolean().required(),
    displayNotes: Joi.boolean().required(),
    displayNews: Joi.boolean().required(),
    displayProfile: Joi.boolean().required(),
    displayLanguage: Joi.boolean().required(),
    displayReports: Joi.boolean().required(),
    displayPayroll: Joi.boolean().required(),
    displayStock: Joi.boolean().required()
  })
})

export const EventsCreateUpdate = Joi.object({
  title: Joi.string().max(50).required(),
  description: Joi.string().max(200).required(),
  speaker: Joi.string().max(20).allow(''),
  startTime: Joi.string().max(5).required(),
  endTime: Joi.string().max(5).required(),
  eventDate: Joi.date().required(),
  type: Joi.number().integer().required()
})

export const EventsFilters = Joi.object({
  searchQuery: Joi.string().min(1).max(30).allow('')
})

export const Products = Joi.object({
  sku: Joi.string().max(16).required(),
  name: Joi.string().max(80).required(),
  productCategoryId: Joi.number().integer().required(),
  productProviderId: Joi.number().integer().required(),
  price: Joi.number().precision(2).positive().required(),
  cost: Joi.number().precision(2).positive().required(),
  description: Joi.string().max(2000).allow(null, ''),
  productStatusId: Joi.number().integer().required(),
  barCode: Joi.string().max(25).allow(null, '')

})

export const ProductsFilters = Joi.object({
  name: Joi.string().min(1).max(80).allow(''),
  statusCode: Joi.string().min(3).max(3).allow(''),
  productProviderCode: Joi.string().min(3).max(3).allow(''),
  productCategoryCode: Joi.string().min(3).max(3).allow('')
})

export const ProductsUpdate = Joi.object({
  sku: Joi.string().max(16).required(),
  name: Joi.string().max(80).required(),
  productCategoryId: Joi.number().integer().required(),
  productProviderId: Joi.number().integer().required(),
  price: Joi.number().precision(2).positive().required(),
  cost: Joi.number().precision(2).positive().required(),
  description: Joi.string().max(2000).allow(null, ''),
  productStatusId: Joi.number().integer().required(),
  barCode: Joi.string().max(25).allow(null, '')

})
export const ProductAttributes = Joi.array().items(
  Joi.object({
    id: Joi.number().integer().optional(),
    name: Joi.string().max(50).required(),
    description: Joi.string().max(50).required(),
    createdOn: Joi.date().required(),
    productId: Joi.number().integer().required()
  })
)

export const ProvidersFilters = Joi.object({
  name: Joi.string().min(1).max(80).allow(''),
  status: Joi.boolean().allow(null)
})

export const Providers = Joi.object({
  code: Joi.string().max(3).required(),
  name: Joi.string().max(100).required(),
  status: Joi.boolean().required(),
  contactName: Joi.string().max(60).allow(null, ''),
  contactEmail: Joi.string().max(80).allow(null, ''),
  contactPhone: Joi.string().max(15).allow(null, ''),
  address: Joi.string().max(120).allow(null, '')

})

export const SettingsProductCategoryCreate = Joi.object({
  code: Joi.string().max(3).required(),
  description: Joi.string().max(50).required()
})

export const SettingsProductCategoryUpdate = Joi.object({
  description: Joi.string().max(50).allow(''),
  code: Joi.string().max(3).allow('')
})

export const SettingsProductCategoryFilters = Joi.object({
  description: Joi.string().max(50).allow(''),
  code: Joi.string().max(3).allow('')
})

export const warehouseFiltersSchema = Joi.object({
  name: Joi.string().max(50).allow(''),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'MAINTENANCE').allow('')
})

export const warehouseCreateUpdateSchema = Joi.object({
  name: Joi.string().max(50).required(),
  description: Joi.string().max(120).allow(''),
  address: Joi.string().max(120).allow(''),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'MAINTENANCE').required()
})

export const stockFiltersSchema = Joi.object({
  productId: Joi.string().allow('').optional(),
  warehouseId: Joi.string().allow('').optional(),
  lot: Joi.string().max(50).allow('').optional(),
  unitMeasure: Joi.string().valid('PIECES', 'KILOGRAMS', 'LITERS', 'METERS').allow('').optional(),
  stocksExpirated: Joi.boolean().allow('').optional(),
  stocksLow: Joi.boolean().allow('').optional()
})

export const stockCreateUpdateSchema = Joi.object({
  quantity: Joi.number().integer().min(0).required(),
  minimum: Joi.number().integer().min(0).required(),
  maximum: Joi.number().integer().min(0).allow(null),
  lot: Joi.string().max(50).allow(''),
  unitMeasure: Joi.string().valid('PIECES', 'KILOGRAMS', 'LITERS', 'METERS').required(),
  expirationDate: Joi.date().allow(null),
  productId: Joi.number().integer().required(),
  warehouseId: Joi.number().integer().required()
})
