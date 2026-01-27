/**
 * Higher-order function that wraps async route handlers to catch errors automatically
 * @param {Function} fn - Async function to wrap (typically an Express route handler)
 * @returns {Function} Middleware function that handles errors and passes them to next()
 * @description This eliminates the need for try-catch blocks in async route handlers
 */
const handleCatchErrorAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res).catch((err) => {
      next(err);
    });
  };
};
export default handleCatchErrorAsync;
