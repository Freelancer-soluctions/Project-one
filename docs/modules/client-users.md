# Module: Users (Client)

Descripción General
- Gestión de usuarios desde la perspectiva del cliente. Este módulo consume APIs expuestas por el backend y maneja vistas de usuario, perfiles y autenticación a nivel de interfaz.

🏷️ Entidades relacionadas
- No se define en el cliente; usa las entidades del servidor para validar relaciones y roles a nivel de negocio.

⚙️ Servidor (Backend)
- Endpoints API: consumo desde el cliente (ver server: users)
- Lógica de negocio: consumo de APIs, validaciones a nivel de UI, gestión de estados de UI.
- DAO: no aplica directamente en el cliente

💻 Cliente (Frontend)
- Páginas: modules/users/pages/Users.jsx (si existe)
- Componentes: UsersFiltersForm, UsersDatatable, UsersDialog (ejemplos)
- API: usersAPI.js (consumo de backend)

🔗 Relaciones
- Consume usuarios para roles y permisos a través del backend

## Estados/Workflows
- Navegación: listado → crear/editar → detalle (si aplica)
