import * as payrollService from './service.js'
import handleCatchErrorAsync from '../../utils/responses&Errors/handleCatchErrorAsync.js'
import globalResponse from '../../utils/responses&Errors/globalResponse.js'

export const getAllPayroll = handleCatchErrorAsync(async (req, res) => {
  const filters = req.query
  const payroll = await payrollService.getAllPayroll(filters)
  globalResponse(res, 200, 'Payroll retrieved successfully', payroll)
})

export const createPayroll = handleCatchErrorAsync(async (req, res) => {
  const payroll = await payrollService.createPayroll(req.body)
  console.log('Payroll created:', payroll)
  globalResponse(res, 201, 'Payroll created successfully', payroll)
})

export const updatePayrollById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  const payroll = await payrollService.updatePayrollById(id, req.body)
  globalResponse(res, 200, 'Payroll updated successfully', payroll)
})

export const deletePayrollById = handleCatchErrorAsync(async (req, res) => {
  const { id } = req.params
  await payrollService.deletePayrollById(id)
  globalResponse(res, 200, 'Payroll deleted successfully')
})
