import bcrypt from 'bcrypt';
import zxcvbn from 'zxcvbn';
import dontenv from '../../config/dotenv.js';

/**
 * Hashea una contraseña utilizando bcrypt.
 * - OWASP exige usar un algoritmo adaptativo: bcrypt cumple.
 * - bcrypt genera un salt único por usuario automáticamente.
 * - El número de rondas viene de variable de entorno.
 */

/**
 * Hashea una contraseña utilizando bcrypt.
 *
 * CUMPLIMIENTO OWASP – Cryptographic Failures:
 * ------------------------------------------------
 * ✔ OWASP exige que las contraseñas NO se usen directamente
 *   como claves ni se almacenen en texto plano.
 *
 * ✔ OWASP exige usar un Key Derivation Function (KDF)
 *   resistente a fuerza bruta.
 *   bcrypt es un KDF adaptativo diseñado específicamente
 *   para hashing de contraseñas.
 *
 * ✔ OWASP exige el uso de salt único por contraseña.
 *   bcrypt genera automáticamente un salt criptográficamente
 *   seguro para cada hash.
 *
 * ✔ OWASP recomienda un factor de trabajo configurable
 *   y suficientemente alto (>= 10–12).
 *   Aquí se fuerza un mínimo seguro de 12 rondas.
 *
 * ✔ La contraseña NUNCA se reutiliza como clave de cifrado
 *   ni se transforma directamente en una key.
 */
export const encryptPassword = async (password) => {
  // ------------------------------------------------
  // Se obtiene el factor de costo desde variables
  // de entorno, evitando valores hardcodeados
  // (cumple buenas prácticas de seguridad).
  // ------------------------------------------------
  const saltENV = dontenv('BCRYPTSALT'); // Ej: 12

  // ------------------------------------------------
  // Se asegura un mínimo criptográficamente seguro.
  // Incluso si la variable de entorno está mal
  // configurada, no se permitirá un valor débil.
  // ------------------------------------------------
  const rounds = Math.max(12, Number(saltENV) || 12);

  // ------------------------------------------------
  // bcrypt.genSalt:
  // - Genera un salt aleatorio y único por contraseña
  // - Aplica el factor de trabajo (rounds)
  // - Protege contra rainbow tables
  // ------------------------------------------------
  const salt = await bcrypt.genSalt(rounds);

  // ------------------------------------------------
  // bcrypt.hash:
  // - Aplica un KDF adaptativo y lento
  // - Hace que ataques de fuerza bruta sean costosos
  // - La contraseña nunca se almacena ni se expone
  // ------------------------------------------------
  return bcrypt.hash(password, salt);
};

/**
 * Compara la contraseña ingresada con el hash almacenado.
 * - bcrypt.compare es seguro contra timing attacks.
 */
export const comparePassword = async (password, savedPassword) => {
  return bcrypt.compare(password, savedPassword);
};

/**
 * Evalúa la fortaleza de la contraseña.
 * - zxcvbn asigna un score 0–4.
 * - OWASP recomienda políticas basadas en entropía, no en reglas estáticas.
 * - Score mínimo aceptable = 3 (aceptable/seguro).
 */
export const validatePasswordStrength = (password) => {
  const evaluation = zxcvbn(password);
  return evaluation.score >= 3;
};
