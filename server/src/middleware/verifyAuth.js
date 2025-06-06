import { getUserRoleByCode } from '../components/users/service.js'

export function checkRoleAuth (allowedRoles = []) {
  return async (req, res, next) => {
    try {
      const rol = await getUserRoleByCode(req.user.rol.code)
      if (!rol || !rol?.code) {
        return res.status(403).json({ error: 'No se pudo verificar el rol' })
      }

      const userRole = rol.code

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
