import { prisma, Prisma } from '../../config/db.js'
import { decryptResults } from '../../utils/prisma/prisma-query.js'

/**
 * Get all users with optional filters
 * @param {Object} filters - Optional filters for the query
 * @param {string} [filters.name] - Filter by user name
 * @param {string} [filters.email] - Filter by user email
 * @param {number} take- take to filter by
 * @param {number} skip - skip to filter by
 * @returns {Promise<Array>} List of users with their related data
 */
export const getAllUsers = async (filters = {}, take, skip) => {
  console.log('take, skip', take, skip)
  const whereClauses = []

  if (filters.name) {
    Prisma.sql`c."name" ILIKE ${'%' + filters.name + '%'}`
  }

  if (filters.email) {
    whereClauses.push(Prisma.sql`u."email" ILIKE ${filters.email}`)
  }

  if (filters.status) {
    whereClauses.push(Prisma.sql`s."code" = ${filters.status}`)
  }

  const whereSql = whereClauses.length
    ? Prisma.sql`WHERE ${Prisma.join(whereClauses, Prisma.sql` AND `)}`
    : Prisma.empty

  const users = await prisma.$queryRaw`
   SELECT 
      u.*,
      uu.name AS "lastUpdatedByName",
      s.description AS "statusDescription",
      s.code AS "statusCode",
      s.id AS "statusId",
      r.description AS "roleDescription",
      r.code AS "roleCode",
      r.id AS "roleId"
    FROM "users" u
    LEFT JOIN "users" uu ON u."lastUpdatedBy" = uu.id
    LEFT JOIN "userStatus" s ON u."statusId" = s.id
    LEFT JOIN "roles" r ON u."roleId" = r.id
    ${whereSql}
    ORDER BY u."startDate" DESC
    LIMIT ${take}
    OFFSET ${skip}

  `

  // A02 cryptographid failures (cifrado de datos sensibles)
  return decryptResults(users)
}

/**
 * Retrieves all available user permissions from the database.
 *
 * @returns {Promise<object>} A object of Permissions and user.
 */

export const getAllUserPermits = async (id) => {
  const allPermissions = await prisma.permissions.findMany({
    select: {
      id: true,
      description: true,
      code: true
    },
    orderBy: { code: 'asc' }
  })

  const user = await prisma.users.findUnique({
    where: { id },
    include: {
      userPermits: true
    }
  })
  return Promise.resolve({ allPermissions, user })
}

/**
 * Retrieves all available users statuses from the database.
 *
 * @returns {Promise<Array>} A list of users statuses.
 */

export const getAllUsersStatus = async () => {
  const status = await prisma.userStatus.findMany()
  return Promise.resolve(status)
}

/**
 * Retrieves all available users roles from the database.
 *
 * @returns {Promise<Array>} A list of users roles.
 */

export const getAllUsersRoles = async () => {
  const roles = await prisma.roles.findMany()
  return Promise.resolve(roles)
}

/**
 * Create a new user.
 * The password should be hashed before calling this function (e.g., in the service layer).
 * @async
 * @param {object} data - User data.
 * @param {string} data.name - User's name.
 * @param {string} data.email - User's email (must be unique).
 * @param {string} data.password - User's hashed password.
 * @param {Date} data.birthday - User's birthday.
 * @param {number} data.roleId - ID of the user's role.
 * @param {number} data.statusId - ID of the user's status.
 * @param {number} data.userPermitId - ID of the user's permit settings.
 * @param {number} data.lastUpdatedBy - ID of the user creating this user record.
 * @param {string} data.socialSecurity - User's social security number.
 * @param {Date} data.startDate - User's start date.
 * @param {string} data.telephone - User's telephone number.
 * @param {string} data.zipcode - User's zipcode.
 * @param {string} [data.address] - User's address (optional).
 * @param {string} [data.city] - User's city (optional).
 * @param {boolean} [data.isAdmin=false] - Whether the user is an admin (optional).
 * @param {string} [data.picture] - URL to user's picture (optional).
 * @param {string} [data.document] - User's document identifier (optional).
 * @param {string} [data.state] - User's state (optional).
 * @param {string} [data.refreshToken] - User's refresh token (optional).
 * @returns {Promise&lt;object&gt;} The created user object.
 */
