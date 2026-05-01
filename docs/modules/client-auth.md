# Module: Auth (Client)

Descripción General
- Gestión de la autenticación en la interfaz de usuario y orquestación de flujos de login/signup.

⚙️ Servidor (Backend)
- Endpoints: ver server/auth
- Lógica: manejo de tokens, redirección, manejo de errores de login.
- DAO: no aplica en cliente

💻 Cliente (Frontend)
- Páginas: SignIn.jsx, SignUp.jsx
- API: authAPI.js
- Utilidades: schema.js para validaciones de formularios

🔗 Relaciones
- Interactúa con usuarios y permisos a través del API

## Estados/Workflows
- Flujo de autenticación: SignIn → Home; SignUp → Confirmación
