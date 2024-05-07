export const globalErrorResponse = (res, status = 500, message) => {
  res.status(status).json({
    error: true,
    statusCode: status,
    message
  })
}
