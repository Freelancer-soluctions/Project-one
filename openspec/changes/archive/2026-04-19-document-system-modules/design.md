# Design: Document System Modules

How (Cómo se implementará la documentación)
- Generar un documento Markdown por módulo bajo docs/modules/, con la siguiente estructura base:
- Descripción General
- 🗄️ Base de Datos (schema.prisma) – para módulos del servidor, con entidades, campos y relaciones exactly como aparecen en Prisma.
- ⚙️ Servidor (Backend)
  - Endpoints API (método, endpoint, función, controlador)
  - Lógica de negocio (service.js)
  - DAO (dao.js)
- 💻 Cliente (Frontend)
  - Páginas y componentes relevantes
  - API (llamadas al servidor)
  - Utilidades (schemas, enums, adapters)
- 🔗 Relaciones (con otros módulos)
- Estados/Workflows (si aplica)
- Cuando exista versión cliente y versión servidor para el mismo módulo, se documentarán en la misma página, indicando cada versión y las diferencias; si no hay versión cliente, se referenciará al servidor.

Enfoque técnico
- Se tomará como fuente principal las estructuras ya existentes en el repositorio:
  - Server side: prisma/schema.prisma para entidades y relaciones; routes/controller/service/dao para endpoints y lógica; archivos de cliente para la capa frontend.
- Mantener consistencia de terminología (pluralización) entre clientes y servidor; documentar diferencias cuando existan.
- Mantener formato estable para facilitar futuras actualizaciones y automatización de generación de docs.

Entregables
- 49 archivos Markdown en docs/modules/: un por cada módulo listado (cliente + servidor).
- Un índice `docs/modules/INDEX.md` que lista módulos y vínculos cruzados.
