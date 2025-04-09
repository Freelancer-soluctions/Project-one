import { getAllPayroll, createPayroll, updatePayrollById, deletePayrollById } from './dao.js'

export const getAllPayroll = async (filters) => {
  return await getAllPayroll(filters)
}

export const createPayroll = async (data) => {
  const payroll = {
    ...data,
    createdOn: new Date()
  }
  return await createPayroll(payroll)
}

export const updatePayrollById = async (id, data) => {
  const payroll = {
    ...data,
    updatedOn: new Date()
  }
  return await updatePayrollById(id, payroll)
}

export const deletePayrollById = async (id) => {
  return await deletePayrollById(id)
} 