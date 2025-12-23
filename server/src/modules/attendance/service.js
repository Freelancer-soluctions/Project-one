import {
  getAllAttendance as getAllAttendanceDao,
  createAttendance as createAttendanceDao,
  updateAttendanceById as updateAttendanceByIdDao,
  deleteAttendanceById as deleteAttendanceByIdDao
} from './dao.js'
import { getSafePagination } from '../../utils/pagination/pagination.js'

/**
 * Get all attendance records with optional filters
 * @param {Object} filters - Optional filters for the query
 * @returns {Promise<Array>} List of attendance records
 */
export const getAllAttendance = async (filters) => {
  const { take, skip } = getSafePagination({
    page: filters.page,
    limit: filters.limit
  })

  if (!take || take <= 0) {
    throw new Error('Pagination is required')
  }
  return getAllAttendanceDao(filters, take, skip)
}

/**
 * Create a new attendance record
 * @param {Object} data - Attendance data
 * @returns {Promise<Object>} Created attendance record
 */
export const createAttendance = async (data, userId) => {
  const dataAttendance = {
    ...data,
    employeeId: Number(data.employeeId),
    date: new Date(data.date),
    createdOn: new Date(),
    createdBy: userId
  }
  return createAttendanceDao(dataAttendance)
}

/**
 * Update an attendance record by ID
 * @param {number} id - Attendance ID
 * @param {Object} data - Updated attendance data
 * @returns {Promise<Object>} Updated attendance record
 */
export const updateAttendanceById = async (id, data, userId) => {
  const dataAttendance = {
    ...data,
    updatedOn: new Date(),
    employeeId: Number(data.employeeId),
    updatedBy: userId,
    date: new Date(data.date)

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
