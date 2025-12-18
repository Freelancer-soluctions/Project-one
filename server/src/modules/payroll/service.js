import * as payrollDao from './dao.js'

export const getAllPayroll = async (filters) => {
  return await payrollDao.getAllPayroll(filters)
}

export const createPayroll = async (data, userId) => {
  const payroll = {
    ...data,
    baseSalary: String(data.baseSalary),
    extraHours: String(data.extraHours),
    deductions: String(data.deductions),
    totalPayment: String(data.totalPayment),
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
