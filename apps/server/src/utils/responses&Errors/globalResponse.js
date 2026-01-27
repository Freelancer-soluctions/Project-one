/**
 * Sends a standardized success response to clients
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (typically 2xx for success)
 * @param {*} data - Response data payload
 * @param {string|null} message - Optional message to include in response
 * @description Creates a consistent response format across the API with error flag set to false
 */
const globalResponse = (res, statusCode, data, message = null) => {
  res.status(statusCode).json({
    error: false,
    statusCode,
    data,
    ...(message && { message }),
  });
};
export default globalResponse;
