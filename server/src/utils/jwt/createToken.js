import dontenv from '../../config/dotenv.js'
import jwt from 'jsonwebtoken'

/**
 *

 */
export const createTokenOld = (payload = {}) => {
  return new Promise((resolve, reject) => {
    jwt.sign({ ...payload }, dontenv('SECRETKEY'), {
      // expiresIn: '120000' // 2 min
      // expiresIn: '10m'
      // expiresIn: '9000000' // 15 min (900000)
      // expiresIn: '5m'
      expiresIn: '1d'
    }, (err, token) => {
      if (err) {
        reject('token not generated.')
      } else {
        console.log('token generated', token)
        resolve(token)
      }
    })
  })
}

export const createRefreshTokenOld = (payload = {}) => {
  return new Promise((resolve, reject) => {
    jwt.sign({ ...payload }, dontenv('REFRESHSECRETKEY'), {
      expiresIn: '1d'
    }, (err, token) => {
      if (err) {
        reject('refresh token not generated.')
      } else {
        resolve(token)
      }
    })
  })
}

function validatePayload (payload) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    Array.isArray(payload) ||
    Object.keys(payload).length === 0
  ) {
    throw new Error('El payload del token es obligatorio y debe ser un objeto no vacío.')
  }
}

const createTokenWithKey = (payload, secret, expiresIn = '1d') => {
  return new Promise((resolve, reject) => {
    try {
      validatePayload(payload)

      if (!secret) {
        return reject('La clave secreta del token no está definida.')
      }

      jwt.sign(payload, secret, { expiresIn }, (err, token) => {
        if (err) {
          return reject('Error generando el token.')
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('Token generado:', token)
        }

        resolve(token)
      })
    } catch (error) {
      reject(error.message)
    }
  })
}

export const createToken = (payload) =>
  createTokenWithKey(payload, dontenv('SECRETKEY'), '1d')

export const createRefreshToken = (payload) =>
  createTokenWithKey(payload, dontenv('REFRESHSECRETKEY'), '1d')
