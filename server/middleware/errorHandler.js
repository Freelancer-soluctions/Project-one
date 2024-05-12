import globalErrorResponse from '../utils/responses&Errors/globalErrorResponse.js'

export const errorHandler = (err, req, res, next) => {
  const { statusCode, message, name, stack } = err
  // console.log(err)
  globalErrorResponse(res, statusCode, message, name, stack)
}

export default errorHandler
