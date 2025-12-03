import dontenv from '../../config/dotenv.js'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

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

/// ------------------------------------------------------------------

const SIGN_OPTIONS = {
  algorithm: 'HS256',
  issuer: 'mi-api',
  audience: 'mi-front'
}

const SIGN_REFRESH_OPTIONS = {
  ...SIGN_OPTIONS
  // refresh puede tener un expiry mayor
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

const createTokenWithKey = (payload, secret, expiresIn = '15m', options = SIGN_OPTIONS) => {
  return new Promise((resolve, reject) => {
    try {
      validatePayload(payload)

      if (!secret) {
        return reject('La clave secreta del token no está definida.')
      }

      jwt.sign(payload, secret, { ...options, expiresIn }, (err, token) => {
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
  createTokenWithKey(payload, dontenv('SECRETKEY'), '120000', SIGN_OPTIONS)

export const createRefreshToken = (payload) =>
  createTokenWithKey(payload, dontenv('REFRESHSECRETKEY'), '1d', SIGN_REFRESH_OPTIONS)

export const createRefreshTokenOpaque = () => {
  return new Promise((resolve, reject) => {
    try {
      resolve(crypto.randomBytes(64).toString('hex'))
    } catch (error) {
      reject(error.message)
    }
  })
}
