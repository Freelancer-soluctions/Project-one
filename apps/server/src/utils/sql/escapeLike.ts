/**
 * Escapes the LIKE/ILIKE metacharacters (`\`, `%`, `_`) so user input is
 * matched literally inside `%...%` patterns. PostgreSQL's default LIKE escape
 * character is the backslash.
 *
 * @param {string} value - Raw user input.
 * @returns {string} Input safe to embed in a LIKE pattern.
 */
export const escapeLike = (value: string): string =>
  value.replace(/[\\%_]/g, '\\$&');
