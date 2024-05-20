import jwt from 'jsonwebtoken'
import dontenv from '../config/dotenv.js'

const verifyToken = async (req, res, next) => {
  try {
    // Get the token from the headers
    const token = req.headers['x-access-token']
    // if does not exists a token
    if (!token) {
      return res
        .status(401)
        .json({ message: 'Lo sentimos debes iniciar sesión.' })
    }

    // decode the token
    const decoded = await jwt.verify(token, dontenv('SECRETKEY'))
    // save the token on request object to using on routes
    req.userId = decoded.id
    // continue with the next function
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Lo sentimos debes iniciar sesión.' })
  }
}

export default verifyToken
