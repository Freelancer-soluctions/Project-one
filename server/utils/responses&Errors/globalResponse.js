export const globalResponse = (res, statusCode, data) => {
  res.status(statusCode).json({
    error: false,
    statusCode,
    data
  })
}
