import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Get all users with optional filters
 * @param {Object} filters - Optional filters for the query
 * @param {string} [filters.name] - Filter by user name
 * @param {string} [filters.email] - Filter by user email
 * @returns {Promise<Array>} List of users with their related data
 */
export const getAllUsers = async (filters = {}) => {
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
      r.id AS "roleId",
      up."accessConfiguration" AS "accessConfiguration",
      up."accessNews" AS "accessNews"
    
 

    FROM "users" u
    LEFT JOIN "users" uu ON u."lastUpdatedBy" = uu.id
    LEFT JOIN "userStatus" s ON u."statusId" = s.id
    LEFT JOIN "roles" r ON u."roleId" = r.id
    LEFT JOIN "userPermits" up ON u."userPermitId" = up.id
    ${whereSql}
  `
  return users
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
 * @param {string} [data.accessConfiguration] - User's access configuration.
 * @param {string} [data.accessNews] - User's access news.
 * @returns {Promise&lt;object&gt;} The updated user object.
 */
export const updateUserById = async (id, data) => {
  console.log('Updating user with ID:', id, 'Data:', data)
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
      userPermits: {
        update: {
          accessConfiguration: data.accessConfiguration,
          accessNews: data.accessNews
        }
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

export const getRoleByCode = async (code) => {
  const rolUser = await prisma.user.findUnique({
    where: {
      code
    }
  })
  return Promise.resolve(rolUser)
}
