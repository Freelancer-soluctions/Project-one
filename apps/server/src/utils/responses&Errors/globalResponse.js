const globalResponse = (res, statusCode, data, message = null) => {
  res.status(statusCode).json({
    error: false,
    statusCode,
    data,
    ...(message && { message }),
  });
};
export default globalResponse;
