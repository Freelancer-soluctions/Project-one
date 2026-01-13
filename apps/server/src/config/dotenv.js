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

export default (key) => process.env[key];
