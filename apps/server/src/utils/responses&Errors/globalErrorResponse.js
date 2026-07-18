import logger from '../../logger/index.js';

const globalErrorResponse = (res, statusCode = 500, code, message) => {
  const safeCode = code || 'INTERNAL_ERROR';
  const safeMessage = message || 'An unexpected error occurred';
  logger.error({ message: safeMessage, code: safeCode, statusCode });
  res.status(statusCode).json({
    success: false,
    statusCode,
    code: safeCode,
    message: safeMessage,
  });
};

export default globalErrorResponse;
