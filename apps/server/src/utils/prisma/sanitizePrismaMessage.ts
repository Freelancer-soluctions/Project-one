const SAFE_MESSAGES = {
  P2000: 'A field value exceeds the maximum allowed length.',
  P2001: 'The requested record was not found.',
  P2002: 'A record with this value already exists.',
  P2003: 'Cannot perform this operation due to a related record constraint.',
  P2004: 'A database constraint was violated.',
  P2005: 'An invalid value was provided.',
  P2006: 'An invalid data type was provided.',
  P2007: 'A database validation error occurred.',
  P2008: 'The database query could not be parsed.',
  P2009: 'The database query failed validation.',
  P2010: 'A database query execution failed.',
  P2011: 'A required field cannot be null.',
  P2012: 'A required value is missing.',
  P2013: 'A required argument is missing.',
  P2014: 'This operation violates a required relationship.',
  P2015: 'A related record was not found.',
  P2016: 'The database query could not be interpreted.',
  P2017: 'The records are not connected.',
  P2018: 'A required connected record was not found.',
  P2019: 'An input error occurred.',
  P2020: 'A value is out of the allowed range.',
  P2021: 'The specified table does not exist in the database.',
  P2022: 'The specified column does not exist in the database.',
  P2023: 'Inconsistent column data detected.',
  P2024: 'The database connection pool is exhausted. Please try again.',
  P2025: 'The record you are trying to modify was not found.',
  P2026: 'This database operation is not supported.',
  P2027: 'Multiple database errors occurred.',
  P2028: 'A database transaction error occurred.',
  P2029: 'Too many parameters in the database query.',
  P2030: 'A required search index is missing.',
  P2033: 'A numeric value is out of range.',
  P2034: 'A transaction conflict occurred. Please retry the operation.',
  P2035: 'A database assertion error occurred.',
  P2036: 'An external database connector error occurred.',
  P2037: 'Too many database connections. Please try again.',
};

const DEFAULT_SAFE = 'An unexpected database error occurred.';

/**
 * Sanitizes a Prisma error message for safe API responses.
 * In production, returns a generic message without schema internals.
 * In development, optionally includes original Prisma detail.
 *
 * @param {Object} err - Prisma error object (has .code and .message)
 * @param {boolean} [includeOriginal=false] - Append original Prisma message
 * @returns {string} Sanitized message
 */
export const sanitizePrismaMessage = (err, includeOriginal = false) => {
  if (!err || typeof err !== 'object') return DEFAULT_SAFE;
  const safeMessage = SAFE_MESSAGES[err.code] || DEFAULT_SAFE;
  if (includeOriginal) {
    return `[DEV] ${safeMessage} (original: ${err.message})`;
  }
  return safeMessage;
};
