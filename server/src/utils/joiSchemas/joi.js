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

// Inventory Movement Schemas
export const inventoryMovementFiltersSchema = Joi.object({
  productId: Joi.number().integer().positive().optional(),
  warehouseId: Joi.number().integer().positive().optional(),
  type: Joi.string().valid('ENTRY', 'EXIT', 'TRANSFERENCE', 'ADJUSTMENT').optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional()
})

export const inventoryMovementCreateUpdateSchema = Joi.object({
  productId: Joi.number().integer().positive().required(),
  warehouseId: Joi.number().integer().positive().required(),
  quantity: Joi.number().integer().positive().required(),
  type: Joi.string().valid('ENTRY', 'EXIT', 'TRANSFERENCE', 'ADJUSTMENT').required(),
  reason: Joi.string().max(200).optional(),
  purchaseId: Joi.number().integer().positive().optional(),
  saleId: Joi.number().integer().positive().optional()
})

export const clientFiltersSchema = Joi.object({
  name: Joi.string().max(100).allow(''),
  email: Joi.string().email().allow('')
})

export const clientCreateUpdateSchema = Joi.object({
  name: Joi.string().max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().max(15).required(),
  address: Joi.string().max(120).required()
})

export const saleFiltersSchema = Joi.object({
  clientId: Joi.number().integer().optional().allow(''),
  fromDate: Joi.date().iso().optional().allow(''),
  toDate: Joi.date().iso().optional().allow(''),
  minTotal: Joi.number().min(0).optional().allow(''),
  maxTotal: Joi.number().min(0).optional().allow('')
})

export const saleCreateUpdateSchema = Joi.object({
  clientId: Joi.number().integer().required(),
  total: Joi.number().min(0).required(),
  details: Joi.array().items(
    Joi.object({
      productId: Joi.number().integer().required(),
      quantity: Joi.number().integer().min(1).required(),
      price: Joi.number().min(0).required()
    })
  ).required().min(1)
})

export const employeeFiltersSchema = Joi.object({
  name: Joi.string().max(100).allow(''),
  lastName: Joi.string().max(100).allow(''),
  dni: Joi.string().max(10).allow(''),
  email: Joi.string().email().allow(''),
  department: Joi.string().max(100).allow(''),
  position: Joi.string().max(100).allow('')
})

export const employeeCreateUpdateSchema = Joi.object({
  name: Joi.string().max(100).required(),
  lastName: Joi.string().max(100).required(),
  dni: Joi.string().max(10).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().max(15).allow(''),
  address: Joi.string().max(120).allow(''),
  startDate: Joi.date().required(),
  position: Joi.string().max(100).required(),
  department: Joi.string().max(100).required(),
  salary: Joi.number().precision(2).positive().required()
})

export const attendanceFiltersSchema = Joi.object({
  employeeId: Joi.number().integer().allow(''),
  date: Joi.date().allow(''),
  fromDate: Joi.date().allow(''),
  toDate: Joi.date().allow('')
})

export const attendanceCreateUpdateSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  date: Joi.date().required(),
  entryTime: Joi.string().max(5).required(),
  exitTime: Joi.string().max(5).required(),
  workedHours: Joi.number().precision(2).positive().required()
})

export const payrollFiltersSchema = Joi.object({
  employeeId: Joi.number().integer().allow(''),
  month: Joi.number().integer().min(1).max(12).allow(''),
  year: Joi.number().integer().min(1900).max(2100).allow('')
})

export const payrollCreateUpdateSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  month: Joi.number().integer().min(1).max(12).required(),
  year: Joi.number().integer().min(1900).max(2100).required(),
  baseSalary: Joi.number().precision(2).positive().required(),
  extraHours: Joi.number().precision(2).min(0).required(),
  deductions: Joi.number().precision(2).min(0).required(),
  totalPayment: Joi.number().precision(2).positive().required()
})

export const vacationFiltersSchema = Joi.object({
  employeeId: Joi.number().integer().allow(''),
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').allow(''),
  fromDate: Joi.date().allow(''),
  toDate: Joi.date().allow('')
})

export const vacationCreateUpdateSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').default('PENDING')
})

export const permissionFiltersSchema = Joi.object({
  employeeId: Joi.number().integer().optional(),
  type: Joi.string().valid('SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'OTHER').optional(),
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').optional(),
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().min(Joi.ref('fromDate')).optional()
})

export const permissionCreateUpdateSchema = Joi.object({
  employeeId: Joi.number().integer().required(),
  type: Joi.string().valid('SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'OTHER').required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  reason: Joi.string().max(500).required(),
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').default('PENDING'),
  approvedBy: Joi.number().integer().optional(),
  approvedAt: Joi.date().iso().optional(),
  comments: Joi.string().max(1000).optional()
})

// {{ Expense Schemas START }}
const expenseCategoryEnumValues = [
  'RENTAL', 'UTILITIES', 'SALARIES', 'SUPPLIES', 'TRANSPORT',
  'MAINTENANCE', 'MARKETING', 'SOFTWARE', 'PROFESSIONAL_SERVICES',
  'TAXES', 'BANK_FEES', 'TRAVEL', 'TRAINING', 'OTHER'
]

export const expenseFiltersSchema = Joi.object({
  description: Joi.string().max(255).allow('').optional(),
  category: Joi.string().max(100).allow('').optional(),
  status: Joi.string().valid(...expenseCategoryEnumValues).allow('').optional(),
  // Optional date filters
  fromDate: Joi.date().iso().optional(),
  toDate: Joi.date().iso().min(Joi.ref('fromDate')).optional(),
  // Optional total range filters
  minTotal: Joi.number().min(0).optional(),
  maxTotal: Joi.number().when('minTotal', {
    is: Joi.exist(),
    then: Joi.number().min(Joi.ref('minTotal')),
    otherwise: Joi.number().min(0)
  }).optional()
})

export const expenseCreateUpdateSchema = Joi.object({
  description: Joi.string().max(255).required(),
  total: Joi.number().precision(2).positive().required(), // .positive() ensures it's > 0
  category: Joi.string().max(100).required(),
  status: Joi.string().valid(...expenseCategoryEnumValues).required()
})
// {{ Expense Schemas END }}

export const userFiltersSchema = Joi.object({
  name: Joi.string().max(100).allow(''),
  email: Joi.string().email().allow(''),
  status: Joi.string().allow('')
})

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
  accessConfiguration: Joi.boolean(),
  accessNews: Joi.boolean()
})

export const clientOrderFiltersSchema = Joi.object({
  clientId: Joi.number().integer().allow(''),
  status: Joi.string().allow('')
})

export const clientOrderCreateUpdateSchema = Joi.object({
  clientId: Joi.number().integer().required(),
  status: Joi.string().required(),
  notes: Joi.string().allow(''),
  saleId: Joi.number().integer().allow(null)
})

export const purchaseCreateUpdateSchema = Joi.object({
  providerId: Joi.number().integer().required(),
  total: Joi.number().min(0).required(),
  details: Joi.array().items(
    Joi.object({
      productId: Joi.number().integer().required(),
      quantity: Joi.number().integer().min(1).required(),
      price: Joi.number().min(0).required()
    })
  ).required().min(1)
})

export const purchaseFiltersSchema = Joi.object({
  providerId: Joi.number().integer().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  minTotal: Joi.number().min(0).optional(),
  maxTotal: Joi.number().min(0).optional()
})
