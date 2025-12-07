import crypto from 'crypto'
import dotenv from '../../config/dotenv.js'

const AES_KEY = Buffer.from(dotenv('AES_GCM_KEY'), 'base64') // 32 bytes

export function encryptAESGCM (plainText) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv)

  const encrypted = Buffer.concat([
    cipher.update(plainText, 'utf8'),
    cipher.final()
  ])

  const tag = cipher.getAuthTag()

  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decryptAESGCM (cipherText) {
  const raw = Buffer.from(cipherText, 'base64')

  const iv = raw.subarray(0, 12)
  const tag = raw.subarray(12, 28)
  const encrypted = raw.subarray(28)

  const decipher = crypto.createDecipheriv('aes-256-gcm', AES_KEY, iv)
  decipher.setAuthTag(tag)

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ])

  return decrypted.toString('utf8')
}
