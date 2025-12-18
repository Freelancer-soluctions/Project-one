import { prisma, Prisma } from '../../config/db.js'
// import { decryptSensitiveFields, encryptSensitiveFields } from '../../utils/security/sensitive-transform.js'
import { hashValue } from '../../common/crypto/index.js'
import { decryptResults } from '../../utils/prisma/prisma-query.js'

/**
 * Get all employees with optional filters
 * @param {Object} filters - Optional filters for the query
 * @param {string} [filters.name] - Filter by employee name
 * @param {string} [filters.lastName] - Filter by employee last name
 * @param {string} [filters.dni] - Filter by employee DNI
 * @param {string} [filters.email] - Filter by employee email
 * @param {string} [filters.department] - Filter by employee department
 * @param {string} [filters.position] - Filter by employee position
 * @returns {Promise<Array>} List of employees with their related data
 */
export const getAllEmployees = async (filters = {}) => {
  const whereClauses = []

  if (filters.name) {
    whereClauses.push(Prisma.sql`e."name" ILIKE ${`%${filters.name}%`}`)
  }

  if (filters.lastName) {
    whereClauses.push(Prisma.sql`e."lastName" ILIKE ${`%${filters.lastName}%`}`)
  }

  if (filters.dni) {
    whereClauses.push(Prisma.sql`e."dni_hash" ILIKE ${`%${hashValue(filters.dni)}%`}`)
  }

  if (filters.email) {
    whereClauses.push(Prisma.sql`e."email" ILIKE ${`%${filters.email}%`}`)
  }

  if (filters.department) {
    whereClauses.push(Prisma.sql`e."department" ILIKE ${`%${filters.department}%`}`)
  }

  if (filters.position) {
    whereClauses.push(Prisma.sql`e."position" ILIKE ${`%${filters.position}%`}`)
  }

  const whereSql = whereClauses.length
    ? Prisma.sql`WHERE ${Prisma.join(whereClauses, Prisma.sql` AND `)}`
    : Prisma.empty

  const employees = await prisma.$queryRaw`
  SELECT 
     e.*,
     u.name AS "userEmployeeCreatedName",
     uu.name AS "userEmployeeUpdatedName"
   FROM "employees" e
   LEFT JOIN "users" u ON e."createdBy" = u.id
   LEFT JOIN "users" uu ON e."updatedBy" = uu.id
   ${whereSql}
 `

  // A02 cryptographid failures (cifrado de datos sensibles)
  return decryptResults(employees)
}

/**
 * Create a new employee
 * @param {Object} data - Employee data
 * @param {string} data.name - Employee name
 * @param {string} data.lastName - Employee last name
 * @param {string} data.dni - Employee DNI
 * @param {string} data.email - Employee email
 * @param {string} [data.phone] - Employee phone
 * @param {string} [data.address] - Employee address
 * @param {Date} data.startDate - Employee start date
 * @param {string} data.position - Employee position
 * @param {string} data.department - Employee department
 * @param {number} data.salary - Employee salary
 * @param {number} data.createdBy - User ID who created the employee
 * @returns {Promise<Object>} Created employee with related data
 */
export const createEmployee = async (data) => {
  // A02 cryptographid failures (cifrado de datos sensibles)
  // const encrypt = encryptSensitiveFields(data)
  return prisma.employees.create({
    data: {
      name: data.name,
      lastName: data.lastName,
      dni: data.dni,
      dni_hash: hashValue(data.dni),
      email: data.email,
      phone: data.phone,
      address: data.address,
      startDate: data.startDate,
      position: data.position,
      department: data.department,
      salary: data.salary,
      createdOn: data.createdOn,
      userEmployeeCreated: {
        connect: {
          id: data.createdBy
        }
      }
    }
  })
}

/**
 * Update an employee by ID
 * @param {number} id - Employee ID
 * @param {Object} data - Updated employee data
 * @param {string} [data.name] - Employee name
 * @param {string} [data.lastName] - Employee last name
 * @param {string} [data.dni] - Employee DNI
 * @param {string} [data.email] - Employee email
 * @param {string} [data.phone] - Employee phone
 * @param {string} [data.address] - Employee address
 * @param {Date} [data.startDate] - Employee start date
 * @param {string} [data.position] - Employee position
 * @param {string} [data.department] - Employee department
 * @param {number} [data.salary] - Employee salary
 * @param {number} data.updatedBy - User ID who updated the employee
 * @returns {Promise<Object>} Updated employee with related data
 */
export const updateEmployeeById = async (id, data) => {
  // A02 cryptographid failures (cifrado de datos sensibles)
  // const encrypt = encryptObject(data)
  return prisma.employees.update({
    where: { id },
    data: {
      name: data.name,
      lastName: data.lastName,
      dni: data.dni,
      dni_hash: hashValue(data.dni),
      email: data.email,
      phone: data.phone,
      address: data.address,
      startDate: data.startDate,
      position: data.position,
      department: data.department,
      salary: data.salary,
      updatedOn: data.updatedOn,
      userEmployeeUpdated: {
        connect: {
          id: data.updatedBy
        }
      }
    }
  })
}

/**
 * Delete an employee by ID
 * @param {number} id - Employee ID
 * @returns {Promise<Object>} Deleted employee
 */
export const deleteEmployeeById = async (id) => {
  return prisma.employees.delete({
    where: { id }
  })
}
