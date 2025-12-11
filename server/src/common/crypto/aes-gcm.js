import crypto from 'crypto'
import dotenv from '../../config/dotenv.js'

// Algoritmo a usar: AES en modo GCM (autenticado)
const ALGORITHM = 'aes-256-gcm'

// Llave de 256 bits (32 bytes) obtenida desde variables de entorno en base64
const AES_KEY = Buffer.from(dotenv('AES_GCM_KEY'), 'base64') // 32 bytes

// Función para cifrar usando AES-GCM
export function encryptAESGCM (plainText) {
  // El IV debe ser único por mensaje. AES-GCM recomienda 12 bytes.
  const iv = crypto.randomBytes(12)

  // Crear el cifrador con algoritmo, llave y IV
  const cipher = crypto.createCipheriv(ALGORITHM, AES_KEY, iv)

  // Cifrar el texto plano (update + final)
  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final()
  ])

  // Obtener el Authentication Tag (GCM genera un tag de 16 bytes)
  const tag = cipher.getAuthTag()

  // Retornar todo junto: IV + TAG + CIPHERTEXT codificado en base64
  // Esto permite que al descifrar se pueda leer los tres valores
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

// Función para descifrar usando AES-GCM
export function decryptAESGCM (cipherText) {
  // Decodificar el base64 para obtener el buffer completo
  const raw = Buffer.from(cipherText, 'base64')

  // Extraer IV (primeros 12 bytes)
  const iv = raw.subarray(0, 12)

  // Extraer TAG (siguientes 16 bytes)
  const tag = raw.subarray(12, 28)

  // El resto es el texto cifrado
  const encrypted = raw.subarray(28)

  // Crear el descifrador con algoritmo, llave y IV
  const decipher = crypto.createDecipheriv(ALGORITHM, AES_KEY, iv)

  // Establecer el Authentication Tag para validar la integridad
  decipher.setAuthTag(tag)

  // Descifrar contenido y retornarlo como texto UTF-8
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]).toString('utf8')
}
