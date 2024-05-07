import { globalErrorResponse } from '../utils/globalErrorResponse.js'

export const errorHandler = (err, req, res, next) => {
  const { statusCode, message } = err
  globalErrorResponse(res, statusCode, message)
}
