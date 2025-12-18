// ============================================
// utils/prisma-query.js
// Wrapper para $queryRaw con desencriptación automática
// ============================================

// Importar la función decrypt del middleware
import crypto from 'crypto'
import dotenv from '../../config/dotenv'

const ALGORITHM = dotenv('ALGORITHM')
const ENCRYPTION_KEY = Buffer.from(dotenv('AES_GCM_KEY'), 'base64')

function decrypt (ciphertext) {
  if (!ciphertext || typeof ciphertext !== 'string') return ciphertext

  try {
    const raw = Buffer.from(ciphertext, 'base64')
    if (raw.length < 28) return ciphertext

    const iv = raw.subarray(0, 12)
    const tag = raw.subarray(12, 28)
    const encrypted = raw.subarray(28)

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv)
    decipher.setAuthTag(tag)

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]).toString('utf8')
  } catch (error) {
    return ciphertext
  }
}

// Lista de TODOS los campos sensibles
const SENSITIVE_FIELDS = [
  'baseSalary', 'extraHours', 'deductions', 'totalPayment',
  'socialSecurity', 'document', 'salary', 'dni', 'email'
]

// Función de desencriptación recursiva
export function decryptResults (data) {
  if (!data) return data

  // Array
  if (Array.isArray(data)) {
    return data.map(item => decryptResults(item))
  }

  // No objeto
  if (typeof data !== 'object' || data instanceof Date) {
    return data
  }

  // Objeto
  const result = { ...data }

  for (const field of SENSITIVE_FIELDS) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = decrypt(result[field])
    }
  }

  // Recursión para objetos anidados
  for (const key in result) {
    if (result[key] && typeof result[key] === 'object') {
      result[key] = decryptResults(result[key])
    }
  }

  return result
}
