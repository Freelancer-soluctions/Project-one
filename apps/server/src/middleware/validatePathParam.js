// middleware/validateNumericIdParam.js
// --------------------------------------------------
// Este middleware valida el parámetro :id recibido
// por la URL cuando se usan IDs autoincrementales.
//
// Cumple OWASP A03 (Injection):
// - Trata el path param como input no confiable
// - Evita que valores arbitrarios o maliciosos
//   lleguen a la capa de negocio o a la BD
// --------------------------------------------------

export const validatePathParam = (req, res, next) => {
  // Extraigo el id desde los parámetros de la URL
  const { id } = req.params;

  // Verifico que el parámetro exista
  // Esto evita undefined, null o strings vacíos
  if (!id) {
    return res.status(400).json({
      message: 'Missing required path parameter: id',
    });
  }

  // Expresión regular estricta:
  // - Solo permite dígitos
  // - Evita caracteres especiales, espacios,
  //   operadores o payloads de inyección
  const NUMERIC_ID_REGEX = /^[0-9]+$/;

  // Valido que el id tenga únicamente números
  if (!NUMERIC_ID_REGEX.test(id)) {
    return res.status(400).json({
      message: 'Invalid id format',
    });
  }

  // Conversión explícita y segura a número
  // Se hace solo después de validar el formato
  const numericId = Number(id);

  // Validación adicional:
  // - Evita números negativos
  // - Evita 0 si tu modelo no lo permite
  if (!Number.isSafeInteger(numericId) || numericId <= 0) {
    return res.status(400).json({
      message: 'Invalid id value',
    });
  }

  // Sobrescribo el id validado en el request
  // para asegurar que capas inferiores
  // usen el valor seguro
  req.params.id = numericId;

  // Continúa hacia el controller
  next();
};