export const createUser = async (data) => {
  return prisma.users.create({
    data: {
      name: data.name,
      email: data.email,
      password: data.password, // Assume password is pre-hashed
      address: data.address,
      birthday: data.birthday,
      city: data.city,
      isAdmin: data.isAdmin,
      picture: data.picture,
      document: data.document,
      lastUpdatedBy: data.lastUpdatedBy,
      lastUpdatedOn: new Date(),
      roleId: data.roleId,
      socialSecurity: data.socialSecurity,
      startDate: data.startDate,
      state: data.state,
      statusId: data.statusId,
      telephone: data.telephone,
      zipcode: data.zipcode,
      refreshToken: data.refreshToken,
      userPermitId: data.userPermitId
      // Prisma will handle connecting to roles, userStatus, userPermits via FKs (roleId, statusId, userPermitId)
    },
    include: {
      roles: true,
      status: true,
      userPermits: true
    }
  })
}

/**
 * Update an existing user by ID.
 * The password, if provided, should be hashed before calling this function.
 * @async
 * @param {number} id - The ID of the user to update.
 * @param {object} data - Data to update for the user.
 * @param {number} data.lastUpdatedBy - ID of the user performing the update.
 * @param {string} [data.name] - User's name.
 * @param {string} [data.email] - User's email (must be unique).
 * @param {string} [data.password] - User's hashed password.
 * @param {Date} [data.birthday] - User's birthday.
 * @param {number} [data.roleId] - ID of the user's role.
 * @param {number} [data.statusId] - ID of the user's status.
 * @param {number} [data.userPermitId] - ID of the user's permit settings.
 * @param {string} [data.socialSecurity] - User's social security number.
 * @param {Date} [data.startDate] - User's start date.
 * @param {string} [data.telephone] - User's telephone number.
 * @param {string} [data.zipcode] - User's zipcode.
 * @param {string} [data.address] - User's address.
 * @param {string} [data.city] - User's city.
 * @param {boolean} [data.isAdmin] - Whether the user is an admin.
 * @param {string} [data.picture] - URL to user's picture.
 * @param {string} [data.document] - User's document identifier.
 * @param {string} [data.state] - User's state.
 * @param {string} [data.refreshToken] - User's refresh token.

 * @returns {Promise&lt;object&gt;} The updated user object.
 */
export const updateUserById = async (id, data) => {
  return prisma.users.update({
    where: { id: parseInt(id, 10) },
    data: {
      name: data.name,
      email: data.email,
      address: data.address,
      city: data.city,
      isAdmin: data.isAdmin,
      picture: data.picture,
      document: data.document,
      lastUpdatedBy: data.lastUpdatedBy,
      lastUpdatedOn: data.lastUpdatedOn,
      socialSecurity: data.socialSecurity,
      state: data.state,
      telephone: data.telephone,
      zipcode: data.zipcode,
      // foreign keys
      userStatus: {
        connect: { id: data.statusId }
      },
      roles: {
        connect: { id: data.roleId }
      },
      // rolePermits: {
      //   deleteMany: {}, // elimina TODAS las relaciones actuales
      //   create: data.permissions.map((permissionId) => ({
      //     permission: { connect: { id: permissionId } }
      //   }))
      // }
      userPermits: {
        deleteMany: {}, // elimina solo los permisos del usuario actual
        create: data.permissions.map((permissionId) => ({
          permission: { connect: { id: parseInt(permissionId, 10) } }
        }))
      }
    }
  })
}

/**
 * Delete a user by ID.
 * @async
 * @param {number} id - The ID of the user to delete.
 * @returns {Promise&lt;object&gt;} The deleted user object.
 */
export const deleteUserById = async (id) => {
  return prisma.users.delete({
    where: { id: parseInt(id, 10) }
  })
}

/**
 * Get a user by email.
 * Useful for checking if an email already exists or for login purposes.
 * @async
 * @param {string} email - The email of the user to retrieve.
 * @returns {Promise&lt;object|null&gt;} The user object or null if not found.
 */
export const getUserByEmail = async (email) => {
  return prisma.users.findUnique({
    where: { email },
    include: {
      roles: true,
      status: true,
      userPermits: true
    }
  })
}

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

export const getUserRoleByCode = async (code) => {
  const rolUser = await prisma.roles.findUnique({
    where: {
      code
    }
  })
  return Promise.resolve(rolUser)
}
// ya no es necesario se pasa token a una tabla independiente
// /**
//  * Get user by refresh token.
//  *
//  * @param {string} refreshToken - The refresh token to search for.
//  * @returns {Promise<Object>} The user associated with the token.
//  */
// export const getUserByToken = async (refreshToken) => {
//   const user = await prisma.users.findUnique({
//     where: { refreshToken },
//     include: { roles: true }
//   })

//   return Promise.resolve(user)
// }

export const getUserRoleByUserId = async (id) => {
  const user = await prisma.users.findUnique({
    where: {
      id
    },
    include: {
      roles: true,

      userPermits: {
        include: {
          permissions: true
        }
      }
    }

  })
  return Promise.resolve(user)
}
