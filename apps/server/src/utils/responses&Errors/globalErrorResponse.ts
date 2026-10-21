import type { Response } from 'express';
import logger from '../../logger/index.js';

const globalErrorResponse = (
  res: Response,
  statusCode: number = 500,
  code: string,
  message: string
) => {
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
