import i18n from '@/config/i18n';

/**
 * Runtime resolver for Zod validation messages
 * Uses i18n instance directly (not React hooks) since schema files are not React components
 * 
 * @param {string} key - Translation key (e.g., 'auth.email.empty')
 * @param {Object} params - Optional parameters for interpolation (e.g., { count: 6 })
 * @returns {string} Translated validation message
 */
export function getZodMessage(key, params = {}) {
  return i18n.t(key, params);
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