import * as payrollDao from './dao.js';
import type {
  CreatePayrollData,
  CreatePayrollInput,
  Payroll,
  PayrollFilters,
  PayrollServiceResult,
  UpdatePayrollInput,
} from './types.js';
import { getSafePagination } from '../../utils/pagination/pagination.js';
import { findApprovedUnpaidVacations } from '../vacation/dao.js';
import {
  computeUnpaidLeaveDeduction,
  periodBounds,
} from './leave-deduction.js';
import ClientError from '../../utils/responses&Errors/errors.js';

/**
 * Get all payroll records with optional filters.
 *
 * @param {Object} filters - Optional filters for the query.
 * @param {number} [filters.page] - Page number for pagination.
 * @param {number} [filters.limit] - Number of items per page.
 * @param {number} [filters.employeeId] - Filter by employee ID.
 * @param {string} [filters.period] - Filter by payroll period.
 * @param {string} [filters.status] - Filter by payroll status.
 * @returns {Promise<Object>} Paginated list of payroll records with metadata.
 * @throws {Error} When pagination parameters are missing or invalid.
 */
export const getAllPayroll = async (
  filters: PayrollFilters
): Promise<PayrollServiceResult> => {
  const { take, skip } = getSafePagination({
    page: filters.page,
    limit: filters.limit,
  });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return await payrollDao.getAllPayroll(filters, take, skip);
};

/**
 * Create a new payroll record.
 *
 * @param {Object} data - Payroll data.
 * @param {number} data.employeeId - Employee ID.
 * @param {string} data.period - Payroll period (e.g., "2024-01").
 * @param {number} data.baseSalary - Base salary amount.
 * @param {number} data.extraHours - Extra hours amount.
 * @param {number} data.deductions - Total deductions.
 * @param {number} data.totalPayment - Total payment amount.
 * @param {string} data.status - Payroll status (DRAFT, PAID, CANCELLED).
 * @param {number} userId - User ID who created the payroll.
 * @returns {Promise<Object>} Created payroll record.
 */
export const createPayroll = async (
  data: CreatePayrollInput,
  userId: number
): Promise<Payroll> => {
  // Se declara el payload del dao en lugar de confiar en la inferencia: los
  // importes ya se normalizan a `string` justo debajo.
  // Descuento por permisos no retribuidos aprobados en el periodo (RN-VP-009).
  // El Joi de creación exige month/year; el periodo YYYY-MM se deriva de ellos.
  const period = `${data.year}-${String(data.month).padStart(2, '0')}`;
  const { start, end } = periodBounds(period);
  const leaves = await findApprovedUnpaidVacations(
    Number(data.employeeId),
    start,
    end
  );
  const { deduction } = computeUnpaidLeaveDeduction(
    Number(data.baseSalary),
    period,
    leaves
  );
  const netTotalPayment = Math.max(
    0,
    Math.round((Number(data.totalPayment) - deduction) * 100) / 100
  );

  const payroll: CreatePayrollData = {
    ...data,
    baseSalary: String(data.baseSalary),
    extraHours: String(data.extraHours),
    deductions: String(data.deductions),
    totalPayment: String(netTotalPayment),
    createdOn: new Date(),
    createdBy: userId,
  };
  return await payrollDao.createPayroll(payroll);
};

/**
 * Delete a payroll record by ID.
 *
 * @param {number} id - Payroll ID.
 * @returns {Promise<Object>} Deleted payroll record.
 */
export const deletePayrollById = async (
  id: number | string
): Promise<Payroll> => {
  return await payrollDao.deletePayrollById(Number(id));
};

/**
 * Partially update a payroll record by ID.
 *
 * @param {number} id - Payroll ID.
 * @param {Object} data - Partial payroll data to update.
 * @param {number} userId - ID of the user performing the update.
 * @returns {Promise<Object>} Updated payroll record.
 */
/* eslint-disable complexity */
export const updatePayrollByIdPartial = async (
  id: number | string,
  data: UpdatePayrollInput,
  userId: number
): Promise<Payroll> => {
  const touchesAmountOrPeriod =
    data.totalPayment !== undefined ||
    data.employeeId !== undefined ||
    data.month !== undefined ||
    data.year !== undefined;

  let totalPayment: string | undefined;
  if (touchesAmountOrPeriod) {
    const stored = await payrollDao.getPayrollById(Number(id));
    if (!stored) {
      throw new ClientError('Payroll not found', 404);
    }
    if (
      data.totalPayment === undefined &&
      (data.employeeId !== undefined ||
        data.month !== undefined ||
        data.year !== undefined)
    ) {
      // El neto almacenado ya tiene descontado el periodo original: sin el bruto
      // no se puede recalcular para otro empleado o periodo.
      throw new ClientError(
        'totalPayment is required when changing employee or period',
        400
      );
    }
    // totalPayment se trata como bruto (igual que en la creación) y se descuenta
    // con el empleado y periodo efectivos.
    if (data.totalPayment !== undefined) {
      const employeeId = Number(data.employeeId ?? stored.employeeId);
      const month = data.month ?? stored.month;
      const year = data.year ?? stored.year;
      const period = `${year}-${String(month).padStart(2, '0')}`;
      const baseSalary = Number(data.baseSalary ?? stored.baseSalary);
      const { start, end } = periodBounds(period);
      const leaves = await findApprovedUnpaidVacations(employeeId, start, end);
      const { deduction } = computeUnpaidLeaveDeduction(
        baseSalary,
        period,
        leaves
      );
      totalPayment = String(
        Math.max(
          0,
          Math.round((Number(data.totalPayment) - deduction) * 100) / 100
        )
      );
    }
  }

  const payroll = {
    ...data,
    ...(totalPayment !== undefined && { totalPayment }),
    updatedOn: new Date(),
    updatedBy: userId,
  };
  return await payrollDao.updatePayrollById(id, payroll);
};
/* eslint-enable complexity */
