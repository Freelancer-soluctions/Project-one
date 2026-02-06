import globalErrorResponse from '../utils/responses&Errors/globalErrorResponse.js';

/**
 * Global error handling middleware for Express applications
 * @param {Error} err - Error object thrown during request processing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function (unused but required by Express)
 * @description Handles all errors that occur during request processing,
 *              maps Prisma constraint violations to 400 status codes,
 *              and sends standardized error responses
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const { code, message, name, stack } = err;
  let statusCode = err.statusCode;

  console.log('err', err);
  console.log('statusCode', statusCode);
  console.log('message', message);
  console.log('name', name);
  console.log('stack', stack);
  if (code === 'P2002') {
    statusCode = 400;
  }

  globalErrorResponse(res, statusCode, code, message, name, stack);
};
