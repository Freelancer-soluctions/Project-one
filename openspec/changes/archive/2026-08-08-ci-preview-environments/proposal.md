## Why

El monorepo Project One carece de validación de preview por Pull Request (Stage 6 del plan `docs/cicd-plan-implementacion.md`). Hoy un revisor solo puede validar un PR ejecutando el stack localmente o mergeando a `main`, y no existe forma de validar el backend contra AWS emulado ni el frontend en un entorno de preview realista antes del merge.

**Decisión de scope (2026-07):** Floci **NO** es un proveedor de hosting cloud — es un **emulador local de AWS** ("Any Cloud. Locally", MIT, puerto 4566). Se descarta el hosting cloud pagado para previews (Railway/Render/Fly.io). Floci se adopta como **capa de aprendizaje y emulación de AWS** en local y en CI, no como host de un preview público.

**Estado actual:**

- El backend Express usa `@aws-sdk/client-secrets-manager` (`apps/server/src/config/aws/secret-manager.client.js`) que respeta `AWS_ENDPOINT_URL` — el código está listo para emulación, pero no hay stack emulado activo
- `apps/server/docker-compose.yml` contiene una sección LocalStack comentada (dev local); la migración LocalStack → Floci es el change `ci-floci-migration` (separado)
- No existe preview del frontend por PR (Vercel no conectado como GitHub App)
- No existe workflow de validación de preview ni documentación de aprendizaje AWS con Floci
- `apps/server/package.json` solo incluye `@aws-sdk/client-secrets-manager` entre los SDKs AWS

**Qué resuelve:**

- **Aprendizaje AWS con Floci (local + CI)**: stack docker-compose con server + Floci + PostgreSQL efímera para aprender servicios AWS localmente (Secrets Manager vía `AWS_ENDPOINT_URL`) sin cuenta real ni costo
- **Validación de PR**: el workflow `preview.yml` levanta el stack emulado en CI, corre smoke tests contra AWS emulado y comenta los resultados en el PR
- **Preview del client**: Vercel GitHub App nativa genera una preview URL automática por PR (sin workflow custom para Vercel)
- **Cero recursos cloud**: la validación del backend es efímera (muere con el runner de CI) y Vercel limpia el preview del client al mergear — no hay hosting pagado ni recursos que limpiar

## What Changes

- Crear `apps/server/docker-compose.preview.yml`: stack efímero con `server` (Dockerfile existente) + `floci` (`floci/floci:v1.5.11`, puerto 4566, storage en memoria) + `db` (postgres:16-alpine, sin volumen persistente) para emulación AWS en local y CI
- Crear workflow `.github/workflows/preview.yml` en `pull_request` (opened, reopened, synchronize) contra `main`: build del server, levantar Floci + PostgreSQL como service containers del runner, `prisma migrate deploy`, correr smoke tests contra AWS emulado (`AWS_ENDPOINT_URL`) y comentar los resultados en el PR
- Conectar Vercel como GitHub App nativa para preview automático del client React por PR (config en dashboard: root `apps/client`, preset Vite — sin acción custom; el workflow captura la URL del preview vía commit status con `GITHUB_TOKEN`, sin secrets custom)
- Comentar en el PR: URL de preview del client (Vercel) + estado de la validación del backend contra el stack AWS emulado (smoke tests)
- Documentar el ciclo de vida efímero: la validación CI muere con el runner al terminar y Vercel elimina el preview del client al mergear — no queda ningún recurso cloud que limpiar
- Crear documentación `docs/aws-learning-with-floci.md`: cómo levantar el stack emulado localmente, qué servicios AWS emula Floci, cómo el código de Secrets Manager se conecta vía `AWS_ENDPOINT_URL`, y ruta de aprendizaje
- **Sin secrets de GitHub nuevos**: solo `GITHUB_TOKEN` (automático) para comentar en el PR y capturar la URL del preview Vercel vía commit status
- **BREAKING**: No aplica — es tooling de CI/CD y documentación; no se modifican contratos de API ni flujos de usuario; no se toca producción ni staging existentes

## Capabilities

### New Capabilities

- `ci-preview-aws-emulation`: Stack local + CI con Floci emulando servicios AWS (server + Floci + PostgreSQL efímera) para aprendizaje de AWS y validación de PRs; el código de Secrets Manager se conecta vía `AWS_ENDPOINT_URL` — **NO es hosting**
- `ci-preview-client-vercel`: Preview deployment del frontend React por PR vía Vercel GitHub App nativa (URL automática `*.vercel.app`, sin acción custom)
- `ci-preview-workflow`: Workflow `preview.yml` que valida el backend contra el stack AWS emulado (build + smoke tests) y publica en el PR los resultados junto a la URL del preview Vercel
- `ci-preview-cleanup`: Ciclo de vida efímero — la validación CI muere con el runner y Vercel elimina el preview del client al mergear; sin recursos cloud que limpiar
- `ci-preview-docs`: Guía de aprendizaje AWS con Floci (`docs/aws-learning-with-floci.md`): stack local, servicios emulados, conexión Secrets Manager vía `AWS_ENDPOINT_URL`, ruta de aprendizaje

### Modified Capabilities

- Ninguna: los specs existentes (`openspec/specs/`) cubren funcionalidad de la aplicación (events, notes, websocket, etc.), no tooling de CI. Este change introduce capacidades nuevas de CI/CD sin cambiar requisitos de comportamiento de la app.

## Impact

- **`.github/workflows/preview.yml`**: Nuevo workflow (validación backend contra AWS emulado + comentario con resultados y URL Vercel)
- **`apps/server/docker-compose.preview.yml`**: Nuevo compose de emulación/preview (server + floci + db efímera); el compose dev-local (`docker-compose.yml`) queda intacto
- **apps/server**: Dockerfile existente (node:20-alpine, EXPOSE 3000) reutilizable para el build del stack emulado
- **Vercel**: Config del proyecto en dashboard (GitHub App + project settings) — se documenta, no hay archivo en repo
- **Sin GitHub Secrets nuevos**: solo `GITHUB_TOKEN` (automático)
- **Docs**: `docs/aws-learning-with-floci.md` (nuevo)
- **No afecta**: producción, staging, `ci.yml`, `quality.yml`, ni flujos de la aplicación
