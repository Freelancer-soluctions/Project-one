import Joi from 'joi'

// Schema de envoltura delgada (thin envelope):
// Todo evento cliente → servidor debe cumplir este formato.
// Mantiene mensajes pequeños y predecibles.
const envelopeSchema = Joi.object({
  // type: nombre del evento con namespace (ej: 'mention:new')
  type: Joi.string().pattern(/^[a-z]+:[a-z]+$/).required(),
  // payload: datos específicos del evento (validado por schema individual)
  payload: Joi.object().required(),
  // meta: metadatos opcionales (timestamp, traceId, etc.)
  meta: Joi.object({
    timestamp: Joi.date().iso(),
    clientId: Joi.string().max(64),
  }).optional(),
})

// Helper: rechazar etiquetas HTML en campos de texto
// Previene XSS y contenido malicioso en eventos WebSocket
const noHtml = Joi.string().custom((value, helpers) => {
  if (/<[a-z][\s\S]*>/i.test(value)) {
    return helpers.error('string.html')
  }
  return value
}).messages({
  'string.html': 'No se permiten etiquetas HTML en el campo {{#label}}'
})

// Schema para mención en nota
export const mentionNewSchema = Joi.object({
  // ID de la nota donde ocurrió la mención
  noteId: Joi.number().integer().positive().required(),
  // ID del usuario que mencionó
  mentionedByUserId: Joi.number().integer().positive().required(),
  // ID del usuario mencionado
  mentionedUserId: Joi.number().integer().positive().required(),
  // Extracto del contenido donde aparece la mención (máx 200 chars, sin HTML)
  excerpt: noHtml.max(200).required(),
  // Título de la nota para mostrar en notificación (sin HTML)
  noteTitle: noHtml.max(100).required(),
})

// Schema para batch de menciones (límite 50 items ≈ 50KB)
export const mentionBatchSchema = Joi.object({
  mentions: Joi.array().items(mentionNewSchema).max(50).required(),
  batchIndex: Joi.number().integer().min(0).optional(),
  totalBatches: Joi.number().integer().min(1).optional(),
})

// Schema para marcar menciones como leídas
// mentionIds opcional: si se omite, se marcan TODAS como leídas
export const mentionReadSchema = Joi.object({
  mentionIds: Joi.array().items(Joi.number().integer().positive()).min(1).optional(),
})

// Validador genérico: recibe mensaje completo (envelope) y valida contra envelope + schema específico
export const validateMessage = (message, payloadSchema) => {
  const { error: envelopeError, value: envelopeValue } = envelopeSchema.validate(message, {
    stripUnknown: true,
    abortEarly: false,
  })
  if (envelopeError) {
    return { valid: false, error: envelopeError.details.map(d => d.message) }
  }

  const { error: payloadError, value: payloadValue } = payloadSchema.validate(envelopeValue.payload, {
    stripUnknown: true,
    abortEarly: false,
  })
  if (payloadError) {
    return { valid: false, error: payloadError.details.map(d => d.message) }
  }

  return { valid: true, value: { ...envelopeValue, payload: payloadValue } }
}