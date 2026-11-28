import { prisma, Prisma } from '../../config/db.js';
import { hashValue } from '../../common/crypto/index.js';
import { decryptResults } from '../../utils/prisma/prisma-query.js';
import { escapeLike } from '../../utils/sql/escapeLike.js';
import type {
  CreateEmployeeData,
  Employee,
  EmployeeDaoFilters,
  EmployeeListRow,
  EmployeeServiceResult,
  UpdateEmployeeData,
} from './types.js';

/**
 * Builds the raw SQL WHERE fragments for the employee list query.
 * Kept apart from getAllEmployees to keep both small and single-purpose.
 *
 * @param {Object} filters - Filter parameters (name, lastName, dni, email, departmentId, positionId).
 * @returns {Array<Object>} Prisma.sql fragments joined later with AND.
 */
const buildEmployeeWhereClauses = (
  filters: EmployeeDaoFilters
): Prisma.Sql[] => {
  const whereClauses: Prisma.Sql[] = [];

  // User text is escaped so `%` and `_` match literally (no wildcard widening).
  if (filters.name) {
    whereClauses.push(
      Prisma.sql`e."name" ILIKE ${`%${escapeLike(filters.name)}%`}`
    );
  }

  if (filters.lastName) {
    whereClauses.push(
      Prisma.sql`e."lastName" ILIKE ${`%${escapeLike(filters.lastName)}%`}`
    );
  }

  if (filters.dni) {
    whereClauses.push(
      Prisma.sql`e."dni_hash" ILIKE ${`%${escapeLike(hashValue(filters.dni))}%`}`
    );
  }

  if (filters.email) {
    whereClauses.push(
      Prisma.sql`e."email" ILIKE ${`%${escapeLike(filters.email)}%`}`
    );
  }

  if (filters.departmentId) {
    whereClauses.push(Prisma.sql`e."departmentId" = ${filters.departmentId}`);
  }

  if (filters.positionId) {
    whereClauses.push(Prisma.sql`e."positionId" = ${filters.positionId}`);
  }

  return whereClauses;
};

/**
 * Get all employees with optional filters.
 *
 * The list joins the `positions`/`departments` catalogs and aliases their
 * names as `position`/`department` so consumers keep a single stable shape.
 * Columns are listed explicitly (no `e.*`) to keep the aliases unambiguous.
 *
 * @param {Object} filters - Filter parameters.
 * @param {string} [filters.name] - Filter by employee name.
 * @param {string} [filters.lastName] - Filter by employee last name.
 * @param {string} [filters.dni] - Filter by employee DNI.
 * @param {string} [filters.email] - Filter by employee email.
 * @param {number} [filters.departmentId] - Filter by department catalog id.
 * @param {number} [filters.positionId] - Filter by position catalog id.
 * @param {number} take - Number of records to retrieve.
 * @param {number} skip - Number of records to skip.
 * @returns {Promise<Object>} Object containing dataList and total count.
 */
export const getAllEmployees = async (
  filters: EmployeeDaoFilters = {},
  take: number,
  skip: number
): Promise<EmployeeServiceResult> => {
  const whereClauses = buildEmployeeWhereClauses(filters);

  const whereSql = whereClauses.length
    ? Prisma.sql`WHERE ${Prisma.join(whereClauses, ' AND ')}`
    : Prisma.empty;

  const employees = await prisma.$queryRaw<EmployeeListRow[]>`
  SELECT
     e."id",
     e."name",
     e."lastName",
     e."dni_hash",
     e."dni",
     e."phone",
     e."email",
     e."address",
     e."startDate",
     e."positionId",
     e."departmentId",
     e."salary",
     e."createdBy",
     e."updatedBy",
     e."createdOn",
     e."updatedOn",
     p."name" AS "position",
     d."name" AS "department",
     u."name" AS "userEmployeeCreatedName",
     uu."name" AS "userEmployeeUpdatedName"
   FROM "employees" e
   LEFT JOIN "positions" p ON e."positionId" = p."id"
   LEFT JOIN "departments" d ON e."departmentId" = d."id"
   LEFT JOIN "users" u ON e."createdBy" = u.id
   LEFT JOIN "users" uu ON e."updatedBy" = uu.id
   ${whereSql}
   ORDER BY e."createdOn" DESC
   LIMIT ${take}
   OFFSET ${skip}
 `;

  // A02 cryptographid failures (cifrado de datos sensibles)
  const dataList = decryptResults(employees);

  // Same WHERE fragment as the list query, so the total can never drift from it.
  const countRows = await prisma.$queryRaw<Array<{ total: number }>>`
    SELECT COUNT(*)::int AS "total"
    FROM "employees" e
    ${whereSql}
  `;
  const total = countRows[0]?.total ?? 0;

  return { dataList, total };
};

