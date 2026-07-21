// middleware/validateNumericPathParam.js
// --------------------------------------------------
// Generic middleware to validate numeric path parameters by name.
// Validates that the specified path parameter is a positive integer.
// --------------------------------------------------

const NUMERIC_ID_REGEX = /^[0-9]+$/;

/**
 * Creates a middleware that validates a specific numeric path parameter.
 * @param {string} paramName - The name of the path parameter to validate (e.g., 'eventId', 'attendeeId')
 * @returns {Function} Express middleware function
 */
export const validateNumericPathParam = (paramName) => {
  return (req, res, next) => {
    const paramValue = req.params[paramName];

    // Verifico que el parámetro exista
    if (!paramValue) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Missing required path parameter: ${paramName}`,
      });
    }

    // Valido que el parámetro tenga únicamente números
    if (!NUMERIC_ID_REGEX.test(paramValue)) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Invalid ${paramName} format`,
      });
    }

    // Conversión explícita y segura a número
    const numericId = Number(paramValue);

    // Validación adicional: evita números negativos y 0
    if (!Number.isSafeInteger(numericId) || numericId <= 0) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: `Invalid ${paramName} value`,
      });
    }

    // Sobrescribo el parámetro validado en el request
    req.params[paramName] = numericId;

    next();
  };
};

export default validateNumericPathParam;