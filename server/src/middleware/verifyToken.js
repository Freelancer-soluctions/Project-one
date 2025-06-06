import jwt, { decode } from 'jsonwebtoken'
import dontenv from '../config/dotenv.js'

export const verifyToken = async (req, res, next) => {
  try {
    // Get the token from the headers
    const authHeader = req.headers.authorization || req.headers.Authorization
    console.log('auth', authHeader)
    if (!authHeader) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    const token = authHeader.split(' ')[1]

    // if does not exists a token
    if (!token) {
      return res
        .status(401)
        .json({ message: 'Lo sentimos debes iniciar sesión.' })
    }

    // decode the token and verify the time
    const decoded = await jwt.verify(token, dontenv('SECRETKEY'))

    // Validate if the token has no expired
    // console.log(decoded)
    // console.log(Date.now(decoded.exp))
    // if (decoded.exp <= Date.now()) {
    //   return res
    //     .status(401)
    //     .json({ message: 'Token expired' })
    // }
    // save the token on request object to using on routes
    req.userId = decoded.id
    req.user = decoded
    // continue with the next function
    next()
  } catch (error) {
    return res.status(401).json({ error: error.message })
  }
}
