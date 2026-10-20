import { prisma, Prisma } from '../../config/db.js';
import type {
  VacationCreateData,
  VacationListItem,
  VacationListFilters,
  VacationUpdateData,
  VacationsPage,
} from './types.js';

/**
 * Get all vacation records with optional filters.
 *
 * @param {Object} filters - Filter criteria for vacation records.
 * @param {number} [filters.employeeId] - Filter by employee ID.
 * @param {'PENDING'|'APPROVED'|'REJECTED'} [filters.status] - Filter by status.
 * @param {Date} [filters.fromDate] - Filter by start date (greater than or equal).
 * @param {Date} [filters.toDate] - Filter by end date (less than or equal).
 * @param {number} take - Number of records to retrieve.
 * @param {number} skip - Number of records to skip.
 * @returns {Promise<Object>} Object containing vacations list and total count.
 */
export const getAllVacation = async (
  filters: VacationListFilters,
  take: number,
  skip: number
): Promise<VacationsPage> => {
  const whereClauses = buildVacationWhereClauses(filters);

  const whereSql = whereClauses.length
    ? Prisma.sql`WHERE ${Prisma.join(whereClauses, ' AND ')}`
    : Prisma.empty;

  const vacations = await prisma.$queryRaw<VacationListItem[]>`
       SELECT 
         va.*,
         e.name AS "employeeName",
         u.name AS "userVacationCreatedName",
         uu.name AS "userVacationUpdatedName"
       FROM "vacation" va
       LEFT JOIN "employees" e ON va."employeeId" = e.id
       LEFT JOIN "users" u ON va."createdBy" = u.id
       LEFT JOIN "users" uu ON va."updatedBy" = uu.id
       ${whereSql}
       ORDER BY va."createdOn" DESC
       LIMIT ${take || 10}
       OFFSET ${skip || 0}
     `;

  const total = await prisma.vacation.count({
    where: {
      ...(filters.employeeId && {
        employeeId: Number(filters.employeeId),
      }),

      ...(filters.fromDate || filters.toDate
        ? {
            createdOn: {
              ...(filters.fromDate && {
                gte: new Date(filters.fromDate),
              }),
              ...(filters.toDate && {
                lte: new Date(filters.toDate),
              }),
            },
          }
        : {}),

      // `status` es un enum (vacationStatus): `contains`/`mode` no existen para enums,
      // la única forma válida en `vacationWhereInput` es la igualdad exacta.
      ...(filters.status && {
        status: filters.status,
      }),
      // `type` NO se filtra: no existe en el modelo `vacation` ni en
      // `vacationFiltersSchema`, y `validateQueryParams` usa `allowUnknown: false`
      // — la rama era inalcanzable.
    },
  });

  return { dataList: vacations, total };
};

/**
 * Builds the raw SQL WHERE fragments for the vacation list query.
 * Kept apart from getAllVacation to keep both small and single-purpose.
 *
 * @param {Object} filters - Filter criteria (employeeId, fromDate, toDate, status).
 * @returns {Array<Object>} Prisma.sql fragments joined later with AND.
 */
const buildVacationWhereClauses = (
  filters: VacationListFilters
): Prisma.Sql[] => {
  const whereClauses: Prisma.Sql[] = [];

  if (filters.employeeId) {
    whereClauses.push(
      Prisma.sql`va."employeeId" = ${Number(filters.employeeId)}`
    );
  }

  if (filters.fromDate) {
    whereClauses.push(Prisma.sql`va."createdOn" >= ${filters.fromDate}`);
  }

  if (filters.toDate) {
    whereClauses.push(Prisma.sql`va."createdOn" <= ${filters.toDate}`);
  }

  if (filters.status) {
    // `status` es un enum: comparar en texto plano (mismo criterio que el count tipado).
    whereClauses.push(Prisma.sql`va."status"::text = ${filters.status}`);
  }

  return whereClauses;
};

/**
 * Create a new vacation record.
 *
 * @param {Object} data - Vacation data to create.
 * @param {number} data.employeeId - ID of the employee.
 * @param {Date} data.startDate - Start date of the vacation.
 * @param {Date} data.endDate - End date of the vacation.
 * @param {string} [data.status] - Status of the vacation (default: PENDING).
 * @param {number} data.createdBy - ID of the user creating the record.
 * @param {Date} data.createdOn - Creation timestamp.
 * @returns {Promise<Object>} Created vacation record.
 */
export const createVacation = async (data: VacationCreateData) => {
  return await prisma.vacation.create({
    data: {
      employeeId: data.employeeId,
      status: data.status ?? 'PENDING',
      createdBy: data.createdBy as number,
      startDate: data.startDate,
      endDate: data.endDate,
      createdOn: data.createdOn,
    },
  });
};

/**
 * Update a vacation record by ID.
 *
 * @param {number} id - ID of the vacation record to update.
 * @param {Object} data - Updated vacation data.
 * @param {number} [data.employeeId] - ID of the employee.
 * @param {Date} [data.startDate] - Start date of the vacation.
 * @param {Date} [data.endDate] - End date of the vacation.
 * @param {string} [data.status] - Status of the vacation.
 * @param {number} [data.updatedBy] - ID of the user updating the record.
 * @param {Date} [data.updatedOn] - Update timestamp.
 * @returns {Promise<Object>} Updated vacation record.
 */
export const updateVacationById = async (
  id: number,
  data: VacationUpdateData
) => {
  const updateData: Prisma.vacationUncheckedUpdateInput = {};
  if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;
  if (data.startDate !== undefined) updateData.startDate = data.startDate;
  if (data.endDate !== undefined) updateData.endDate = data.endDate;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.updatedBy !== undefined) updateData.updatedBy = data.updatedBy;
  if (data.updatedOn !== undefined) updateData.updatedOn = data.updatedOn;
  return await prisma.vacation.update({
    where: { id },
    data: updateData,
  });
};

/**
 * Delete a vacation record by ID.
 *
 * @param {number} id - ID of the vacation record to delete.
 * @returns {Promise<Object>} Deleted vacation record.
 */
export const deleteVacationById = async (id: number | string) => {
  return await prisma.vacation.delete({
    where: { id: parseInt(String(id)) },
  });
};
