import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

export const getAllPayroll = async (filters) => {
  const { employeeId, month, year } = filters

  const where = {}
  if (employeeId) where.employeeId = parseInt(employeeId)
  if (month) where.month = parseInt(month)
  if (year) where.year = parseInt(year)

  return await prisma.payroll.findMany({
    where,
    include: {
      employee: {
        include: {
          user: true
        }
      }
    }
  })
}

export const createPayroll = async (data) => {
  return await prisma.payroll.create({
    data: {
      employeeId: data.employeeId,
      month: data.month,
      year: data.year,
      baseSalary: data.baseSalary,
      extraHours: data.extraHours,
      deductions: data.deductions,
      totalPayment: data.totalPayment,
      createdBy: data.createdBy,
      createdOn: data.createdOn
    }
  })
}

export const updatePayrollById = async (id, data) => {
  return await prisma.payroll.update({
    where: { id: parseInt(id) },
    data: {
      employeeId: data.employeeId,
      month: data.month,
      year: data.year,
      baseSalary: data.baseSalary,
      extraHours: data.extraHours,
      deductions: data.deductions,
      totalPayment: data.totalPayment,
      updatedBy: data.updatedBy,
      updatedOn: data.updatedOn
    }
  })
}

export const deletePayrollById = async (id) => {
  return await prisma.payroll.delete({
    where: { id: parseInt(id) }
  })
}
