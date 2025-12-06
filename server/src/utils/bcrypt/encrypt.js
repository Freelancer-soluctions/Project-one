import bcrypt from 'bcrypt'
import zxcvbn from 'zxcvbn'
import dontenv from '../../config/dotenv.js'

/**
 * Hashea una contraseña utilizando bcrypt.
 * - OWASP exige usar un algoritmo adaptativo: bcrypt cumple.
 * - bcrypt genera un salt único por usuario automáticamente.
 * - El número de rondas viene de variable de entorno.
 */
export const encryptPassword = async (password) => {
  // Se obtiene el número de rondas desde el .env
  const saltENV = dontenv('BCRYPTSALT') // 12 por default

  // Se asegura un mínimo seguro (recomendación OWASP 10–14)
  const rounds = Math.max(12, Number(saltENV) || 12)

  // bcrypt.genSalt genera un salt aleatorio + ajusta complejidad
  const salt = await bcrypt.genSalt(rounds)

  // bcrypt.hash aplica KDF adaptativo (lento)
  return bcrypt.hash(password, salt)
}

/**
 * Compara la contraseña ingresada con el hash almacenado.
 * - bcrypt.compare es seguro contra timing attacks.
 */
export const comparePassword = async (password, savedPassword) => {
  return bcrypt.compare(password, savedPassword)
}

/**
 * Evalúa la fortaleza de la contraseña.
 * - zxcvbn asigna un score 0–4.
 * - OWASP recomienda políticas basadas en entropía, no en reglas estáticas.
 * - Score mínimo aceptable = 3 (aceptable/seguro).
 */
export const validatePasswordStrength = (password) => {
  const evaluation = zxcvbn(password)
  return evaluation.score >= 3
}
