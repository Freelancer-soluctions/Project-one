import {
  getAllAttendance as getAllAttendanceDao,
  createAttendance as createAttendanceDao,
  updateAttendanceById as updateAttendanceByIdDao,
  deleteAttendanceById as deleteAttendanceByIdDao
} from './dao.js'

/**
 * Get all attendance records with optional filters
 * @param {Object} filters - Optional filters for the query
 * @returns {Promise<Array>} List of attendance records
 */
export const getAllAttendance = async (filters) => {
  return getAllAttendanceDao(filters)
}

/**
 * Create a new attendance record
 * @param {Object} data - Attendance data
 * @returns {Promise<Object>} Created attendance record
 */
export const createAttendance = async (data) => {
  const dataAttendance = {
    ...data,
    createdOn: new Date()
  }
  return createAttendanceDao(dataAttendance)
}

/**
 * Update an attendance record by ID
 * @param {number} id - Attendance ID
 * @param {Object} data - Updated attendance data
 * @returns {Promise<Object>} Updated attendance record
 */
export const updateAttendanceById = async (id, data) => {
  const dataAttendance = {
    ...data,
    updatedOn: new Date()
  }
  return updateAttendanceByIdDao(Number(id), dataAttendance)
}

/**
 * Delete an attendance record by ID
 * @param {number} id - Attendance ID
 * @returns {Promise<Object>} Deleted attendance record
 */
export const deleteAttendanceById = async (id) => {
  return deleteAttendanceByIdDao(Number(id))
}
