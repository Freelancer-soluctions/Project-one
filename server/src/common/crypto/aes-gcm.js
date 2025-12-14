import crypto from 'crypto'
import dotenv from '../../config/dotenv.js'

// OWASP recomienda: AES-256-GCM
const ALGORITHM = 'aes-256-gcm'

// Validar clave (debe ser 256 bits = 32 bytes)
if (!process.env.AES_GCM_KEY) {
  throw new Error('❌ AES_GCM_KEY no está definida en variables de entorno')
}

const AES_KEY = Buffer.from(process.env.AES_GCM_KEY, 'base64')

if (AES_KEY.length !== 32) {
  throw new Error(`❌ AES_KEY debe ser de 32 bytes (256 bits), actual: ${AES_KEY.length} bytes`)
}

console.log('✅ Clave AES-256-GCM cargada correctamente')

/**
 * Encripta usando AES-256-GCM (recomendación OWASP)
 * Cumple con: OWASP Cryptographic Storage Cheat Sheet
 * - Algoritmo: AES-256-GCM (modo autenticado)
 * - IV: 12 bytes generados aleatoriamente con CSPRNG
 * - Authentication Tag: 16 bytes
 *
 * @param {string} plainText - Texto a encriptar
 * @returns {string} Texto encriptado en base64 (IV + TAG + CIPHERTEXT)
 */
export function encryptAESGCM (plainText) {
  if (plainText === null || plainText === undefined) return plainText

  try {
    // OWASP: IV debe ser único por mensaje (12 bytes para GCM)
    const iv = crypto.randomBytes(12)

    // Crear cifrador con AES-256-GCM
    const cipher = crypto.createCipheriv(ALGORITHM, AES_KEY, iv)

    // Cifrar texto
    const encrypted = Buffer.concat([
      cipher.update(String(plainText), 'utf8'),
      cipher.final()
    ])

    // OWASP: GCM proporciona autenticación integrada via Authentication Tag
    const tag = cipher.getAuthTag()

    // Formato: IV (12) + TAG (16) + CIPHERTEXT
    return Buffer.concat([iv, tag, encrypted]).toString('base64')
  } catch (error) {
    console.error('❌ Error encriptando:', error.message)
    throw new Error(`Encriptación falló: ${error.message}`)
  }
}

/**
 * Desencripta usando AES-256-GCM (recomendación OWASP)
 *
 * @param {string} cipherText - Texto encriptado en base64
 * @returns {string} Texto desencriptado
 */
export function decryptAESGCM (cipherText) {
  if (cipherText === null || cipherText === undefined) return cipherText

  try {
    // Decodificar base64
    const raw = Buffer.from(cipherText, 'base64')

    // Validar tamaño mínimo (12 IV + 16 TAG = 28 bytes)
    if (raw.length < 28) {
      throw new Error(`Datos inválidos: ${raw.length} bytes, mínimo 28`)
    }

    // Extraer componentes
    const iv = raw.subarray(0, 12)
    const tag = raw.subarray(12, 28)
    const encrypted = raw.subarray(28)

    // Crear descifrador
    const decipher = crypto.createDecipheriv(ALGORITHM, AES_KEY, iv)

    // OWASP: Verificar Authentication Tag para validar integridad
    decipher.setAuthTag(tag)

    // Descifrar y verificar
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]).toString('utf8')
  } catch (error) {
    console.error('❌ Error desencriptando:', {
      input: cipherText?.substring(0, 30) + '...',
      error: error.message
    })
    throw new Error(`Desencriptación falló: ${error.message}`)
  }
}
