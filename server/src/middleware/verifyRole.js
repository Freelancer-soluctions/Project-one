import { getUserRoleByUserId } from '../components/users/service.js'
import { ROLESCODES } from '../utils/constants/enums.js'

export function checkRoleAuth ({ allowedRoles = [] }) {
  return async (req, res, next) => {
    try {
      const user = await getUserRoleByUserId(req.userId)
      if (!user || !user?.roles.code) {
        return res.status(403).json({ error: 'No se pudo verificar el rol' })
      }

      const userRole = user?.roles.code

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({ error: 'No tienes permisos suficientes' })
      }

      // Opcional: puedes guardar el user completo en req.user si lo necesitas después
      // req.user = user;

      next()
    } catch (error) {
      res.status(500).json({ error: 'Error en la verificación de permisos' })
    }
  }
}

export const checkRoleAuthOrPermisssion = ({ allowedRoles = [], permissions = [] }) => async (req, res, next) => {
  const { userId } = req
  // console.log('Required Permissions:', permissions)

  try {
    const user = await getUserRoleByUserId(userId)
    // console.log('User Role and Permissions:', user)

    if (!user || !user.roles?.code) {
      return res.status(403).json({ error: 'No se pudo verificar el rol o permisos del usuario' })
    }

    const userRoleCode = user.roles.code

    // 1. Si es ADMIN, pasa sin validaciones extra de permisos el admin no necesita permisos ya que tiene control total del sistema.
    if (userRoleCode === ROLESCODES.ADMIN) {
      return next()
    }

    // 2. Validar si el rol está permitido explícitamente (opcional) USER o MANAGER
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRoleCode)) {
      return res.status(403).json({ error: 'Rol no autorizado para esta acción' })
    }

    // 3. Obtener permisos del rol Se obtiene un array de permisos del rol del usuario, por ejemplo:
    const rolePermissions = user.rolePermits?.map(rp => rp.permissions.code) || []
    // 4. Validar si tiene al menos uno de los permisos requeridos
    const hasSomePermission = permissions.some(p => rolePermissions.includes(p))

    if (!hasSomePermission) {
      return res.status(403).json({ error: 'Permisos insuficientes para esta operación' })
    }

    return next()
  } catch (error) {
    console.error('Middleware auth error:', error)
    return res.status(500).json({ error: 'Error interno en la verificación de permisos' })
  }
}
