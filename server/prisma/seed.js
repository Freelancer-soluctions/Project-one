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
  }
]

const userPermits = [
  {
    accessConfiguration: true,
    accessNews: true
  }
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
  zipcode: '987654321',
  userPermitId: 1
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
/*   await createVarious('roles', roles)
  await createVarious('userPermits', userPermits)
  await createVarious('userStatus', userStatus)
  await create('users', user) */

  /*   await createVarious('noteColumns', noteStatus)
  await createVarious('eventTypes', eventTypes) */

  await createVarious('newsStatus', newStatus)
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
