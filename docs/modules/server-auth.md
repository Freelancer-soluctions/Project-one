# Module: Auth (Server)

Descripción General
- Manejo de autenticación y autorización en el backend, incluyendo tokens, refresh tokens y permits.

🗄️ Base de Datos (schema.prisma)
- Entidades: refreshToken, permissions, userPermits, roles, userStatus, etc.

⚙️ Servidor (Backend)
- Endpoints: /api/auth, /api/auth/refresh, etc. (ver server/auth/routes.js)
- Lógica de negocio: hashing de contraseñas, verificación, generación de tokens, validaciones de permisos.
- DAO: acceso a tokens, permisos y roles (dao.js)

💻 Cliente (Frontend)
- Referenciado para interacción con login/signup

🔗 Relaciones
- Integra con users, permissions, userPermits, refreshToken
