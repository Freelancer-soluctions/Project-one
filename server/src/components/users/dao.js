import prisma from '../../config/db.js'

export const getUserRegisteredByEmail = async (email) => {
  const userExist = await prisma.user.findUnique({
    where: {
      email
    },
    include: {
      roles: true
    }
  })
  // email registered
  return userExist ? Promise.resolve(userExist) : Promise.resolve({})
}

export const getRoleByCode = async (code) => {
  const rolUser = await prisma.user.findUnique({
    where: {
      code
    }
  })
  return Promise.resolve(rolUser)
}