/**
 * Get all employees for UI filters.
 *
 * @returns {Promise<Array>} List of all employees.
 */
export const getAllEmployeesFilters = async (): Promise<Employee[]> => {
  return await prisma.employees.findMany();
};

/**
 * Create a new employee.
 *
 * @param {Object} data - Employee data.
 * @param {string} data.name - Employee name.
 * @param {string} data.lastName - Employee last name.
 * @param {string} data.dni - Employee DNI.
 * @param {string} data.email - Employee email.
 * @param {string} [data.phone] - Employee phone.
 * @param {string} [data.address] - Employee address.
 * @param {Date} data.startDate - Employee start date.
 * @param {number} data.positionId - Position catalog id.
 * @param {number} data.departmentId - Department catalog id.
 * @param {number} data.salary - Employee salary.
 * @param {number} data.createdBy - User ID who created the employee.
 * @returns {Promise<Object>} Created employee with related data.
 */
export const createEmployee = async (
  data: CreateEmployeeData
): Promise<Employee> => {
  return prisma.employees.create({
    data: {
      name: data.name,
      lastName: data.lastName,
      dni: data.dni,
      dni_hash: hashValue(data.dni!),
      email: data.email,
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.address !== undefined && { address: data.address }),
      startDate: data.startDate,
      position: { connect: { id: data.positionId } },
      department: { connect: { id: data.departmentId } },
      salary: data.salary,
      createdOn: data.createdOn,
      userEmployeeCreated: {
        connect: {
          id: data.createdBy,
        },
      },
    },
  });
};

/**
 * Update an employee by ID.
 *
 * @param {number} id - Employee ID.
 * @param {Object} data - Updated employee data.
 * @param {string} [data.name] - Employee name.
 * @param {string} [data.lastName] - Employee last name.
 * @param {string} [data.dni] - Employee DNI.
 * @param {string} [data.email] - Employee email.
 * @param {string} [data.phone] - Employee phone.
 * @param {string} [data.address] - Employee address.
 * @param {Date} [data.startDate] - Employee start date.
 * @param {number} [data.positionId] - Position catalog id.
 * @param {number} [data.departmentId] - Department catalog id.
 * @param {number} [data.salary] - Employee salary.
 * @param {number} data.updatedBy - User ID who updated the employee.
 * @returns {Promise<Object>} Updated employee with related data.
 */
export const updateEmployeeById = async (
  id: number,
  data: UpdateEmployeeData
): Promise<Employee> => {
  return prisma.employees.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      // `dni_hash` solo se recalcula cuando el PATCH trae `dni`: hashear
      // `undefined` rompía cualquier actualización parcial (p. ej. cambiar
      // solo positionId/departmentId).
      ...(data.dni !== undefined && {
        dni: data.dni,
        dni_hash: hashValue(data.dni),
      }),
      ...(data.email !== undefined && { email: data.email }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.address !== undefined && { address: data.address }),
      ...(data.startDate !== undefined && { startDate: data.startDate }),
      ...(data.positionId !== undefined && {
        position: { connect: { id: data.positionId } },
      }),
      ...(data.departmentId !== undefined && {
        department: { connect: { id: data.departmentId } },
      }),
      ...(data.salary !== undefined && { salary: data.salary }),
      updatedOn: data.updatedOn,
      userEmployeeUpdated: {
        ...(data.updatedBy !== undefined && {
          connect: {
            id: data.updatedBy,
          },
        }),
      },
    },
  });
};

/**
 * Delete an employee by ID.
 *
 * @param {number} id - Employee ID.
 * @returns {Promise<Object>} Deleted employee.
 */
export const deleteEmployeeById = async (id: number): Promise<Employee> => {
  return prisma.employees.delete({
    where: { id },
  });
};

/**
 * Check whether a position catalog row exists.
 *
 * @param {number} id - Position ID.
 * @returns {Promise<boolean>} True when the position exists.
 */
export const positionExists = async (id: number): Promise<boolean> => {
  const count = await prisma.positions.count({ where: { id } });
  return count > 0;
};

/**
 * Check whether a department catalog row exists.
 *
 * @param {number} id - Department ID.
 * @returns {Promise<boolean>} True when the department exists.
 */
export const departmentExists = async (id: number): Promise<boolean> => {
  const count = await prisma.departments.count({ where: { id } });
  return count > 0;
};
