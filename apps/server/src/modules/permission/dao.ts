import { prisma, Prisma } from '../../config/db.js';
import type {
  CreateEmployeePermissionData,
  EmployeePermission,
  EmployeePermissionDaoFilters,
  EmployeePermissionListRow,
  EmployeePermissionServiceResult,
  UpdateEmployeePermissionData,
} from './types.js';

/**
 * Get all permissions with optional filters.
 *
 * @param {Object} filters - Filter parameters.
 * @param {number} [filters.employeeId] - Filter by employee ID.
 * @param {string} [filters.type] - Filter by permission type (SICK, PERSONAL, MATERNITY, PATERNITY, OTHER).
 * @param {string} [filters.status] - Filter by status (PENDING, APPROVED, REJECTED).
 * @param {string} [filters.fromDate] - Filter by start date (ISO format).
 * @param {string} [filters.toDate] - Filter by end date (ISO format).
 * @param {number} take - Number of records to retrieve.
 * @param {number} skip - Number of records to skip.
 * @returns {Promise<Object>} Object containing dataList and total count.
 */
export const getAllPermissions = async (
  filters: EmployeePermissionDaoFilters,
  take: number,
  skip: number
): Promise<EmployeePermissionServiceResult> => {
  const whereClauses: Prisma.Sql[] = [];

  if (filters.employeeId) {
    whereClauses.push(
      Prisma.sql`pe."employeeId" = ${Number(filters.employeeId)}`
    );
  }

  if (filters.fromDate) {
    whereClauses.push(Prisma.sql`pe."createdOn" >= ${filters.fromDate}`);
  }

  if (filters.toDate) {
    whereClauses.push(Prisma.sql`pe."createdOn" <= ${filters.toDate}`);
  }

  if (filters.status) {
    // Using ILIKE for case-insensitive search for description
    whereClauses.push(
      Prisma.sql`pe."status" ILIKE ${'%' + filters.status + '%'}`
    );
  }
  if (filters.type) {
    // Using ILIKE for case-insensitive search for description
    whereClauses.push(Prisma.sql`pe."type" ILIKE ${'%' + filters.type + '%'}`);
  }

  const whereSql = whereClauses.length
    ? Prisma.sql`WHERE ${Prisma.join(whereClauses, ' AND ')}`
    : Prisma.empty;

  const permissions = await prisma.$queryRaw<EmployeePermissionListRow[]>`
      SELECT 
        pe.*,
        e.name AS "employeeName",
        u.name AS "userPermissionCreatedName",
        uu.name AS "userPermissionUpdatedName"
      FROM "permission" pe
      LEFT JOIN "employees" e ON pe."employeeId" = e.id
      LEFT JOIN "users" u ON pe."createdBy" = u.id
      LEFT JOIN "users" uu ON pe."updatedBy" = uu.id
      ${whereSql}
      ORDER BY pe."createdOn" DESC
      LIMIT ${take}
      OFFSET ${skip}
    `;
  const total = await prisma.permission.count({
    where: {
      ...(filters.employeeId && {
        employeeId: Number(filters.employeeId),
      }),

      ...(filters.fromDate && {
        createdOn: {
          gte: new Date(filters.fromDate),
        },
      }),

      ...(filters.toDate && {
        createdOn: {
          ...(filters.fromDate ? { gte: new Date(filters.fromDate) } : {}),
          lte: new Date(filters.toDate),
        },
      }),

      // `status` es un enum (permissionStatus): `contains`/`mode` no existen para enums.
      ...(filters.status && {
        status: filters.status,
      }),

      ...(filters.type && {
        type: {
          contains: filters.type,
          mode: 'insensitive', // equivalente a ILIKE
        },
      }),
    },
  });

  return { dataList: permissions, total };
};

/**
 * Create a new permission record.
 *
 * @param {Object} data - Permission data.
 * @param {number} data.employeeId - Employee ID.
 * @param {string} data.type - Permission type (SICK, PERSONAL, MATERNITY, PATERNITY, OTHER).
 * @param {string} data.startDate - Start date (ISO format).
 * @param {string} data.endDate - End date (ISO format).
 * @param {string} data.reason - Reason for permission.
 * @param {string} [data.status] - Permission status (defaults to PENDING).
 * @param {number} [data.approvedBy] - ID of user who approved/rejected.
 * @param {string} [data.comments] - Additional comments.
 * @returns {Promise<Object>} Created permission record with related data.
 */
export const createPermission = async (
  data: CreateEmployeePermissionData
): Promise<EmployeePermission> => {
  return await prisma.permission.create({
    data: {
      createdOn: data.createdOn,
      startDate: data.startDate,
      endDate: data.endDate,
      type: data.type,
      status: data.status,
      employee: {
        connect: { id: data.employeeId },
      },
      userPermissionCreated: {
        connect: { id: data.createdBy },
      },
    },
    include: {
      employee: true,
    },
  });
};

/**
 * Update a permission record by ID.
 *
 * @param {number|string} id - Permission ID.
 * @param {Object} data - Updated permission data.
 * @param {number} [data.employeeId] - Employee ID.
 * @param {string} [data.type] - Permission type.
 * @param {string} [data.startDate] - Start date (ISO format).
 * @param {string} [data.endDate] - End date (ISO format).
 * @param {string} [data.reason] - Reason for permission.
 * @param {string} [data.status] - Permission status.
 * @param {number} [data.approvedBy] - ID of user who approved/rejected.
 * @param {string} [data.comments] - Additional comments.
 * @returns {Promise<Object>} Updated permission record with related data.
 */
export const updatePermissionById = async (
  id: number | string,
  data: UpdateEmployeePermissionData
): Promise<EmployeePermission> => {
  return await prisma.permission.update({
    // Cast: la ruta entrega el `id` de la URL (string) tal cual y el modelo lo
    // declara Int; se preserva ese comportamiento (gap preexistente, fuera de alcance).
    where: { id: id as number },
    data: {
      updatedOn: data.updatedOn,
      startDate: data.startDate,
      endDate: data.endDate,
      type: data.type,
      status: data.status,
      employee: {
        connect: { id: data.employeeId },
      },
      userPermissionUpdated: {
        connect: { id: data.updatedBy },
      },
    },
    include: {
      employee: true,
    },
  });
};

/**
 * Delete a permission record by ID.
 *
 * @param {number|string} id - Permission ID.
 * @returns {Promise<Object>} Deleted permission record.
 */
export const deletePermissionById = async (
  id: number | string
): Promise<EmployeePermission> => {
  return await prisma.permission.delete({
    // Mismo cast documentado que en la actualización.
    where: { id: id as number },
  });
};
