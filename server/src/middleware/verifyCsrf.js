export const verifyCsrfOld = (req, res, next) => {
  const csrfCookie = req.cookies.csrfToken
  const csrfHeader = req.headers['csrf-token']

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ message: 'CSRF validation failed' })
  }
  next()
}

export const verifyCsrf = (req, res, next) => {
  try {
    const csrfCookie = req.cookies?.csrfToken
    const csrfHeader = req.headers['x-csrf-token']

    if (!csrfCookie || !csrfHeader) return res.status(403).json({ message: 'CSRF validation failed' })

    const bufCookie = Buffer.from(csrfCookie, 'utf8')
    const bufHeader = Buffer.from(csrfHeader, 'utf8')

    if (bufCookie.length !== bufHeader.length || !crypto.timingSafeEqual(bufCookie, bufHeader)) {
      return res.status(403).json({ message: 'CSRF validation failed' })
    }
    next()
  } catch (err) {
    return res.status(403).json({ message: 'CSRF validation failed' })
  }
}
