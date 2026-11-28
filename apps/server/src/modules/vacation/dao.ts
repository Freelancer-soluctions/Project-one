import { prisma, Prisma } from '../../config/db.js';
import ClientError from '../../utils/responses&Errors/errors.js';
import { accrueMonthly } from './accrual.js';
import { deductVacationBalance, restoreVacationBalance } from './balance.js';
import type {
  VacationCreateData,
  VacationListItem,
  VacationListFilters,
  VacationRecord,
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
         uu.name AS "userVacationUpdatedName", ua.name AS "userVacationApprovedName", ur.name AS "userVacationRejectedName"
       FROM "vacation" va
       LEFT JOIN "employees" e ON va."employeeId" = e.id
       LEFT JOIN "users" u ON va."createdBy" = u.id
       LEFT JOIN "users" uu ON va."updatedBy" = uu.id
        LEFT JOIN "users" ua ON va."approvedBy" = ua.id
        LEFT JOIN "users" ur ON va."rejectedBy" = ur.id
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
      reason: data.reason ?? null,
      comments: data.comments ?? null,
      paid: data.paid ?? true,
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
const buildVacationUpdateData = (
  data: VacationUpdateData
): Prisma.vacationUncheckedUpdateInput => {
  const updateData: Prisma.vacationUncheckedUpdateInput = {};
  if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;
  if (data.startDate !== undefined) updateData.startDate = data.startDate;
  if (data.endDate !== undefined) updateData.endDate = data.endDate;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.reason !== undefined) updateData.reason = data.reason;
  if (data.comments !== undefined) updateData.comments = data.comments;
  if (data.paid !== undefined) updateData.paid = data.paid;
  if (data.approvedBy !== undefined) updateData.approvedBy = data.approvedBy;
  if (data.approvedAt !== undefined) updateData.approvedAt = data.approvedAt;
  if (data.rejectedBy !== undefined) updateData.rejectedBy = data.rejectedBy;
  if (data.rejectedAt !== undefined) updateData.rejectedAt = data.rejectedAt;
  if (data.updatedBy !== undefined) updateData.updatedBy = data.updatedBy;
  if (data.updatedOn !== undefined) updateData.updatedOn = data.updatedOn;
  return updateData;
};

/**
 * Update a vacation record by ID (sin efectos sobre el saldo).
 * Para cambios de estado usar `updateVacationWithBalance`.
 */
export const updateVacationById = async (
  id: number,
  data: VacationUpdateData
) => {
  return await prisma.vacation.update({
    where: { id },
    data: buildVacationUpdateData(data),
  });
};

/**
 * Actualiza una vacación aplicando el efecto sobre el saldo en UNA transacción:
 * - bloquea la fila de la vacación (FOR UPDATE) para evitar doble restauración/descuento;
 * - si estaba APPROVED, devuelve los días anteriores al saldo;
 * - si queda APPROVED, descuenta los días nuevos (400 si no alcanza, rollback completo).
 *
 * @param {number} id - ID de la vacación.
 * @param {VacationUpdateData} data - Campos ya normalizados por el service.
 * @returns {Promise<Object>} Vacación actualizada.
 * @throws {ClientError} 404 si no existe; 400 si el saldo no alcanza.
 */
export const updateVacationWithBalance = async (
  id: number,
  data: VacationUpdateData
) => {
  return await prisma.$transaction(async (tx) => {
    const [current] = await tx.$queryRaw<VacationRecord[]>`
      SELECT * FROM "vacation" WHERE id = ${id} FOR UPDATE
    `;
    if (!current) {
      throw new ClientError('Vacation not found', 404);
    }

    if (current.status === 'APPROVED') {
      await restoreVacationBalance(
        tx,
        current.employeeId,
        current.startDate,
        current.endDate
      );
    }

    const nextStatus = data.status ?? current.status;
    if (nextStatus === 'APPROVED') {
      await deductVacationBalance(
        tx,
        data.employeeId ?? current.employeeId,
        data.startDate ?? current.startDate,
        data.endDate ?? current.endDate
      );
    }

    return await tx.vacation.update({
      where: { id },
      data: buildVacationUpdateData(data),
    });
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

/**
 * Permisos de vacaciones APROBADOS y NO retribuidos (paid = false) que se solapan
 * con el rango dado. Lo usa payroll para descontar la nómina (RN-VP-009).
 *
 * @param {number} employeeId - Empleado.
 * @param {Date} start - Inicio del periodo (inclusive).
 * @param {Date} end - Fin del periodo (inclusive).
 * @returns {Promise<Array<{startDate: Date, endDate: Date}>>}
 */
export const findApprovedUnpaidVacations = async (
  employeeId: number,
  start: Date,
  end: Date
) => {
  return await prisma.vacation.findMany({
    where: {
      employeeId,
      status: 'APPROVED',
      paid: false,
      startDate: { lte: end },
      endDate: { gte: start },
    },
    select: { startDate: true, endDate: true },
  });
};

/**
 * Ejecuta el devengo mensual para todos los empleados en una transacción (RN-VP-013).
 *
 * @param {string} period - Periodo YYYY-MM.
 * @param {number} userId - Usuario que dispara el devengo (queda en el ledger).
 * @returns {Promise<{accrued: number, skipped: number}>}
 */
export const runVacationAccrual = async (period: string, userId: number) => {
  return await prisma.$transaction((tx) =>
    accrueMonthly(tx, { period, userId })
  );
};

/**
 * Saldo de vacaciones de un empleado para un año (null si aún no existe).
 *
 * @param {number} employeeId - Empleado.
 * @param {number} year - Año del saldo.
 */
export const getVacationBalance = async (employeeId: number, year: number) => {
  return await prisma.vacationBalance.findUnique({
    where: { employeeId_year: { employeeId, year } },
  });
};
