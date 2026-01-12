import { PrismaClient, Prisma } from '@prisma/client'
import { encryptionMiddleware } from '../middleware/encription-prisma-middleware.js'

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error']
})

// ✅ Aplicar middleware de encriptación automática
encryptionMiddleware(prisma)

export { prisma, Prisma }
