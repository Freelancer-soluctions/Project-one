import { sensitiveFields } from '../../security/data-clasification.js'
import { encryptAESGCM, decryptAESGCM } from '../../common/crypto/aes-gcm.js'

/**
 * Encripta campos sensibles de un objeto
 * OWASP: "Encrypt all sensitive data at rest"
 */
export function encryptSensitiveFields (obj) {
  if (!obj || typeof obj !== 'object') return obj

  const result = { ...obj }

  for (const field of sensitiveFields) {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = encryptAESGCM(String(result[field]))
    }
  }

  return result
}

/**
 * Desencripta campos sensibles de forma recursiva
 * Maneja objetos, arrays y estructuras anidadas
 */
export function decryptSensitiveFields (data) {
  // Casos base
  if (data === null || data === undefined) return data
  if (data instanceof Date) return data
  if (typeof data !== 'object') return data

  // Arrays
  if (Array.isArray(data)) {
    return data.map(item => decryptSensitiveFields(item))
  }

  // Objetos
  const result = {}

  for (const [key, value] of Object.entries(data)) {
    if (sensitiveFields.includes(key) && typeof value === 'string') {
      try {
        result[key] = decryptAESGCM(value)
      } catch (error) {
        console.error(`❌ Error desencriptando campo ${key}:`, error.message)
        result[key] = '[ERROR: No se pudo desencriptar]'
      }
    } else if (typeof value === 'object' && value !== null) {
      result[key] = decryptSensitiveFields(value)
    } else {
      result[key] = value
    }
  }

  return result
}
