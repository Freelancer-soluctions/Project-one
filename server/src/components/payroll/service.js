import * as payrollDao from './dao.js'

export const getAllPayroll = async (filters) => {
  return await payrollDao.getAllPayroll(filters)
}

export const createPayroll = async (data, userId) => {
  const payroll = {
    ...data,
    createdOn: new Date(),
    createdBy: userId
  }
  return await payrollDao.createPayroll(payroll)
}

export const updatePayrollById = async (id, data) => {
  const payroll = {
    ...data,
    updatedOn: new Date()
  }
  return await payrollDao.updatePayrollById(id, payroll)
}

export const deletePayrollById = async (id) => {
  return await payrollDao.deletePayrollById(Number(id))
}
