import { getUserRoleByUserId } from '../users/service.js';
import { resolveApprovalAccess } from '../../middleware/requireApprovalPermission.js';
import {
  getAllVacation as getAllVacationService,
  createVacation as createVacationService,
  deleteVacationById as deleteVacationByIdService,
  patchVacationById as patchVacationByIdService,
  runVacationAccrual as runVacationAccrualService,
  getVacationBalance as getVacationBalanceService,
} from './service.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import type { VacationInput, VacationsQuery } from './types.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';

/**
 * Get all vacation records with optional filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Safe query parameters with filters
 * @param {number} [req.safeQuery.page] - Page number for pagination
 * @param {number} [req.safeQuery.limit] - Number of items per page
 * @param {number} [req.safeQuery.employeeId] - Filter by employee ID
 * @param {string} [req.safeQuery.status] - Filter by vacation status
 * @param {Date} [req.safeQuery.startDate] - Filter by start date
 * @param {Date} [req.safeQuery.endDate] - Filter by end date
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns paginated list of vacation records
 */
export const getAllVacation = handleCatchErrorAsync(async (req, res) => {
  const filters = req.safeQuery as VacationsQuery;
  const data = await getAllVacationService(filters);
  return globalResponse(res, 200, data);
});

/**
 * Create a new vacation record.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing vacation data
 * @param {number} req.body.employeeId - Employee ID
 * @param {Date} req.body.startDate - Vacation start date
 * @param {Date} req.body.endDate - Vacation end date
 * @param {string} req.body.type - Vacation type (ANNUAL, SICK, PERSONAL, UNPAID)
 * @param {string} req.body.status - Vacation status (PENDING, APPROVED, REJECTED, COMPLETED)
 * @param {string} req.body.reason - Reason for the vacation
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Creates new vacation record and returns vacation object
 */
export const createVacation = handleCatchErrorAsync(async (req, res) => {
  const data = await createVacationService(
    req.body as VacationInput,
    req.userId as number
  );
  return globalResponse(res, 201, data);
});

/**
 * Delete a vacation record by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Vacation ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Deletes vacation record and returns confirmation message
 */
export const deleteVacationById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  const data = await deleteVacationByIdService(Number(id));
  return globalResponse(res, 200, data, 'Vacation record deleted successfully');
});

/**
 * Partially update a vacation record by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Vacation ID from URL
 * @param {Object} req.body - Request body containing vacation data to update
 * @param {number} [req.body.employeeId] - Employee ID
 * @param {Date} [req.body.startDate] - Vacation start date
 * @param {Date} [req.body.endDate] - Vacation end date
 * @param {string} [req.body.status] - Vacation status (PENDING, APPROVED, REJECTED)
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Updates vacation record and returns updated vacation object
 */
export const patchVacationById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params;
  const data = await patchVacationByIdService(
    Number(id),
    req.body as VacationInput,
    req.userId as number
  );
  return globalResponse(res, 200, data);
});

/**
 * POST /v1/vacation/accrual — devengo mensual manual (solo ADMIN en las rutas).
 *
 * @param {Object} req.body - { period: 'YYYY-MM' }
 */
export const runAccrual = handleCatchErrorAsync(async (req, res) => {
  const { period } = req.body as { period: string };
  const data = await runVacationAccrualService(period, req.userId as number);
  return globalResponse(res, 200, data, 'Vacation accrual processed');
});

/**
 * GET /v1/vacation/balance?employeeId&year — saldo de vacaciones del empleado.
 */
export const getBalance = handleCatchErrorAsync(async (req, res) => {
  const { employeeId, year } = req.safeQuery as unknown as {
    employeeId: number;
    year: number;
  };
  const data = await getVacationBalanceService(
    Number(employeeId),
    Number(year)
  );
  return globalResponse(res, 200, data);
});

/**
 * GET /v1/vacation/approval-access — capacidad de aprobar del usuario autenticado
 * (solo booleanos; la UI la usa para habilitar las transiciones de estado).
 */
export const getApprovalAccess = handleCatchErrorAsync(async (req, res) => {
  const user = await getUserRoleByUserId(req.userId as number);
  return globalResponse(res, 200, resolveApprovalAccess(user));
});
