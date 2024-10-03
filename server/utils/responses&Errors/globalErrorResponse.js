// import logger from '../../logger/index.js'
const globalErrorResponse = (res, statusCode = 500, message, name, stack) => {
  // logger.error({
  //   message,
  //   name,
  //   stack
  // })
  res.status(statusCode).json({
    error: true,
    statusCode,
    message
  })
}

export default globalErrorResponse
