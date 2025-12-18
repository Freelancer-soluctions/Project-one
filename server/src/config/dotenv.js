import { config } from 'dotenv'

// # Crear archivos separados (Para produccion se usa AWS secrest manager)
// .env.development  → Secretos de DEV
// .env.staging      → Secretos de STAGING
// .env.production   → Secretos de PROD (DIFERENTES)

// configuracion de entorno
const env = process.env.NODE_ENV || 'development'
config({ path: `.env.${env}` })

export default (key) => process.env[key]
