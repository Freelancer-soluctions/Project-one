import { getUserById } from '../api/user/model.js'

const checkRoleAuth = (roles) => async (req, res, next) => {
  const { userId } = req
  const userData = await getUserById(userId)
  // TODO ['user'].includes('user')
  if (userData.roles.description === roles) {
    next()
  } else {
    res.status(409)
    res.send({ error: 'No tienes permisos' })
  }
}

export default checkRoleAuth
