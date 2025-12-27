import {
  getAllAttendance as getAllAttendanceService,
  createAttendance as createAttendanceService,
  updateAttendanceById as updateAttendanceByIdService,
  deleteAttendanceById as deleteAttendanceByIdService
} from './service.js'
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'
import globalResponse from '../../utils/responses&Errors/globalResponse.js'

/**
 * Get all attendance records with optional filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllAttendance = handleCatchErrorAsync(async (req, res) => {
  const attendance = await getAllAttendanceService(req.query)
  globalResponse(res, 200, attendance)
})

/**
 * Create a new attendance record
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createAttendance = handleCatchErrorAsync(async (req, res) => {
  const attendance = await createAttendanceService(
    {
      ...req.body
    },
    req.userId
  )
  globalResponse(res, 201, attendance)
})

/**
 * Update an attendance record by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateAttendanceById = handleCatchErrorAsync(async (req, res) => {
  const attendance = await updateAttendanceByIdService(req.params.id, {
    ...req.body
  }, req.userId)
  globalResponse(res, 200, attendance)
})

/**
 * Delete an attendance record by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteAttendanceById = handleCatchErrorAsync(async (req, res) => {
  await deleteAttendanceByIdService(req.params.id)
  globalResponse(res, 200, {
    message: 'Attendance record deleted successfully'
  })
})
