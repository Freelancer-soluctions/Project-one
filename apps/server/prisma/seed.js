/* eslint-disable no-unused-vars */
import { prisma } from '../src/config/db.js';
import { encryptPassword } from '../src/utils/bcrypt/encrypt.js';

const roles = [
  {
    code: 'C01',
    description: 'admin',
  },
  {
    code: 'C02',
    description: 'user',
  },
  {
    code: 'C03',
    description: 'manager',
  },
];

const rolePermissionsMap = {
  2: [1, 23, 37, 39, 40, 47], // user
  3: [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47,
  ], // MANAGER
};

const permissions = [
  { code: 'canViewNews', description: 'Puede ver noticias' },
  { code: 'canCreateNews', description: 'Puede crear noticias' },
  { code: 'canEditNews', description: 'Puede editar noticias' },
  { code: 'canDeleteNews', description: 'Puede eliminar noticias' },
  { code: 'canCreateCategory', description: 'Puede crear categorías' },
  { code: 'canEditCategory', description: 'Puede editar categorías' },
  { code: 'canViewCategory', description: 'Puede ver categorías' },
  { code: 'canDeleteCategory', description: 'Puede eliminar categorías' },

  { code: 'canCreateEvents', description: 'Puede crear eventos' },
  { code: 'canEditEvents', description: 'Puede editar eventos' },
  { code: 'canViewEvents', description: 'Puede ver eventos' },
  { code: 'canDeleteEvents', description: 'Puede eliminar eventos' },
  { code: 'canCreateProduct', description: 'Puede crear productos' },
  { code: 'canEditProduct', description: 'Puede editar productos' },
  { code: 'canDeleteProduct', description: 'Puede eliminar productos' },
  { code: 'canViewProduct', description: 'Puede ver productos' },
  { code: 'canCreateProvider', description: 'Puede crear proveedores' },
  { code: 'canEditProvider', description: 'Puede editar proveedores' },
  { code: 'canDeleteProvider', description: 'Puede eliminar proveedores' },
  { code: 'canViewProvider', description: 'Puede ver proveedores' },
  { code: 'canCreateWarehouse', description: 'Puede crear almacenes' },
  { code: 'canEditWarehouse', description: 'Puede editar almacenes' },
  { code: 'canViewWarehouse', description: 'Puede ver almacenes' },
  { code: 'canDeleteWarehouse', description: 'Puede eliminar almacenes' },
  { code: 'canViewStock', description: 'Puede ver stock' },
  { code: 'canCreateStock', description: 'Puede crear stock' },
  { code: 'canEditStock', description: 'Puede editar stock' },
  { code: 'canDeleteStock', description: 'Puede eliminar stock' },
  { code: 'canCreateInventory', description: 'Puede crear inventario' },
  { code: 'canEditInventory', description: 'Puede editar inventario' },
  { code: 'canViewInventory', description: 'Puede ver inventario' },
  { code: 'canDeleteInventory', description: 'Puede eliminar inventario' },
  { code: 'canCreateSale', description: 'Puede crear ventas' },
  { code: 'canEditSale', description: 'Puede editar ventas' },
  { code: 'canViewSale', description: 'Puede ver ventas' },
  { code: 'canDeleteSale', description: 'Puede eliminar ventas' },
  { code: 'canCreatePurchase', description: 'Puede crear compras' },
  { code: 'canEditPurchase', description: 'Puede editar compras' },
  { code: 'canViewPurchase', description: 'Puede ver compras' },
  { code: 'canDeletePurchase', description: 'Puede eliminar compras' },
  { code: 'canCreateEmployee', description: 'Puede crear empleados' },
  { code: 'canEditEmployee', description: 'Puede editar empleados' },
  { code: 'canViewEmployee', description: 'Puede ver empleados' },
  { code: 'canDeleteEmployee', description: 'Puede eliminar empleados' },

  { code: 'canCreateClient', description: 'Puede crear clientes' },
  { code: 'canEditClient', description: 'Puede editar clientes' },
  { code: 'canViewClient', description: 'Puede ver clientes' },
  { code: 'canDeleteClient', description: 'Puede eliminar clientes' },
  { code: 'canCreateAttendance', description: 'Puede crear asistencias' },
  { code: 'canViewAttendance', description: 'Puede ver asistencias' },
  { code: 'canEditAttendance', description: 'Puede editar asistencias' },
  { code: 'canDeleteAttendance', description: 'Puede eliminar asistencias' },
  { code: 'canCreatePayroll', description: 'Puede crear nóminas' },
  { code: 'canEditPayroll', description: 'Puede editar nóminas' },
  { code: 'canViewPayroll', description: 'Puede ver nóminas' },
  { code: 'canDeletePayroll', description: 'Puede eliminar nóminas' },
  { code: 'canRequestVacation', description: 'Puede solicitar vacaciones' },
  { code: 'canViewVacations', description: 'Puede ver vacaciones' },
  { code: 'canDeleteVacation', description: 'Puede eliminar vacaciones' },
  {
    code: 'canEditRequestVacation',
    description: 'Puede editar solicitudes de vacaciones',
  },
  { code: 'canViewPermission', description: 'Puede ver permisos' },
  { code: 'canEditPermission', description: 'Puede editar permisos' },
  { code: 'canDeletePermission', description: 'Puede eliminar permisos' },
  { code: 'canCreatePermission', description: 'Puede crear permisos' },
  { code: 'canCreateUser', description: 'Puede crear usuarios' },
  { code: 'canEditUser', description: 'Puede editar usuarios' },
  { code: 'canViewUser', description: 'Puede ver usuarios' },
  { code: 'canDeleteUser', description: 'Puede eliminar usuarios' },
  { code: 'canCreateExpense', description: 'Puede crear gastos' },
  { code: 'canEditExpense', description: 'Puede editar gastos' },
  { code: 'canViewExpense', description: 'Puede ver gastos' },
  { code: 'canDeleteExpense', description: 'Puede eliminar gastos' },
  { code: 'canEvaluatePerformance', description: 'Puede evaluar desempeño' },
  {
    code: 'canViewPerformanceEvaluations',
    description: 'Puede ver evaluaciones de desempeño',
  },
  {
    code: 'canCreateEvaluatePerformance',
    description: 'Puede crear evaluaciones de desempeño',
  },
  {
    code: 'canEditEvaluatePerformance',
    description: 'Puede editar evaluaciones de desempeño',
  },
  {
    code: 'canDeleteEvaluationPerformance',
    description: 'Puede eliminar evaluaciones de desempeño',
  },

  // { code: 'canViewDashboard', description: 'Puede ver el dashboard' },

  // { code: 'canCreateClientOrder', description: 'Puede crear órdenes de cliente' },
  // { code: 'canEditClientOrder', description: 'Puede editar órdenes de cliente' },
  // { code: 'canViewClientOrder', description: 'Puede ver órdenes de cliente' },
  // { code: 'canCreateProviderOrder', description: 'Puede crear órdenes a proveedores' },
  // { code: 'canEditProviderOrder', description: 'Puede editar órdenes a proveedores' },
  // { code: 'canViewProviderOrder', description: 'Puede ver órdenes a proveedores' },

  // { code: 'canViewReports', description: 'Puede ver reportes' }
];

