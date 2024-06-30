import { createMany } from '../utils/service.js'
import { saveUser } from '../api/user/model.js'
const categories = [
  {
    name: 'Hamburguesa',
    slug: 'hamburguesa'
  },
  { name: 'Postre', slug: 'postre' },
  { name: 'Bebidas', slug: 'bebidas' }
]

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

const user = {
  firstName: 'admin',
  lastName: 'admin',
  email: 'example@gmail.com',
  password: '123456',
  address: 'Robert Robertson, 1234 NW Bobcat Lane, St. Robert, MO 65584-5678',
  birthday: '12/03/1990',
  city: 'Vegas',
  isAdmin: true,
  
  picture: 'abcd',
  roleId: 1
}

const meals = [
  {
    title: 'Carne con Queso',
    slug: 'carne-con-queso',
    price: 18,
    quantity: 3,
    pictures: ['/img/hamburguer.webp'],
    description: 'Carne con Queso',
    categoryId: 1
  },
  {
    title: 'Carne con Jamon y Queso',
    slug: 'carne-con-jamon-y-queso',
    price: 18,
    quantity: 5,
    pictures: ['/img/hamburguer.webp'],
    description: 'Carne con Jamon y Queso',
    categoryId: 1
  },
  {
    title: 'Veggie',
    slug: 'veggie',
    price: 20,
    quantity: 10,
    pictures: ['/img/hamburguer.webp'],
    description: 'Veggie',
    categoryId: 1
  }
]

async function main () {
  await createMany('category', categories)
  await createMany('roles', roles)
  await saveUser(user)
  await createMany('meal', meals)
}

main()
  .then(async () => {
    console.log('Prisma seaders completed')
  })
  .catch(async (e) => {
    console.error(e, 'An error occurred while performing prisma seeders.')
    process.exit(1)
  })
