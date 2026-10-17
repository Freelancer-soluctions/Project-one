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

// Unión cerrada de las 14 keys pasadas a dotenv() en 23 call sites.
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

export default (key: EnvKey): string => process.env[key];
