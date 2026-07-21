# Module: Users (Server)

Descripción General
- Gestión de usuarios en la capa de servidor. Incluye autenticación, autorización y persistencia de usuarios.

🗄️ Base de Datos (schema.prisma)
- Entidad principal: users
- Campos clave: id, name, email, password, roleId, statusId, etc.
- Relaciones: roles, userStatus, refreshToken, userPermits, etc.

⚙️ Servidor (Backend)
- Endpoints API: /api/users, /api/users/:id (ver server routes)
- Lógica de negocio: autenticación, hash de contraseñas, validaciones de unicidad de email, asignación de roles.
- DAO: acceso a Prisma para usuarios y relaciones (dao.js)

💻 Cliente (Frontend)
- Referenciado en docs/modules/client-users.md para relación cliente-servidor

🔗 Relaciones
- Relaciones con roles, permisos, tokens de refresco, y otros módulos de HR, Inventario, Ventas, etc.

## Estados/Workflows
- Estados de usuario: Activo, Inactivo
