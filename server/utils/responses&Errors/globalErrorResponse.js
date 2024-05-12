import logger from '../../logger/index.js'
export const globalErrorResponse = (res, status = 500, message, name, stack) => {
  logger.error({
    message,
    name,
    stack
  })
  res.status(status).json({
    error: true,
    statusCode: status,
    message
  })
}
