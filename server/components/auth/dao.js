import { createRow, getOneRow } from '../utils/dao.js'

const tableName = 'user'

/**  sign up
 * @param {object} user
*/
export const signUp = async (user) => {
  const userRes = await createRow(tableName, user)
  return Promise.resolve(userRes)
}

/**  get user by email
 * @param {email} email
*/
export const signIn = async (email) => {
  const user = await getOneRow({
    tableName,
    where: { email },
    include: { roles: true }
  }
  )

  return Promise.resolve(user)
}

/**  get session by id
 * @param {id} id
*/
export const session = async (id) => {
  const user = await getOneRow({
    tableName,
    where: { id },
    include: { roles: true }
  })

  return Promise.resolve(user)
}