const userStatus = [
  {
    code: 'C01',
    description: 'ACTIVE',
  },
  {
    code: 'C02',
    description: 'INACTIVE',
  },
];

const noteColumns = [
  {
    code: 'C01',
    title: 'LOW',
  },
  {
    code: 'C02',
    title: 'MEDIUM',
  },
  {
    code: 'C03',
    title: 'HIGH',
  },
];

const eventTypes = [
  {
    code: 'C01',
    description: 'Session',
  },
  {
    code: 'C02',
    description: 'Conference',
  },
  {
    code: 'C03',
    description: 'Workshop',
  },
];

const newStatus = [
  {
    code: 'C01',
    description: 'ACTIVE',
  },
  {
    code: 'C02',
    description: 'PENDING',
  },
  {
    code: 'C03',
    description: 'CLOSED',
  },
];

const productStatus = [
  {
    code: 'C01',
    description: 'ACTIVE',
  },
  {
    code: 'C02',
    description: 'INACTIVE',
  },
];

// const productProviders = [
//   { code: 'C01', name: 'PROV. SOFTWARE' },
//   { code: 'C02', name: 'PROV. HARDWARE' },
//   { code: 'C03', name: 'PROV. SERV. NUBE' },
//   { code: 'C04', name: 'PROV. INFRA IT' },
//   { code: 'C05', name: 'PROV. SOPORTE' }
// ]

const productCategories = [
  {
    code: 'C01',
    description: 'Monitores y Periféricos',
  },
  {
    code: 'C02',
    description: 'Accesorios (Teclados, Ratones, etc.)',
  },
];

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
  zipcode: '987654321',
};

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
  zipcode: '987654321',
};

const news = [
  {
    closedOn: null,
    createdOn: '2024-08-05T00:19:58.867Z',
    description: 'test1',
    document: null,
    documentId: null,
    statusId: 1,
    closedBy: 1,
    createdBy: 1,
  },
];

const createVarious = async (tableName, createObjects) => {
  const createdObjects = await prisma[tableName].createMany({
    data: createObjects,
    skipDuplicates: true,
  });
  return Promise.resolve(createdObjects);
};

const create = async (tableName, createObject) => {
  createObject.password = await encryptPassword(createObject.password);
  const createdItem = await prisma[tableName].create({
    data: createObject,
  });
  return Promise.resolve(createdItem);
};

async function main() {
  await createVarious('roles', roles);
  await createVarious('userStatus', userStatus);
  await create('users', user);

  await createVarious('eventTypes', eventTypes);
  await createVarious('permissions', permissions);
  await createVarious('noteColumns', noteColumns);
  await createVarious('newsStatus', newStatus);
  await createVarious('productStatus', productStatus);

  // No necesarios por ahora

  // await createVarious('news', news)
  // await createVarious('productProviders', productProviders)
  // await createVarious('productCategories', productCategories)
}

main()
  .then(async () => {
    console.log('Prisma seaders completed');
    // await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e, 'An error occurred while performing prisma seeders.');
    // await prisma.$disconnect()
    process.exit(1);
  });
