import dotenv from '../config/dotenv'
import crypto from 'crypto'

const ALGORITHM = dotenv('ALGORITHM')

// Validar que existe la clave
if (!dotenv('AES_GCM_KEY')) {
  throw new Error('❌ AES_GCM_KEY no está definida en variables de entorno')
}

const ENCRYPTION_KEY = Buffer.from(dotenv('AES_GCM_KEY'), 'base64')

if (ENCRYPTION_KEY.length !== 32) {
  throw new Error(`❌ AES_GCM_KEY debe ser de 32 bytes, actual: ${ENCRYPTION_KEY.length}`)
}

console.log('✅ Encryption middleware cargado correctamente')

// ============================================
// Configuración: Campos sensibles por modelo
// ============================================

const ENCRYPTED_FIELDS = {
  Payroll: ['baseSalary', 'extraHours', 'deductions', 'totalPayment'],
  payroll: ['baseSalary', 'extraHours', 'deductions', 'totalPayment'],
  Employees: ['socialSecurity', 'document', 'salary'],
  employees: ['socialSecurity', 'document', 'salary', 'dni'],
  User: ['email'],
  user: ['email']
}

// ============================================
// Funciones de encriptación AES-256-GCM
// ============================================

function encrypt (text) {
  if (!text || text === null || text === undefined) return text

  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv)

  const encrypted = Buffer.concat([
    cipher.update(String(text), 'utf8'),
    cipher.final()
  ])

  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

function decrypt (ciphertext) {
  if (!ciphertext || ciphertext === null || ciphertext === undefined) return ciphertext

  try {
    const raw = Buffer.from(ciphertext, 'base64')

    if (raw.length < 28) {
      console.warn('⚠️  Datos encriptados muy cortos, podría ser texto plano')
      return ciphertext
    }

    const iv = raw.subarray(0, 12)
    const tag = raw.subarray(12, 28)
    const encrypted = raw.subarray(28)

    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv)
    decipher.setAuthTag(tag)

    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]).toString('utf8')
  } catch (error) {
    console.error('❌ Error desencriptando:', error.message)
    return ciphertext // Retornar valor original si falla
  }
}

// ============================================
// Procesamiento de campos
// ============================================

/**
 * Encripta campos sensibles de un objeto
 */
function encryptFields (model, data) {
  const fields = ENCRYPTED_FIELDS[model]
  if (!fields || !data) return data

  const result = { ...data }

  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      try {
        const original = result[field]
        result[field] = encrypt(result[field])
        console.log(`🔐 Encriptado ${model}.${field}: "${original}" → "${result[field].substring(0, 20)}..."`)
      } catch (error) {
        console.error(`❌ Error encriptando ${model}.${field}:`, error.message)
        throw error
      }
    }
  }

  return result
}

/**
 * Desencripta campos sensibles de un objeto o array
 */
function decryptFields (model, data) {
  if (!data) return data

  const fields = ENCRYPTED_FIELDS[model]
  if (!fields) {
    console.log(`ℹ️  Modelo ${model} no tiene campos encriptados configurados`)
    return data
  }

  // Si es array, procesar cada elemento
  if (Array.isArray(data)) {
    console.log(`🔓 Desencriptando array de ${data.length} elementos del modelo ${model}`)
    return data.map(item => decryptFields(model, item))
  }

  // Si es objeto
  const result = { ...data }
  let decryptedCount = 0

  for (const field of fields) {
    if (result[field] && typeof result[field] === 'string') {
      try {
        const encrypted = result[field]
        result[field] = decrypt(result[field])
        decryptedCount++
        console.log(`🔓 Desencriptado ${model}.${field}: "${encrypted.substring(0, 20)}..." → "${result[field]}"`)
      } catch (error) {
        console.error(`❌ Error desencriptando ${model}.${field}:`, error.message)
        result[field] = '[ERROR: No se pudo desencriptar]'
      }
    }
  }

  if (decryptedCount > 0) {
    console.log(`✅ Total desencriptado en ${model}: ${decryptedCount} campos`)
  }

  return result
}

// ============================================
// Middleware de Prisma
// ============================================

