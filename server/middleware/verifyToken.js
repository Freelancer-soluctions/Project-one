import jwt from 'jsonwebtoken'
import dontenv from '../config/dotenv.js'

const verifyToken = async (req, res, next) => {
  try {
    // Get the token from the headers
    const authHeader = req.headers.Authorization
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
    // continue with the next function
    next()
  } catch (error) {
    return res.status(401).json({ error: error.message })
  }
}

export default verifyToken
