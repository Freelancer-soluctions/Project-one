export const validateSchema = (schema) => {
  // Este middleware recibe un esquema de validación (Joi)
  // y permite reutilizar la misma lógica de validación
  // en múltiples rutas del backend.
  return (req, res, next) => {
    // Se extrae el body de la petición HTTP.
    // Todo lo que venga en req.body se considera input NO confiable
    // hasta que sea validado explícitamente.
    const { body } = req;

    // Se valida el body contra el esquema definido para la ruta.
    // abortEarly: false -> devuelve TODOS los errores encontrados,
    // no solo el primero (mejor feedback y control).
    //
    // allowUnknown: false -> aplica WHITELISTING estricto:
    // solo se aceptan los campos definidos en el esquema.
    // Cualquier campo adicional enviado por el cliente
    // será rechazado automáticamente.
    //
    // Este punto es clave para mitigar OWASP A03 (Injection),
    // ya que evita inyecciones indirectas y mass assignment.
    const { error } = schema.validate(body, {
      abortEarly: false,
      allowUnknown: false,
    });

    // Si la validación falla, se corta inmediatamente el flujo
    // y el request NUNCA llega al controller ni a la lógica de negocio.
    if (error) {
      // Se obtienen los detalles de los errores de validación
      const { details } = error;

      // Se transforman los errores técnicos del validador
      // en mensajes controlados que no exponen información interna.
      const messages = details?.map((errorDetail) => errorDetail.message);

      // Se responde con 400 Bad Request indicando que el problema
      // es el input enviado por el cliente.
      return res.status(400).json({ error: messages });
    }

    // Si el input cumple completamente con el esquema,
    // se continúa con el siguiente middleware o controller.
    // A partir de este punto, los datos se consideran confiables.
    next();
  };
};
