import prisma from '../../config/db.js'

/**  sign up
 * @param {object} user
*/
export const signUp = async (user) => {
  const userRes = await prisma.user.create({
    data: user
  })
  return Promise.resolve(userRes)
}

/**  get user by email
 * @param {email} email
*/
export const signIn = async (email) => {
  const user = await prisma.user.findUnique({
    where: {
      email
    },
    include: {
      roles: true
    }
  })

  return Promise.resolve(user)
}

/**  get session by id
 * @param {id} id
*/
export const session = async (id) => {
  const user = await prisma.user.findUnique({
    where: {
      id
    },
    include: {
      roles: true
    }
  })

  return Promise.resolve(user)
}
