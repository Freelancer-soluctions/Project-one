import { PrismaClient, Prisma } from '@prisma/client'
import { encryptAESGCM, decryptAESGCM } from '../common/crypto/aes-gcm.js'
import { SensitiveData } from '../security/data-clasification.js'

export const encryptSensitiveExtension = {
  name: 'encryptSensitive',
  query: {
    async $allOperations ({ operation, model, args, query }) {
      const actions = ['create', 'update', 'upsert']

      if (actions.includes(operation) && args?.data) {
        const data = args.data

        const allSensitiveFields = [
          ...SensitiveData.critical
        //   ...SensitiveData.sensitive
        ]

        for (const field of allSensitiveFields) {
          if (data[field]) {
            data[field] = encryptAESGCM(String(data[field]))
          }
        }
      }

      return query(args)
    }
  }
}

export const decryptSensitiveExtension = {
  name: 'decryptSensitive',
  result: {
    $allModels: {
      $allOperations (data) {
        if (!data || typeof data !== 'object') return data

        // Campos que sí se descifran
        const decryptable = [
          // ...SensitiveData.sensitive,
          ...SensitiveData.critical.filter(
            (f) => !['password', 'refreshToken'].includes(f)
          )
        ]

        const decryptField = (value, key) => {
          if (decryptable.includes(key) && typeof value === 'string') {
            try {
              return decryptAESGCM(value)
            } catch (_) {
              return value // si no está cifrado, se devuelve tal cual
            }
          }
          return value
        }

        // Si es array → map
        if (Array.isArray(data)) {
          return data.map((item) => {
            if (typeof item !== 'object') return item

            const cloned = { ...item }
            for (const field of decryptable) {
              if (cloned[field]) {
                cloned[field] = decryptField(cloned[field], field)
              }
            }
            return cloned
          })
        }

        // Si es objeto único → descifrar campos
        const clone = { ...data }
        for (const field of decryptable) {
          if (clone[field]) {
            clone[field] = decryptField(clone[field], field)
          }
        }

        return clone
      }
    }
  }
}

// const prisma = new PrismaClient().$extends(encryptSensitiveExtension).$extends(decryptSensitiveExtension)
// ⚠️ Esta variable global evita que Prisma se cree varias veces
if (!global.prisma) {
  global.prisma = new PrismaClient()
    .$extends(encryptSensitiveExtension)
    .$extends(decryptSensitiveExtension)
}

// Exporta SIEMPRE la misma instancia
const prisma = global.prisma

export { prisma, Prisma }
