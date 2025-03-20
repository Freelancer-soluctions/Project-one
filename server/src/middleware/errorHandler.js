import globalErrorResponse from '../utils/responses&Errors/globalErrorResponse.js'

export const errorHandler = (err, req, res, next) => {
  const { code, message, name, stack } = err
  let statusCode = err.statusCode

  console.log('err', err)
  console.log('statusCode', statusCode)
  console.log('message', message)
  console.log('name', name)
  console.log('stack', stack)
  if (code === 'P2002') {
    statusCode = 400
  }

  globalErrorResponse(res, statusCode, code, message, name, stack)
}

export default errorHandler
