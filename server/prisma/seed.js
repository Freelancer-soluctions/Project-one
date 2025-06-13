import { prisma } from '../src/config/db.js'
import { encryptPassword } from '../src/utils/bcrypt/encrypt.js'

const roles = [
  {
    code: 'C01',
    description: 'admin'
  },
  {
    code: 'C02',
    description: 'user'
  },
  {
    code: 'C03',
    description: 'manager'
  }
]

const rolePermissionsMap = {
  2: [1, 23, 37, 39, 40, 47], // user
  3: [
    1, 2, 3, 4, 5, 6, 7, 8, 9,
    10, 11, 12, 13, 14, 15, 16,
    17, 18, 19, 20, 21, 22, 23,
    24, 25, 26, 27, 28, 29, 30,
    31, 32, 33, 34, 35, 36, 37,
    38, 39, 40, 41, 42, 43, 44,
    45, 46, 47
  ] // MANAGER
}

const permissions = [
  { id: 1, code: 'canViewDashboard', description: 'Puede ver el dashboard' },
  { id: 2, code: 'canCreateProduct', description: 'Puede crear productos' },
  { id: 3, code: 'canEditProduct', description: 'Puede editar productos' },
  { id: 4, code: 'canDeleteProduct', description: 'Puede eliminar productos' },
  { id: 5, code: 'canViewProduct', description: 'Puede ver productos' },
  { id: 6, code: 'canCreateProvider', description: 'Puede crear proveedores' },
  { id: 7, code: 'canEditProvider', description: 'Puede editar proveedores' },
  { id: 8, code: 'canDeleteProvider', description: 'Puede eliminar proveedores' },
  { id: 9, code: 'canViewProvider', description: 'Puede ver proveedores' },
  { id: 10, code: 'canCreateInventory', description: 'Puede crear inventario' },
  { id: 11, code: 'canEditInventory', description: 'Puede editar inventario' },
  { id: 12, code: 'canViewInventory', description: 'Puede ver inventario' },
  { id: 13, code: 'canCreateCategory', description: 'Puede crear categorías' },
  { id: 14, code: 'canEditCategory', description: 'Puede editar categorías' },
  { id: 15, code: 'canViewCategory', description: 'Puede ver categorías' },
  { id: 16, code: 'canCreateSale', description: 'Puede crear ventas' },
  { id: 17, code: 'canEditSale', description: 'Puede editar ventas' },
  { id: 18, code: 'canViewSale', description: 'Puede ver ventas' },
  { id: 19, code: 'canCreatePurchase', description: 'Puede crear compras' },
  { id: 20, code: 'canEditPurchase', description: 'Puede editar compras' },
  { id: 21, code: 'canViewPurchase', description: 'Puede ver compras' },
  { id: 22, code: 'canCreateClient', description: 'Puede crear clientes' },
  { id: 23, code: 'canEditClient', description: 'Puede editar clientes' },
  { id: 24, code: 'canViewClient', description: 'Puede ver clientes' },
  { id: 25, code: 'canCreateEmployee', description: 'Puede crear empleados' },
  { id: 26, code: 'canEditEmployee', description: 'Puede editar empleados' },
  { id: 27, code: 'canViewEmployee', description: 'Puede ver empleados' },
  { id: 28, code: 'canEvaluatePerformance', description: 'Puede evaluar desempeño' },
  { id: 29, code: 'canViewPerformanceEvaluations', description: 'Puede ver evaluaciones de desempeño' },
  { id: 30, code: 'canCreatePayroll', description: 'Puede crear nóminas' },
  { id: 31, code: 'canEditPayroll', description: 'Puede editar nóminas' },
  { id: 32, code: 'canViewPayroll', description: 'Puede ver nóminas' },
  { id: 33, code: 'canRecordAttendance', description: 'Puede registrar asistencia' },
  { id: 34, code: 'canViewAttendance', description: 'Puede ver asistencia' },
  { id: 35, code: 'canRequestVacation', description: 'Puede solicitar vacaciones' },
  { id: 36, code: 'canViewVacations', description: 'Puede ver vacaciones' },
  { id: 37, code: 'canViewNews', description: 'Puede ver noticias' },
  { id: 38, code: 'canCreateClientOrder', description: 'Puede crear órdenes de cliente' },
  { id: 39, code: 'canEditClientOrder', description: 'Puede editar órdenes de cliente' },
  { id: 40, code: 'canViewClientOrder', description: 'Puede ver órdenes de cliente' },
  { id: 41, code: 'canCreateProviderOrder', description: 'Puede crear órdenes a proveedores' },
  { id: 42, code: 'canEditProviderOrder', description: 'Puede editar órdenes a proveedores' },
  { id: 43, code: 'canViewProviderOrder', description: 'Puede ver órdenes a proveedores' },
  { id: 44, code: 'canCreateExpense', description: 'Puede crear gastos' },
  { id: 45, code: 'canEditExpense', description: 'Puede editar gastos' },
  { id: 46, code: 'canViewExpense', description: 'Puede ver gastos' },
  { id: 47, code: 'canViewReports', description: 'Puede ver reportes' }
]

