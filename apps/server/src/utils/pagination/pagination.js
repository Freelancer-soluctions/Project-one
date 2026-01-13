import dotenv from '../../config/dotenv.js';

// Esta función centraliza y normaliza la paginación que llega desde el cliente.
// El objetivo principal es evitar consultas sin límites o con límites excesivos,
// lo cual es un riesgo claro frente a inyección y exposición masiva de datos (OWASP A03).
export const getSafePagination = ({ page, limit }) => {
  // Defino un límite por defecto tomado desde variables de entorno.
  // Esto evita que, si el cliente no envía 'limit', la consulta devuelva todos los registros.
  // Tenerlo en ENV permite ajustarlo sin tocar código.
  const DEFAULT_LIMIT = Number(dotenv('DEFAULT_QUERY_LIMIT')) || 20;

  // Defino un límite máximo absoluto, también desde variables de entorno.
  // Esto protege el backend incluso si el cliente intenta forzar un límite muy alto
  // (por ejemplo ?limit=100000).
  const MAX_LIMIT = Number(dotenv('MAX_QUERY_LIMIT')) || 100;

  // Calculo el límite "seguro":
  // 1. Convierto el limit a número (si viene como string desde req.query).
  // 2. Si no viene, uso el DEFAULT_LIMIT.
  // 3. Aplico Math.min para asegurar que nunca supere el MAX_LIMIT.
  // Esto es clave para mitigar devoluciones masivas de datos ante ataques o errores.
  const safeLimit = Math.min(Number(limit) || DEFAULT_LIMIT, MAX_LIMIT);

  // Normalizo la página:
  // - Si no viene page, uso la página 1.
  // - Si viene un valor menor a 1 (0, negativo, NaN), lo fuerzo a 1.
  // Esto evita offsets inválidos o comportamientos inesperados en la base de datos.
  const safePage = Math.max(Number(page) || 1, 1);

  // Calculo el offset (skip) en función de la página y el límite seguro.
  // Prisma usa 'skip' + 'take', así que este cálculo controla exactamente
  // cuántos registros se saltan y cuántos se devuelven.
  const skip = (safePage - 1) * safeLimit;

  // Devuelvo un objeto listo para ser usado directamente en Prisma:
  // findMany({ take, skip })
  // De esta forma todas las consultas quedan protegidas de forma consistente.
  return { take: safeLimit, skip };
};
