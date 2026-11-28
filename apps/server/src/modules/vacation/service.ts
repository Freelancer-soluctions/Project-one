import {
  getAllVacation as getAllVacationDao,
  createVacation as createVacationDao,
  updateVacationWithBalance as updateVacationWithBalanceDao,
  runVacationAccrual as runVacationAccrualDao,
  getVacationBalance as getVacationBalanceDao,
  deleteVacationById as deleteVacationByIdDao,
} from './dao.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';
import type { vacationStatus } from '@prisma/client';
import { buildApprovalStamps } from '../../utils/approval/approval-stamps.js';
import type {
  VacationCreateData,
  VacationInput,
  VacationsQuery,
  VacationUpdateData,
} from './types.js';

/**
 * Get all vacation records with optional filters.
 *
 * @param {Object} filters - Filter criteria for vacation records.
 * @param {number} [filters.page] - Page number for pagination.
 * @param {number} [filters.limit] - Number of items per page.
 * @param {number} [filters.employeeId] - Filter by employee ID.
 * @param {string} [filters.status] - Filter by vacation status.
 * @param {Date} [filters.startDate] - Filter by start date.
 * @param {Date} [filters.endDate] - Filter by end date.
 * @returns {Promise<Object>} Paginated list of vacation records with metadata.
 * @throws {Error} When pagination parameters are missing or invalid.
 */
export const getAllVacation = async (filters: VacationsQuery) => {
  const { take, skip } = getSafePagination({
    page: filters.page,
    limit: filters.limit,
  });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return await getAllVacationDao(filters, take, skip);
};

/**
 * Create a new vacation record.
 *
 * @param {Object} data - Vacation data to create.
 * @param {number} data.employeeId - Employee ID.
 * @param {Date} data.startDate - Vacation start date.
 * @param {Date} data.endDate - Vacation end date.
 * @param {string} data.type - Vacation type (ANNUAL, SICK, PERSONAL, UNPAID).
 * @param {string} data.status - Vacation status (PENDING, APPROVED, REJECTED, COMPLETED).
 * @param {string} data.reason - Reason for the vacation.
 * @returns {Promise<Object>} Created vacation record.
 */
export const createVacation = async (data: VacationInput, userId?: number) => {
  // Whitelist explícita: nunca se reenvía el body completo (evita forjar trazabilidad).
  const vacation: VacationCreateData = {
    employeeId: Number(data.employeeId),
    startDate: new Date(data.startDate as Date | string),
    endDate: new Date(data.endDate as Date | string),
    status: data.status as vacationStatus | undefined,
    reason: data.reason,
    comments: data.comments,
    paid: data.paid,
    createdBy: userId,
    createdOn: new Date(),
  };
  return await createVacationDao(vacation);
};

/**
 * Delete a vacation record by ID.
 *
 * @param {number} id - ID of the vacation record to delete.
 * @returns {Promise<Object>} Deleted vacation record.
 */
export const deleteVacationById = async (id: number | string) => {
  return await deleteVacationByIdDao(id);
};

/**
 * Partially update a vacation record by ID.
 *
 * @param {number} id - ID of the vacation record to update.
 * @param {Object} data - Partial vacation data to update.
 * @param {number} [data.employeeId] - Employee ID.
 * @param {Date} [data.startDate] - Vacation start date.
 * @param {Date} [data.endDate] - Vacation end date.
 * @param {string} [data.status] - Vacation status (PENDING, APPROVED, REJECTED, COMPLETED).
 * @param {string} [data.type] - Vacation type (ANNUAL, SICK, PERSONAL, UNPAID).
 * @param {string} [data.reason] - Reason for the vacation.
 * @param {number} [data.updatedBy] - ID of the user updating the record.
 * @param {Date} [data.updatedOn] - Update timestamp.
 * @returns {Promise<Object>} Updated vacation record.
 */
export const patchVacationById = async (
  id: number | string,
  data: VacationInput,
  userId?: number
) => {
  // Whitelist explícita (sin spread de `data`): approvedBy/rejectedBy/createdBy
  // nunca llegan a la DAO desde el body; updatedBy siempre viene del token.
  const vacation: VacationUpdateData = {
    employeeId: data.employeeId,
    startDate: data.startDate
      ? new Date(data.startDate as Date | string)
      : undefined,
    endDate: data.endDate ? new Date(data.endDate as Date | string) : undefined,
    status: data.status as vacationStatus | undefined,
    reason: data.reason,
    comments: data.comments,
    paid: data.paid,
    ...buildApprovalStamps(data.status, userId),
    updatedBy: userId,
    updatedOn: new Date(),
  };
  return await updateVacationWithBalanceDao(Number(id), vacation);
};

/**
 * Dispara el devengo mensual manual (RN-VP-013). Valida el periodo YYYY-MM.
 *
 * @param {string} period - Periodo YYYY-MM.
 * @param {number} userId - Usuario autenticado.
 */
export const runVacationAccrual = async (period: string, userId: number) => {
  return await runVacationAccrualDao(period, userId);
};

/**
 * Saldo del empleado para el año; si no existe, todo a cero.
 *
 * @param {number} employeeId - Empleado.
 * @param {number} year - Año.
 */
export const getVacationBalance = async (employeeId: number, year: number) => {
  const row = await getVacationBalanceDao(employeeId, year);
  return {
    employeeId,
    year,
    accrued: Number(row?.accrued ?? 0),
    used: Number(row?.used ?? 0),
    remaining: Number(row?.remaining ?? 0),
  };
};