const userStatus = [
  {
    code: 'C01',
    description: 'ACTIVE'
  },
  {
    code: 'C02',
    description: 'INACTIVE'
  }
]

const noteStatus = [
  {
    code: 'C01',
    title: 'LOW'
  },
  {
    code: 'C02',
    title: 'MEDIUM'
  },
  {
    code: 'C03',
    title: 'HIGH'
  }
]

const eventTypes = [
  {
    code: 'C01',
    description: 'Session'
  },
  {
    code: 'C02',
    description: 'Conference'
  },
  {
    code: 'C03',
    description: 'Workshop'
  }
]

const newStatus = [
  {
    code: 'C01',
    description: 'ACTIVE'
  },
  {
    code: 'C02',
    description: 'PENDING'
  },
  {
    code: 'C03',
    description: 'CLOSED'
  }
]

const productStatus = [
  {
    code: 'C01',
    description: 'ACTIVE'
  },
  {
    code: 'C02',
    description: 'INACTIVE'
  }
]

// const productProviders = [
//   { code: 'C01', description: 'PROV. SOFTWARE' },
//   { code: 'C02', description: 'PROV. HARDWARE' },
//   { code: 'C03', description: 'PROV. SERV. NUBE' },
//   { code: 'C04', description: 'PROV. INFRA IT' },
//   { code: 'C05', description: 'PROV. SOPORTE' }
// ]

const productCategories = [
  {
    code: 'C01',
    description: 'Monitores y Periféricos'
  },
  {
    code: 'C02',
    description: 'Accesorios (Teclados, Ratones, etc.)'
  }
]

const user = {
  name: 'Admin',
  email: 'admin@gmail.com',
  password: '123456',
  address: 'Robert Robertson, 1234 NW Bobcat Lane, St. Robert, MO 65584-5678',
  birthday: new Date('1990-09-26T07:58:30.996+0200'),
  city: 'Vegas',
  isAdmin: true,
  picture: 'abcd',
  document: 'Not document',
  lastUpdatedBy: 1,
  lastUpdatedOn: new Date('2024-01-07T07:58:30.996+0200'),
  roleId: 1,
  socialSecurity: '123456789',
  startDate: new Date('2024-01-07T07:58:30.996+0200'),
  state: 'Texas',
  statusId: 1,
  telephone: '300456322445565',
  zipcode: '987654321'
}

const user1 = {
  name: 'user1',
  email: 'user@gmail.com',
  password: '123456',
  address: 'Robert Robertson, 1234 NW Bobcat Lane, St. Robert, MO 65584-5678',
  birthday: new Date('1990-09-26T07:58:30.996+0200'),
  city: 'Vegas',
  isAdmin: false,
  picture: 'abcd',
  document: 'Not document',
  lastUpdatedBy: 1,
  lastUpdatedOn: new Date('2024-01-07T07:58:30.996+0200'),
  roleId: 2,
  socialSecurity: '123456789',
  startDate: new Date('2024-01-07T07:58:30.996+0200'),
  state: 'Texas',
  statusId: 1,
  telephone: '300456322445565',
  zipcode: '987654321'
}

const news = [{
  closedOn: null,
  createdOn: '2024-08-05T00:19:58.867Z',
  description: 'test1',
  document: null,
  documentId: null,
  statusId: 1,
  closedBy: 1,
  createdBy: 1

}]

const createVarious = async (tableName, createObjects) => {
  const createdObjects = await prisma[tableName].createMany({
    data: createObjects,
    skipDuplicates: true
  })
  return Promise.resolve(createdObjects)
}

const create = async (tableName, createObject) => {
  createObject.password = await encryptPassword(createObject.password)
  const createdItem = await prisma[tableName].create({
    data: createObject
  })
  return Promise.resolve(createdItem)
}

async function main () {
  await create('users', user1)

  /*   await createVarious('roles', roles)
  await createVarious('userPermits', userPermits)
  await createVarious('userStatus', userStatus) */

  /*   await createVarious('noteColumns', noteStatus)
  await createVarious('eventTypes', eventTypes) */

  // await createVarious('newsStatus', newStatus)
  // await createVarious('news', news)
  /* await createVarious('productStatus', productStatus)  */
  // await createVarious('productProviders', productProviders)
  // await createVarious('productCategories', productCategories)
}

main()
  .then(async () => {
    console.log('Prisma seaders completed')
    // await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e, 'An error occurred while performing prisma seeders.')
    // await prisma.$disconnect()
    process.exit(1)
  })
