import crypto from 'crypto'
export const createCsrfToken = () => {
  return new Promise((resolve, reject) => {
    try {
      resolve(crypto.randomBytes(32).toString('hex'))
    } catch (error) {
      reject(error.message)
    }
  })
}
