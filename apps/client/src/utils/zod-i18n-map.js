import i18n from '@/config/i18n';

/**
 * Runtime resolver for Zod validation messages
 * Uses i18n instance directly (not React hooks) since schema files are not React components
 *
 * Devuelve el mensaje ya traducido. Para parámetros `error` de zod usa
 * `getZodErrorMessage`, que traduce en cada validación.
 *
 * @param {string} key - Translation key (e.g., 'auth.email.empty')
 * @param {Object} params - Optional parameters for interpolation (e.g., { count: 6 })
 * @returns {string} Translated validation message
 */
export function getZodMessage(key, params = {}) {
  return i18n.t(key, params);
}

/**
 * Versión perezosa para el parámetro `error` de zod v4: devuelve el callback
 * que zod invoca al validar, de modo que el mensaje se traduce con el idioma
 * activo en ese momento y no con el del import del schema.
 *
 * @param {string} key - Translation key (e.g., 'employees.position.empty')
 * @param {Object} params - Optional parameters for interpolation
 * @returns {() => string} Callback de error para zod
 */
export function getZodErrorMessage(key, params = {}) {
  return () => i18n.t(key, params);
}

/**
 * Helper for min/max validation messages
 *
 * @param {string} key - Base translation key
 * @param {number} value - The min or max value
 * @returns {string} Translated message with the value interpolated
 */
export function getZodMinMaxMessage(key, value) {
  return i18n.t(key, { count: value });
}

/**
 * Versión perezosa de `getZodMinMaxMessage` para el parámetro `error` de zod.
 *
 * @param {string} key - Base translation key
 * @param {number} value - The min or max value
 * @returns {() => string} Callback de error para zod
 */
export function getZodMinMaxErrorMessage(key, value) {
  return () => i18n.t(key, { count: value });
}
