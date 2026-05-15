import {
  getAllAttendance as getAllAttendanceService,
  createAttendance as createAttendanceService,
  updateAttendanceById as updateAttendanceByIdService,
  deleteAttendanceById as deleteAttendanceByIdService,
} from './service.js';
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js';
import globalResponse from '../../utils/responses&Errors/globalResponse.js';

/**
 * Get all attendance records with optional filters.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.safeQuery - Safe query parameters with filters
 * @param {number} [req.safeQuery.page] - Page number for pagination
 * @param {number} [req.safeQuery.limit] - Number of items per page
 * @param {number} [req.safeQuery.employeeId] - Filter by employee ID
 * @param {Date} [req.safeQuery.startDate] - Filter by start date
 * @param {Date} [req.safeQuery.endDate] - Filter by end date
 * @param {string} [req.safeQuery.status] - Filter by attendance status
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns paginated list of attendance records
 */
export const getAllAttendance = handleCatchErrorAsync(async (req, res) => {
  const attendance = await getAllAttendanceService(req.safeQuery);
  globalResponse(res, 200, attendance);
});

/**
 * Create a new attendance record.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing attendance data
 * @param {number} req.body.employeeId - Employee ID
 * @param {Date} req.body.date - Attendance date
 * @param {Date} req.body.checkInTime - Check-in time
 * @param {Date} req.body.checkOutTime - Check-out time
 * @param {string} req.body.status - Attendance status (PRESENT, ABSENT, LATE, HALF_DAY)
 * @param {string} req.body.notes - Attendance notes
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Creates new attendance record and returns attendance object
 */
export const createAttendance = handleCatchErrorAsync(async (req, res) => {
  const attendance = await createAttendanceService(
    {
      ...req.body,
    },
    req.userId
  );
  globalResponse(res, 201, attendance);
});

/**
 * Update an attendance record by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Attendance ID from URL
 * @param {Object} req.body - Request body containing attendance data to update
 * @param {Date} [req.body.checkInTime] - Check-in time
 * @param {Date} [req.body.checkOutTime] - Check-out time
 * @param {string} [req.body.status] - Attendance status (PRESENT, ABSENT, LATE, HALF_DAY)
 * @param {string} [req.body.notes] - Attendance notes
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Updates attendance record and returns updated attendance object
 */
export const updateAttendanceById = handleCatchErrorAsync(async (req, res) => {
  const attendance = await updateAttendanceByIdService(
    req.params.id,
    {
      ...req.body,
    },
    req.userId
  );
  globalResponse(res, 200, attendance);
});

/**
 * Delete an attendance record by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Attendance ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Deletes attendance record and returns confirmation message
 */
export const deleteAttendanceById = handleCatchErrorAsync(async (req, res) => {
  await deleteAttendanceByIdService(req.params.id);
  globalResponse(res, 200, {
    message: 'Attendance record deleted successfully',
  });
});
