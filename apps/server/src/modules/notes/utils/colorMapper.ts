/**
 * Maps note column status codes to card colors.
 * Business rule: C01→gray, C02→amber, C03→emerald.
 *
 * @param {string} code - Column status code (e.g. "C01", "C02", "C03")
 * @returns {string} Color name for the note card
 */
export const computeColorFromCode = (code) => {
  const map = { C01: 'gray', C02: 'amber', C03: 'green' };
  return map[code] ?? 'gray';
};
