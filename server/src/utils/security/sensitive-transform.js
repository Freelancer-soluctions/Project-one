import { sensitiveFields } from '../../security/data-clasification.js'
import { encryptAESGCM, decryptAESGCM } from '../../common/crypto/aes-gcm.js'

// Cifra únicamente los campos sensibles de un objeto plano
export function encryptObject (obj) {
  // Si no es un objeto válido, se retorna igual
  if (!obj || typeof obj !== 'object') return obj

  // Se clona el objeto para no mutar el original
  const clone = { ...obj }

  // Se recorren todos los campos marcados como sensibles
  for (const field of sensitiveFields) {
    // Si el campo existe en el objeto, se cifra con AES-GCM
    if (clone[field] !== undefined) {
      clone[field] = encryptAESGCM(clone[field])
    }
  }

  // Devuelve el objeto con sus campos sensibles cifrados
  return clone
}

// Descifra objetos completos recorriendo cualquier estructura anidada
export function decryptObject (value) {
  // 1. Si no es objeto ni array, no se procesa
  if (value === null || value === undefined) return value
  if (typeof value !== 'object') return value

  // Manejo especial: si es Date, se deja tal cual
  // Esto evita que el algoritmo intente descifrar fechas, lo que generaría errores
  if (value instanceof Date) {
    return value
  }

  // 2. Si es array, se descifra cada elemento recursivamente
  if (Array.isArray(value)) {
    return value.map(item => decryptObject(item))
  }

  // 3. Si es un objeto normal, se procesan todas sus claves
  const result = {}

  for (const key of Object.keys(value)) {
    const original = value[key]

    // Si el campo está marcado como sensible y es un string,
    // se descifra con AES-GCM
    if (sensitiveFields.includes(key) && typeof original === 'string') {
      result[key] = decryptAESGCM(original)
    }
    // Si es un objeto o array anidado, se procesa recursivamente
    else if (typeof original === 'object' && original !== null) {
      result[key] = decryptObject(original)
    }
    // Caso contrario, se copia el valor sin modificar
    else {
      result[key] = original
    }
  }

  // Devuelve el objeto completamente descifrado
  return result
}
