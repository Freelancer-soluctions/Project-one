import { config } from 'dotenv';

// # Crear archivos separados (Para produccion se usa AWS secrest manager)
// .env.development  → Secretos de DEV
// .env.staging      → Secretos de STAGING
// .env.production   → Secretos de PROD (DIFERENTES)

// configuracion de entorno
const env = process.env.NODE_ENV || 'development';

// Intentar cargar archivo específico del entorno primero
config({ path: `.env.${env}` });

// Si no existe, cargar .env genérico como fallback
config({ path: '.env' });

// Unión cerrada de las 15 keys pasadas a dotenv() en los call sites existentes.
export type EnvKey =
  | 'AES_GCM_KEY'
  | 'ALGORITHM'
  | 'BCRYPTSALT'
  | 'CLOUD_API_KEY'
  | 'CLOUD_API_SECRET'
  | 'CLOUD_NAME'
  | 'DEFAULT_QUERY_LIMIT'
  | 'FRONTEND_URL'
  | 'MAX_QUERY_LIMIT'
  | 'NODE_ENV'
  | 'ORIGIN_CORS'
  | 'ORIGIN_CORS_TEST'
  | 'PORT'
  | 'REFRESHSECRETKEY'
  | 'SECRETKEY';

/**
 * Keys SIN default seguro: un valor vacío degrada la seguridad en silencio
 * (firma JWT con `''`, cifrado con una clave de 0 bytes). Deben leerse con
 * `requireEnv`, no con `dotenv`.
 */
export type CriticalEnvKey =
  | 'AES_GCM_KEY'
  | 'ALGORITHM'
  | 'FRONTEND_URL'
  | 'NODE_ENV'
  | 'REFRESHSECRETKEY'
  | 'SECRETKEY';

export default (key: EnvKey): string => process.env[key] ?? '';

/**
 * Lee una key CRÍTICA y falla ruidosamente si falta.
 *
 * Motivo (`server-ts-latent-defects`, fix 3): `dotenv(key): string` devuelve
 * `''` cuando la key no está definida, y la firma `string` oculta ese caso.
 * Con `SECRETKEY` ausente, `createToken` firmaba con una clave vacía en vez de
 * abortar; con `AES_GCM_KEY` ausente, `prisma-query` descifraba con un buffer
 * de 0 bytes y devolvía el ciphertext tal cual, sin avisar.
 *
 * El throw es PEREZOSO (al acceder, no al importar el módulo): así el blast
 * radius es el call-site real y no todo el suite — logger y pagination
 * importan `dotenv` transitivamente.
 *
 * @param {CriticalEnvKey} key - Key requerida.
 * @returns {string} El valor definido (nunca `''`).
 * @throws {Error} `❌ Missing required env var: <key>` cuando falta o está vacía.
 */
export function requireEnv(key: CriticalEnvKey): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Missing required env var: ${key}`);
  }
  return value;
}
