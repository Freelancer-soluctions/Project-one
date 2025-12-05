import bcrypt from 'bcrypt'
import zxcvbn from 'zxcvbn'
import dontenv from '../../config/dotenv.js'

export const encryptPassword = async (password) => {
  const saltENV = dontenv('BCRYPTSALT')
  const salt = await bcrypt.genSalt(Number(saltENV))
  return bcrypt.hash(password, salt)
}

export const comparePassword = async (password, savedPassword) => {
  return bcrypt.compare(password, savedPassword)
}

export const validatePasswordStrength = (password) => {
  const evaluation = zxcvbn(password)
  return evaluation.score >= 3 // mínimo recomendado
}
