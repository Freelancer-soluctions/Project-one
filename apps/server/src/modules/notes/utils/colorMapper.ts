/** Maps column status codes to the color used by the note card. */
const COLOR_BY_CODE: Record<string, string> = {
  C01: 'gray',
  C02: 'amber',
  C03: 'green',
};

/**
 * Maps note column status codes to card colors.
 * Business rule: C01→gray, C02→amber, C03→emerald.
 *
 * @param {string} code - Column status code (e.g. "C01", "C02", "C03")
 * @returns {string} Color name for the note card
 */
export const computeColorFromCode = (code: string): string => {
  return COLOR_BY_CODE[code] ?? 'gray';
};
