import bcrypt from 'bcrypt'

export const encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export const comparePassword = async (password, savedPassword) => {
  return bcrypt.compare(password, savedPassword)
}
