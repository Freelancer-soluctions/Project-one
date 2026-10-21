// ============================================
// utils/prisma-query.js
// Wrapper para $queryRaw con desencriptación automática
// ============================================

// Importar la función decrypt del middleware
import crypto from 'crypto';
// `requireEnv`: antes `dotenv('AES_GCM_KEY')` devolvía `''` y
// `Buffer.from('', 'base64')` daba una clave de 0 bytes; el `catch` de
// `decrypt` se tragaba el fallo y el wrapper devolvía el CIPHERTEXT como si
// fuera texto plano, sin avisar (server-ts-latent-defects, fix 3).
import { requireEnv } from '../../config/dotenv.js';

const ALGORITHM = requireEnv('ALGORITHM') as crypto.CipherGCMTypes;
const ENCRYPTION_KEY = Buffer.from(requireEnv('AES_GCM_KEY'), 'base64');

function decrypt(ciphertext: unknown) {
  if (!ciphertext || typeof ciphertext !== 'string') return ciphertext;

  try {
    const raw = Buffer.from(ciphertext, 'base64');
    if (raw.length < 28) return ciphertext;

    const iv = raw.subarray(0, 12);
    const tag = raw.subarray(12, 28);
    const encrypted = raw.subarray(28);

    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      ENCRYPTION_KEY,
      iv
    ) as crypto.DecipherGCM;
    decipher.setAuthTag(tag);

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    return ciphertext;
  }
}

// Lista de TODOS los campos sensibles
const SENSITIVE_FIELDS = [
  'baseSalary',
  'extraHours',
  'deductions',
  'totalPayment',
  'socialSecurity',
  'document',
  'salary',
  'dni',
  'email',
];

/**
 * Desencripta los campos sensibles de un objeto plano.
 *
 * @param {Object} data - Objeto (ya copiado) con posibles campos cifrados.
 * @returns {Object} El mismo objeto con los campos sensibles descifrados.
 */
const decryptSensitiveFields = (data: Record<string, unknown>) => {
  const result = { ...data };

  for (const field of SENSITIVE_FIELDS) {
    if (result[field] && typeof result[field] === 'string') {
      result[field] = decrypt(result[field]);
    }
  }

  return result;
};

// Función de desencriptación recursiva
export function decryptResults<T>(data: T): T {
  if (!data) return data;

  // Array
  if (Array.isArray(data)) {
    return (data as unknown[]).map((item) =>
      decryptResults(item)
    ) as unknown as T;
  }

  // No objeto (Date incluido)
  if (typeof data !== 'object' || data instanceof Date) {
    return data;
  }

  const result = decryptSensitiveFields(data as Record<string, unknown>);

  // Recursión para objetos anidados
  for (const key in result) {
    if (result[key] && typeof result[key] === 'object') {
      result[key] = decryptResults(result[key]);
    }
  }

  return result as T;
}
