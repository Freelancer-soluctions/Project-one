import logger from '../../logger/index.js'
const globalErrorResponse = (res, statusCode = 500, code, message, name, stack) => {
  logger.error({
    message,
    name,
    stack
  })
  res.status(statusCode).json({
    error: true,
    message,
    code
  })
}

export default globalErrorResponse