export function encryptionMiddleware (prisma) {
  prisma.$use(async (params, next) => {
    const { model, action, args } = params

    console.log(`\n🔍 Middleware interceptó: ${model}.${action}`)

    // Verificar si el modelo tiene campos encriptados
    const hasEncryptedFields = ENCRYPTED_FIELDS[model] !== undefined

    if (!hasEncryptedFields) {
      console.log(`⏭️  Modelo ${model} no tiene encriptación, continuando...`)
      return next(params)
    }

    console.log(`✅ Modelo ${model} tiene campos encriptados configurados`)

    // ===== ESCRITURA: Encriptar antes de guardar =====
    const writeActions = ['create', 'update', 'upsert']
    if (writeActions.includes(action)) {
      console.log(`📝 Acción de escritura: ${action}`)

      if (args.data) {
        console.log('🔐 Encriptando datos antes de guardar...')
        args.data = encryptFields(model, args.data)
      }
    }

    if (action === 'createMany') {
      console.log('📝 Acción createMany')
      if (args.data && Array.isArray(args.data)) {
        console.log(`🔐 Encriptando ${args.data.length} registros...`)
        args.data = args.data.map(item => encryptFields(model, item))
      }
    }

    if (action === 'updateMany') {
      console.log('📝 Acción updateMany')
      if (args.data) {
        console.log('🔐 Encriptando datos de updateMany...')
        args.data = encryptFields(model, args.data)
      }
    }

    // Ejecutar la query
    console.log('⚡ Ejecutando query en base de datos...')
    const result = await next(params)
    console.log('✅ Query ejecutada, procesando resultado...')

    // ===== LECTURA: Desencriptar después de leer =====
    const readActions = [
      'findUnique',
      'findFirst',
      'findMany',
      'create',
      'update',
      'upsert',
      'delete'
    ]

    if (readActions.includes(action)) {
      if (result) {
        console.log(`🔓 Desencriptando resultado de ${action}...`)
        const decrypted = decryptFields(model, result)
        console.log(`✅ Desencriptación completada para ${action}`)
        return decrypted
      } else {
        console.log('ℹ️  No hay resultado para desencriptar')
      }
    }

    return result
  })

  console.log('✅ Prisma encryption middleware activado')
}

// ============================================
// Utilidad: Migrar datos existentes
// ============================================

export async function migrateExistingData (prisma, modelName) {
  const model = prisma[modelName.toLowerCase()]
  if (!model) {
    throw new Error(`Modelo ${modelName} no encontrado`)
  }

  const fields = ENCRYPTED_FIELDS[modelName] || ENCRYPTED_FIELDS[modelName.toLowerCase()]
  if (!fields) {
    console.log(`⚠️  Modelo ${modelName} no tiene campos encriptados configurados`)
    return
  }

  console.log(`🔄 Migrando datos de ${modelName}...`)
  console.log(`📋 Campos a encriptar: ${fields.join(', ')}`)

  // Obtener todos los registros
  const records = await model.findMany()
  console.log(`📦 Encontrados ${records.length} registros`)

  let migrated = 0
  let skipped = 0
  let errors = 0

  for (const record of records) {
    try {
      let needsUpdate = false
      const updates = {}

      for (const field of fields) {
        const value = record[field]

        // Si el campo existe y NO parece estar encriptado
        // (base64 encriptado normalmente es >40 caracteres)
        if (value && typeof value === 'string') {
          // Intentar detectar si ya está encriptado
          const isLikelyEncrypted = value.length > 40 && /^[A-Za-z0-9+/]+=*$/.test(value)

          if (!isLikelyEncrypted) {
            updates[field] = encrypt(value)
            needsUpdate = true
            console.log(`  📝 Campo ${field}: "${value}" necesita encriptación`)
          } else {
            console.log(`  ⏭️  Campo ${field} parece ya estar encriptado`)
          }
        }
      }

      if (needsUpdate) {
        await model.update({
          where: { id: record.id },
          data: updates
        })
        migrated++
        console.log(`✅ Migrado registro ID ${record.id}`)
      } else {
        skipped++
        console.log(`⏭️  Registro ID ${record.id} ya encriptado`)
      }
    } catch (error) {
      errors++
      console.error(`❌ Error migrando registro ID ${record.id}:`, error.message)
    }
  }

  console.log('\n📊 Migración completada:')
  console.log(`   ✅ Migrados: ${migrated}`)
  console.log(`   ⏭️  Omitidos: ${skipped}`)
  console.log(`   ❌ Errores: ${errors}`)
  console.log(`   📦 Total: ${records.length}`)
}

// ============================================
// Debug: Función para probar encriptación
// ============================================

export function testEncryption () {
  console.log('\n🧪 Probando encriptación/desencriptación...\n')

  const testValues = ['1200', '5000000', '0', '999.99']

  for (const value of testValues) {
    const encrypted = encrypt(value)
    const decrypted = decrypt(encrypted)

    console.log(`Original:     "${value}"`)
    console.log(`Encriptado:   "${encrypted}"`)
    console.log(`Desencriptado: "${decrypted}"`)
    console.log(`✅ Match: ${value === decrypted ? 'SÍ' : 'NO'}\n`)
  }
}

// Descomentar para probar:
// testEncryption()
