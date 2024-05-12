import dontenv from '../../config/dotenv.js'
import jwt from 'jsonwebtoken'

const createToken = (userId = '') => {
  return new Promise((resolve, reject) => {
    jwt.sign({ id: userId }, dontenv('SECRETKEY'), {
      expiresIn: '24h'
    }, (err, token) => {
      if (err) {
        reject('token not generated.')
      } else {
        resolve(token)
      }
    })
  })
}

export default createToken
