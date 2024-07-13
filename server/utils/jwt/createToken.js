import dontenv from '../../config/dotenv.js'
import jwt from 'jsonwebtoken'

export const createToken = (userId = '') => {
  return new Promise((resolve, reject) => {
    jwt.sign({ id: userId }, dontenv('SECRETKEY'), {
      expiresIn: '120000'
    }, (err, token) => {
      if (err) {
        reject('token not generated.')
      } else {
        resolve(token)
      }
    })
  })
}

export const createRfreshToken = (userId) => {
  return new Promise((resolve, reject) => {
    jwt.sign({ id: userId }, dontenv('REFRESHSECRETKEY'), {
      expiresIn: '30d'
    }, (err, token) => {
      if (err) {
        reject('refrs token not generated.')
      } else {
        resolve(token)
      }
    })
  })
}
