import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Get all performance evaluations with optional filters
 * @param {Object} filters - Optional filters for the query
 * @param {string} [filters.employeeId] - Filter by employee ID
 * @param {string} [filters.startDate] - Filter by start date
 * @param {string} [filters.endDate] - Filter by end date
 * @returns {Promise<Array>} List of performance evaluations with their related data
 */
export const getAllPerformanceEvaluations = async (filters = {}) => {
  const whereClauses = []

  if (filters.employeeId) {
    whereClauses.push(Prisma.sql`pe."employeeId" = ${Number(filters.employeeId)}`)
  }

  if (filters.startDate) {
    whereClauses.push(Prisma.sql`pe."date" >= ${filters.startDate}`)
  }

  if (filters.endDate) {
    whereClauses.push(Prisma.sql`pe."date" <= ${filters.endDate}`)
  }

  const whereSql = whereClauses.length
    ? Prisma.sql`WHERE ${Prisma.join(whereClauses, Prisma.sql` AND `)}`
    : Prisma.empty

  const evaluations = await prisma.$queryRaw`
    SELECT 
      pe.*,
      e.name AS "employeeName",
      u.name AS "userPerformanceCreatedName",
      uu.name AS "userPerformanceUpdatedName"
    FROM "performanceEvaluation" pe
    LEFT JOIN "employees" e ON pe."employeeId" = e.id
    LEFT JOIN "users" u ON pe."createdBy" = u.id
    LEFT JOIN "users" uu ON pe."updatedBy" = uu.id
    ${whereSql}
    ORDER BY pe."date" DESC
  `

  return evaluations
}

/**
 * Create a new performance evaluation
 * @param {Object} data - Performance evaluation data
 * @param {number} data.employeeId - Employee ID
 * @param {Date} data.date - Evaluation date
 * @param {number} data.calification - Evaluation score
 * @param {string} data.comments - Evaluation comments
 * @param {number} data.createdBy - User ID who created the evaluation
 * @param {Date} data.creationOn - Creation timestamp
 * @returns {Promise<Object>} Created performance evaluation with related data
 */
export const createPerformanceEvaluation = async (data) => {
  const evaluation = await prisma.performanceEvaluation.create({
    data: {
      date: data.date,
      calification: data.calification,
      comments: data.comments,
      createdOn: data.createdOn,
      employee: {
        connect: { id: data.employeeId }
      },
      userPerformanceEvaluationCreated: {
        connect: { id: data.createdBy }
      }
    }

  })
  return evaluation
}

/**
 * Update a performance evaluation by ID
 * @param {number} id - Performance evaluation ID
 * @param {Object} data - Updated performance evaluation data
 * @returns {Promise<Object>} Updated performance evaluation with related data
 */
export const updatePerformanceEvaluationById = async (id, data) => {
  const evaluation = await prisma.performanceEvaluation.update({
    where: { id: Number(id) },
    data: {
      date: data.date,
      calification: data.calification,
      comments: data.comments,
      updatedOn: new Date(),
      employee: {
        connect: { id: data.employeeId }
      },
      userPerformanceEvaluationUpdated: {
        connect: { id: data.updatedBy }
      }
    }

  })
  return evaluation
}

/**
 * Delete a performance evaluation by ID
 * @param {number} id - Performance evaluation ID
 * @returns {Promise<Object>} Deleted performance evaluation
 */
export const deletePerformanceEvaluationById = async (id) => {
  const evaluation = await prisma.performanceEvaluation.delete({
    where: { id }
  })
  return evaluation
}
