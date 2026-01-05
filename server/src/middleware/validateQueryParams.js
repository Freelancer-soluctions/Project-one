// Middleware factory: recibe un esquema de validación (por ejemplo Joi)
// y devuelve un middleware reutilizable para Express
export const validateQueryParams = (schema) => {
  // Middleware estándar de Express
  return (req, res, next) => {
    // Se extraen explícitamente los query params de la request
    // Esto limita el alcance únicamente a req.query
    const { query } = req

    // Se valida el objeto query contra el esquema definido
    // abortEarly: false -> devuelve TODOS los errores, no solo el primero
    // allowUnknown: false -> BLOQUEA cualquier parámetro que no esté definido en el esquema (whitelist)
    const { value, error } = schema.validate(query, {
      abortEarly: false,
      allowUnknown: false
    })

    // Si la validación falla
    if (error) {
      // Se extraen los detalles del error de validación
      const { details } = error

      // Se mapean los mensajes de error para devolverlos al cliente
      const messages = details?.map((errorDetail) => errorDetail.message)

      // Se responde con 400 Bad Request
      // Evita que la request llegue a capas internas (controlador / servicio / DAO)
      return res.status(400).json({ error: messages })
    }

    // Si la validación es exitosa:
    // `value` contiene SOLO los campos permitidos por el esquema
    // y además ya normalizados (casting, defaults, sanitización)
    req.safeQuery = value

    // Se continúa con el flujo normal de la request
    next()
  }
}
