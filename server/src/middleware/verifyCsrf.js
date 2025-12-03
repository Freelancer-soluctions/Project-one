import crypto from 'crypto'
export const verifyCsrfOld = (req, res, next) => {
  const csrfCookie = req.cookies.csrfToken
  const csrfHeader = req.headers['csrf-token']

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    return res.status(403).json({ message: 'CSRF validation failed' })
  }
  next()
}

// export const verifyCsrf = (req, res, next) => {
//   try {
//     const csrfCookie = req.cookies?.csrfToken
//     const csrfHeader = req.headers['csrf-token'] // Los headers SIEMPRE se reciben en minúsculas en Node.js.
//     // const csrfHeader = req.get('CSRF-Token') // Express sí respeta la capitalización en req.get().
//     // console.log('entre 1', csrfCookie)
//     // console.log('entre 2', csrfHeader)

//     if (!csrfCookie || !csrfHeader) return res.status(403).json({ message: 'CSRF validation failed 1' })

//     const bufCookie = Buffer.from(csrfCookie, 'utf8')
//     const bufHeader = Buffer.from(csrfHeader, 'utf8')

//     if (bufCookie.length !== bufHeader.length || !crypto.timingSafeEqual(bufCookie, bufHeader)) {
//       return res.status(403).json({ message: 'CSRF validation failed 2' })
//     }
//     next()
//   } catch (err) {
//     console.log(err)
//     return res.status(403).json({ message: 'CSRF validation failed 3' })
//   }
// }

export const verifyCsrf = (req, res, next) => {
  try {
    const csrfCookie = req.cookies?.csrfToken
    const csrfHeader = req.headers['csrf-token'] // express siempre los pasa en minúscula

    if (!csrfCookie || !csrfHeader) {
      return res.status(403).json({ message: 'CSRF validation failed (missing tokens)' })
    }

    const cookieBuf = Buffer.from(csrfCookie, 'utf8')
    const headerBuf = Buffer.from(csrfHeader, 'utf8')

    if (cookieBuf.length !== headerBuf.length) {
      return res.status(403).json({ message: 'CSRF validation failed (invalid length)' })
    }

    if (!crypto.timingSafeEqual(cookieBuf, headerBuf)) {
      return res.status(403).json({ message: 'CSRF validation failed (invalid token)' })
    }

    next()
  } catch (err) {
    console.error('CSRF ERROR:', err)
    return res.status(403).json({ message: 'CSRF validation failed (exception)' })
  }
}

const csrfExcludedRoutes = [
  '/auth/signin',
  '/auth/signup',
  '/auth/logout'
]

export const csrfConditional = (req, res, next) => {
  const isGet = req.method === 'GET'
  const isExcluded = csrfExcludedRoutes.includes(req.path)
  console.log('entre aqui estoy bien')
  if (isGet || isExcluded) {
    return next() // no aplicar CSRF
  }

  // Aplicar el middleware real de csrf
  return verifyCsrf(req, res, next)
}
