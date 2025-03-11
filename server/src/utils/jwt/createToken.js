import dontenv from '../../config/dotenv.js'
import jwt from 'jsonwebtoken'

export const createToken = (userId = '') => {
  return new Promise((resolve, reject) => {
    jwt.sign({ id: userId }, dontenv('SECRETKEY'), {
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

export const createRefreshToken = (userId) => {
  return new Promise((resolve, reject) => {
    jwt.sign({ id: userId }, dontenv('REFRESHSECRETKEY'), {
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
