import jwt from 'jsonwebtoken'
import dotenv from '../config/dotenv.js'   // misma importación que verifyToken.js
import logger from '../logger/index.js'

/**
 * Crea middleware de autenticación JWT para Socket.IO.
 * Se ejecuta en cada conexión via io.use().
 * Reutiliza el mismo SECRETKEY y algoritmo HS256 que Express.
 * 
 * @returns {Function} middleware function (socket, next) => void
 */
export const createAuthMiddleware = () => {
  return (socket, next) => {
    try {
      // El token se envía desde el cliente en socket.handshake.auth.token,
      // NO en query params (quedan en logs del servidor). Socket.IO provee
      // handshake.auth específicamente para credenciales de conexión.
      const token = socket.handshake.auth?.token

      if (!token) {
        logger.warn('⚠️ WS CONEXION SIN TOKEN', {
          ip: socket.handshake.address,
          timestamp: new Date().toISOString(),
        })
        return next(new Error('UNAUTHORIZED'))
      }

      // Verificar token con HS256. Mismas opciones que verifyToken.js de Express:
      // issuer 'mi-api', audience 'mi-front'
      const decoded = jwt.verify(token, dotenv('SECRETKEY'), {
        algorithms: ['HS256'],
        issuer: 'mi-api',
        audience: 'mi-front',
      })

      // Guardar payload decodificado en socket.data.user para handlers posteriores
      // socket.data persiste durante toda la vida del socket
      socket.data.user = decoded

      // next() sin argumentos = autenticación exitosa, procede a connection
      next()
    } catch (error) {
      logger.warn('⚠️ WS TOKEN INVALIDO', {
        ip: socket.handshake.address,
        error: error.message,
        timestamp: new Date().toISOString(),
      })
      // Socket.IO interpreta next(new Error(msg)) como rechazo de conexión
      // El cliente recibe 'connect_error' con este mensaje
      return next(new Error('UNAUTHORIZED'))
    }
  }
}