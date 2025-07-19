import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

export const getAllPayroll = async (filters) => {
  // console.log(filters); // Keep for debugging if needed
  const whereClauses = []

  if (filters.employeeId) {
    whereClauses.push(Prisma.sql`p."employeeId" = ${Number(filters.employeeId)}`)
  }

  if (filters.month) {
    // Using ILIKE for case-insensitive search for description
    whereClauses.push(Prisma.sql`p."month" ILIKE ${'%' + filters.month + '%'}`)
  }
  if (filters.year) {
    // Using ILIKE for case-insensitive search for category
    whereClauses.push(Prisma.sql`p."year" ILIKE ${'%' + filters.year + '%'}`)
  }

  const whereSql = whereClauses.length
    ? Prisma.sql`WHERE ${Prisma.join(whereClauses, Prisma.sql` AND `)}`
    : Prisma.empty

  const payrolls = await prisma.$queryRaw`
     SELECT 
       p.*,
        e.name AS "employeeName",
        e."lastName" AS "employeeLastName",
       u.name AS "userPayrollCreatedName",
       uu.name AS "userPayrollUpdatedName"
     FROM "payroll" p
     LEFT JOIN "users" u ON p."createdBy" = u.id
     LEFT JOIN "users" uu ON p."updatedBy" = uu.id
     LEFT JOIN "employees" e ON p."employeeId" = e.id
     ${whereSql}
     ORDER BY p."createdOn" DESC
   `
  console.log(payrolls) // Keep for debugging if needed
  return payrolls

  // const { employeeId, month, year } = filters

  // const where = {}
  // if (employeeId) where.employeeId = parseInt(employeeId)
  // if (month) where.month = parseInt(month)
  // if (year) where.year = parseInt(year)

  // return await prisma.payroll.findMany({
  //   where,
  //   include: {
  //     employee: {
  //       include: {
  //         user: true
  //       }
  //     }
  //   }
  // })
}

export const createPayroll = async (data) => {
  console.log('Creating payroll with data:', data)
  return await prisma.payroll.create({
    data: {
      month: data.month,
      year: data.year,
      baseSalary: data.baseSalary,
      extraHours: data.extraHours,
      deductions: data.deductions,
      totalPayment: data.totalPayment,
      createdOn: data.createdOn,

      employee: {
        connect: {
          id: data.employeeId
        }
      },
      userPayrollCreated: {
        connect: {
          id: data.createdBy
        }
      }
    }
  })
}

export const updatePayrollById = async (id, data) => {
  return await prisma.payroll.update({
    where: { id: parseInt(id) },
    data: {
      month: data.month,
      year: data.year,
      baseSalary: data.baseSalary,
      extraHours: data.extraHours,
      deductions: data.deductions,
      totalPayment: data.totalPayment,
      updatedOn: data.updatedOn,
      employee: {
        connect: {
          id: data.employeeId
        }
      },
      userPayrollUpdated: {
        connect: {
          id: data.updatedBy
        }
      }
    }
  })
}

export const deletePayrollById = async (id) => {
  return await prisma.payroll.delete({
    where: { id }
  })
}
