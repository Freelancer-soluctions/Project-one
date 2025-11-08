export const verifyCsrf = (req, res, next) => {
  const csrfCookie = req.cookies.csrfToken
  const csrfHeader = req.headers['csrf-token']

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ message: 'CSRF validation failed' })
  }
  next()
}
