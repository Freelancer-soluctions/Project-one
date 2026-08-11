# Server Bootstrap Env Vars — Guía Operativa

> Documento de referencia para las env vars que el server Express **requiere para arrancar**.
> Creado: 2026-08-10 — tras el bug del workflow `preview.yml` (curl exit code 7).
> Audiencia: desarrolladores, devops, agentes que editan workflows o task definitions.

---

## Por qué existe este doc

El server Express aborta el proceso Node **antes de escuchar en el puerto 3000** si faltan env vars exigidas por módulos que se cargan en el bootstrap (import top-level). El síntoma en CI es:

```
⏳ Waiting for server... (1/30) [HTTP 000]
...
❌ Server health check failed after 60s
Error: Process completed with exit code 7.
```

`curl` exit code 7 = **connection refused** (ningún proceso escucha en el puerto). No es un timeout de health check — el proceso nunca llegó a `httpServer.listen(3000)`.

Root cause: `apps/server/src/middleware/encription-prisma-middleware.js` líneas 4-17, importado por `db.js` → `app.js` → `bin/index.js`:

```js
const ALGORITHM = dotenv('ALGORITHM'); // línea 4
if (!dotenv('AES_GCM_KEY')) {
  // línea 7
  throw new Error('❌ AES_GCM_KEY no está definida'); // aborta el proceso
}
const ENCRYPTION_KEY = Buffer.from(dotenv('AES_GCM_KEY'), 'base64');
if (ENCRYPTION_KEY.length !== 32) {
  // línea 13
  throw new Error('❌ AES_GCM_KEY debe ser de 32 bytes');
}
```

Cada workflow o stack que arranque el contenedor del server debe inyectar estas env vars ANTES del `docker run` / task definition. Las tareas de SDD activas ya lo reflejan tras la remediación del 2026-08-10 (change `cd-aws-deploy-pipeline`, task 0.5).

---

## Mapa rápido de stages (entornos del repo)

> Resumen ejecutivo para ubicar el flujo. Detalle exhaustivo en `docs/cicd-estado-actual.md` (§5-§11, §16).

| Stage                             | Workflow                                  | Cuándo corre                                            | Entorno                                                                                        | Persistente?             | Gate                                                                                                                                                               |
| --------------------------------- | ----------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **CI (validación)**               | `ci.yml` + `security.yml` + `quality.yml` | Cada PR vs `main`                                       | Runner efímero                                                                                 | No                       | lint + tests + build + e2e + security → mergeable                                                                                                                  |
| **Preview** ⭐                    | `preview.yml`                             | Cada PR vs `main` (opened/reopened/synchronize)         | Runner efímero: Floci (AWS emulado) + Postgres efímera + contenedor del server + URL de Vercel | No (muere con el runner) | Valida que el **Dockerfile real** + migraciones + smoke (Secrets Manager emulado) funcionen; publica comentario en el PR con estado del backend + URL del frontend |
| **CD Fase 1 (validación imagen)** | `deploy.yml` job `docker-build`           | Push a `main` (post-merge)                              | Runner efímero: Floci + Postgres                                                               | No                       | misma validación emulada que preview, pero del lado derecho del merge (gate previo a ECR)                                                                          |
| **Staging**                       | `deploy.yml` job `deploy-staging`         | Push a `main` (si `vars.AWS_ROLE_ARN`) + ECR push OK    | **AWS ECS Fargate real** (`project-one-staging`) — gated por `environment: staging`            | Sí                       | auto-deploy; health check + smoke post-deploy                                                                                                                      |
| **Production**                    | `deploy.yml` job `deploy-production`      | Tras staging OK + **approval manual** (protection rule) | **AWS ECS Fargate real** (`project-one-prod`) — `environment: production`                      | Sí                       | **approval humano** + health check 5 min + smoke remoto                                                                                                            |

**¿Qué es `preview.yml`?** (para no técnicos): cuando abres un PR contra `main`, GitHub levanta un "mini-proyecto" temporal: arranca el servidor backend real (build de Docker), una base de datos PostgreSQL efímera, un emulador de AWS (Floci, para probar Secrets Manager sin credenciales reales), y ejecuta smoke tests. En paralelo, Vercel despliega una URL temporal del frontend. Al final, `preview.yml` **publica un comentario en el PR** con: ✅/❌ validación del backend + URL del preview del frontend. Todo muere cuando cierras el PR — no es un entorno persistente.

**Relación entre los dos flujos emulados**: `preview.yml` (por PR, feedback temprano) y `deploy.yml:docker-build` (post-merge, gate del CD) hacen **la misma validación emulada** en dos momentos del ciclo. El researcher 2026-08-10 sugirió extraer un reusable workflow para evitar drift (ver `docs/cicd-estado-actual.md` §17).

---

## Mapa completo de env vars leídas en el bootstrap

Categorías:

- **🔴 Críticas (arranque)**: si faltan, `throw` aborta el proceso antes de `listen(3000)`.
- **🟡 Condicionales (funcionalidad)**: si faltan, el server arranca pero algunas rutas fallan en runtime.
- **🟢 Opciones con default**: si faltan, se usa un default seguro.

| Env var                                             | Categoría      | Dónde se lee                                                              | Default                             | Síntoma si falta                                                                   |
| --------------------------------------------------- | -------------- | ------------------------------------------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------- |
| `AES_GCM_KEY`                                       | 🔴 Crítica     | `encription-prisma-middleware.js:7,11`, `utils/prisma/prisma-query.js:11` | sin default                         | `throw` al importar → curl exit code 7                                             |
| `ALGORITHM`                                         | 🔴 Crítica     | `encription-prisma-middleware.js:4`, `utils/prisma/prisma-query.js:10`    | sin default                         | `crypto.createCipheriv(undefined, …)` → error al cifrar/descifrar                  |
| `DATABASE_URL`                                      | 🔴 Crítica     | Prisma client implícito                                                   | sin default                         | `prisma.$queryRaw` falla en `/health` → HTTP 503 (degraded)                        |
| `SECRETKEY`                                         | 🟡 Condicional | `socket/auth.js:30`, `utils/jwt/createToken.js:9,33,152,173`              | sin default                         | El server arranca, falla al firmar/verificar JWT (rutas `/api/v1/auth/*`, sockets) |
| `REFRESHSECRETKEY`                                  | 🟡 Condicional | `utils/jwt/createToken.js:33,173`                                         | sin default                         | Falla al renovar refresh token                                                     |
| `ORIGIN_CORS`                                       | 🟡 Condicional | `config/cors.js:6`                                                        | sin default                         | CORS con `undefined` en array — arranca,/browser rechazado                         |
| `ORIGIN_CORS_TEST`                                  | 🟡 Condicional | `config/cors.js:8`                                                        | sin default                         | Igual que el anterior                                                              |
| `FRONTEND_URL`                                      | 🟡 Condicional | `utils/helmet/helmet.config.js:16`                                        | sin default                         | CSP con `undefined` — arranca, headers mal formados                                |
| `NODE_ENV`                                          | 🟢 Default     | `logger/index.js:31`, `helmet.config.js:17`, `db.js:6`                    | `'development'` (via `dotenv.js:9`) | Log level y HSTS se ajustan al default                                             |
| `PORT`                                              | 🟢 Default     | `bin/index.js:8`                                                          | `3000`                              | Escucha en 3000                                                                    |
| `BCRYPT_SALT`                                       | 🟡 Condicional | `utils/bcrypt*` (al registrar usuario)                                    | sin default                         | Falla el cifrado de password                                                       |
| `AWS_REGION`                                        | 🟡 Condicional | `config/aws/secret-manager.client.js:4`                                   | sin default                         | `secretsClient` usará `undefined` — falla al llamar a Secrets Manager              |
| `AWS_ENDPOINT_URL`                                  | 🟡 Condicional | `config/aws/secret-manager.client.js:8`                                   | sin default                         | Si falta, el cliente apunta a AWS real (no Floci)                                  |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`       | 🟡 Condicional | SDK AWS implícito                                                         | sin default                         | Falla auth AWS                                                                     |
| `CLOUD_NAME` / `CLOUD_API_KEY` / `CLOUD_API_SECRET` | 🟡 Condicional | `utils/cloudinary/cloudinary.js:4-6`                                      | sin default                         | Cloudinary no inicializa — subidas de imagen fallan                                |
| `SECRETCOOKIEKEY`                                   | 🟡 Condicional | cookie signing implícito                                                  | sin default                         | Cookies no firmadas                                                                |
| `DEFAULT_QUERY_LIMIT` / `MAX_QUERY_LIMIT`           | 🟢 Default     | `utils/pagination/pagination.js:10,15`                                    | `20` / `100`                        | Usa defaults                                                                       |

**Nota**: `dotenv.js` (`apps/server/src/config/dotenv.js`) carga `.env.{NODE_ENV}` y luego `.env` como fallback. En CI/containers no hay `.env` — todo debe venir via env vars reales.

---

## ¿Qué necesitan los workflows de CI/CD?

### `preview.yml` (PR validation, efímero)

Levanta el contenedor del server para validar el Dockerfile + migraciones + smoke contra Floci (Secrets Manager emulado). **Necesita las 🔴 + las 🟡 que el smoke route toque** (`/_smoke/secrets` usa `secretsClient`, necesita `AWS_*`).

**Env vars que ya pasa** (`preview.yml`):

- `DATABASE_URL=postgresql://test:test@localhost:5432/project_one_preview`
- `AWS_ENDPOINT_URL=http://localhost:4566`
- `AWS_ACCESS_KEY_ID=test`, `AWS_SECRET_ACCESS_KEY=test`
- `AWS_REGION=us-east-1`
- `PORT=3000`
- `ENABLE_SMOKE_ROUTE=true`
- `AES_GCM_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=` (dummy 32 bytes cero)
- `ALGORITHM=aes-256-gcm`

**No pasa** (no las necesita para el smoke que corre): `SECRETKEY`, `REFRESHSECRETKEY`, `ORIGIN_CORS`, `FRONTEND_URL`, `CLOUD_*`, `SECRETCOOKIEKEY`, `BCRYPT_SALT` — el smoke nunca toca rutas que las lean en runtime.

### `deploy.yml` job `docker-build` (post-merge, validación emulada)

Idéntico a `preview.yml` pero con:

- `DATABASE_URL=postgresql://test:test@localhost:5432/project_one_cd` (DB distinta)
- Tags de imagen `project-one-server:${GITHUB_SHA}` + `:latest`
- `AES_GCM_KEY` dummy inline (mismo valor que `preview.yml`)
- `ALGORITHM=aes-256-gcm` inline

### `deploy.yml` jobs `deploy-staging` / `deploy-production` (ECS Fargate real)

Aquí **NO** se puede usar el dummy key: el server en staging/producción **sí** cifra y descifra datos reales (Payroll, Employees, User.email). El trato correcto:

| Env var                                      | Cómo se pasa al task definition                     | 渠道                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AES_GCM_KEY`                                | `secrets` (referencia a ARN de AWS Secrets Manager) | `STAGING_AES_GCM_KEY_SECRET_ARN` / `PROD_AES_GCM_KEY_SECRET_ARN` — el valor real está en Secrets Manager, accesible por la task execution role de ECS                                                                                                                                                                                                             |
| `ALGORITHM`                                  | `environment` (valor hardcoded `aes-256-gcm`)       | constante pública — no tiene sentido gastar un secret                                                                                                                                                                                                                                                                                                             |
| `DATABASE_URL`                               | `secrets` (ARN)                                     | `STAGING_DATABASE_URL_SECRET_ARN` / `PROD_DATABASE_URL_SECRET_ARN`                                                                                                                                                                                                                                                                                                |
| `SECRETKEY`                                  | `secrets` (ARN) — ⚠️ **NO `JWT_SECRET`**            | reusa `STAGING_JWT_SECRET_SECRET_ARN` / `PROD_JWT_SECRET_SECRET_ARN` (el valor del secret es la key; el nombre del env var es lo crítico). El código lee `SECRETKEY` (`src/utils/jwt/createToken.js:9,152`, `src/socket/auth.js:30`, `src/middleware/verifyToken.js:49`); `JWT_SECRET` NO existe en `apps/server/src/` — inyectarlo rompe todo el auth en runtime |
| `REFRESHSECRETKEY`                           | `secrets` (ARN) — ARN NUEVO                         | `STAGING_REFRESH_SECRETKEY_SECRET_ARN` / `PROD_REFRESH_SECRETKEY_SECRET_ARN`. El código lo lee en `createToken.js:33,173`                                                                                                                                                                                                                                         |
| `AWS_REGION`                                 | `secrets` (ARN) o `environment`                     | `STAGING_AWS_REGION_SECRET_ARN` / `PROD_AWS_REGION_SECRET_ARN`                                                                                                                                                                                                                                                                                                    |
| `NODE_ENV`, `PORT`                           | `environment` (`staging`/`production`, `3000`)      | constantes                                                                                                                                                                                                                                                                                                                                                        |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | **no se pasan**                                     | ECS usa task role IAM (OIDC, ver design `cd-aws-deploy-pipeline` D4)                                                                                                                                                                                                                                                                                              |

**Env vars runtime restantes a provisionar** (tasks 6.4/8.2 del change `cd-aws-deploy-pipeline` — paridad con los reads del código): `ORIGIN_CORS`, `ORIGIN_CORS_TEST`, `FRONTEND_URL`, `BCRYPT_SALT`, `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`, `SECRETCOOKIEKEY` — via Secrets Manager ARN (`STAGING_*` / `PROD_*`). Sin ellas el server arranca pero CORS, CSP, bcrypt y Cloudinary fallan en runtime.

---

## Decisión: ¿qué va en GitHub Secrets vs inline vs Secrets Manager?

| Contexto                                                                               | Clave real (prod)                                                            | Clave dummy (CI) | Constante pública                       |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------- | --------------------------------------- |
| **CI emulado** (`preview.yml`, `docker-build`)                                         | NO usar                                                                      | inline en YAML   | inline en YAML                          |
| **GitHub Environment secrets** (fase 2 simplificada, si no se usa AWS Secrets Manager) | GitHub environment secret (`staging.AES_GCM_KEY` / `production.AES_GCM_KEY`) | N/A              | N/A                                     |
| **AWS ECS Fargate** (fase 2 del CD, estándar)                                          | AWS Secrets Manager + ARN en GitHub secret (`*_AES_GCM_KEY_SECRET_ARN`)      | N/A              | `environment` inline en task definition |

**Principios**:

1. **Cero secretos reales en YAML** — `gitleaks` los detecta y bloquea el PR.
2. **GitHub Secrets son accesibles solo via `secrets.*` context** — no pueden usarse en `if:` de job (usar `vars.*` para gates, ej. `vars.AWS_ROLE_ARN`).
3. **Separar environments** — `staging.AES_GCM_KEY` ≠ `production.AES_GCM_KEY` (si una se filtra, la otra sigue segura).
4. **Dummy keys solo en CI** — nunca llegan a producción; el dummy key de CI (`AAAA…=`) **no desencripta datos reales** porque en preview/staging-CD no hay datos reales que descifrar (solo migraciones + smoke). **Guard de defensa (2026-08-10)**: `encription-prisma-middleware.js` lanza un error claro si detecta la dummy key con `NODE_ENV=production` — previene el copy-paste accidental a un entorno real.
5. **Constantes públicas** como `ALGORITHM=aes-256-gcm` o `NODE_ENV=production` van inline — gastar un secret es overhead sin beneficio de seguridad.

Referencias:

- Decisión original: design `cd-aws-deploy-pipeline` D8 ("Secrets de la app en staging/prod: GitHub env secrets primero, Secrets Manager en fase 2").
- Migración a Secrets Manager requiere wiring de código: task 7.4 (`src/config/aws/secrets.js` hoy es código muerto).

---

## Bug histórico referenciado

- **Symptom**: `preview.yml` fallaba en el step "Wait for server health" con `curl exit code 7` tras 60s de retries.
- **Root cause**: el workflow no pasaba `AES_GCM_KEY` ni `ALGORITHM` al `docker run`. Cambio archivado `ci-preview-environments` (2026-08-08) omitió estas env vars en sus artefactos; sus tasks 5.2/5.3 (verificación en CI real) estaban `[~]` deferred non-blocking, por eso no se detectó en `/opsx-verify`.
- **Fix aplicado** (2026-08-10): añadir dummy `AES_GCM_KEY` + `ALGORITHM=aes-256-gcm` inline en `preview.yml`, `deploy.yml:docker-build`, `apps/server/docker-compose.preview.yml`; editar specs de `cd-aws-deploy-pipeline` para documentar el Requirement en staging/production via Secrets Manager ARN.
- **Memoria**: obs #528 (bugfix, topic `bugfix/preview-workflow-aes-gcm-key`).

---

## Mantenimiento

Cualquier nueva env var que se lea **en módulos importados por `db.js` o `app.js`** (cadena top-level) es automáticamente una 🔴 Crítica. Cualquier throw top-level en un middleware importado por la cadena del bootstrap es una trampa latente — documentar aquí y proteger con tests.

**Recomendación de robustez (no aplicada aún)**: refactorizar `encription-prisma-middleware.js` para que el error sea más claro:

```js
// Sugerencia: mensaje orientado a "qué env var falta", no debug críptico
if (!dotenv('AES_GCM_KEY')) {
  throw new Error(
    'AES_GCM_KEY no está definida. Requerido por encription-prisma-middleware. ' +
      'CI/preview: añadir -e AES_GCM_KEY=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA= al docker run. ' +
      'Staging/prod: configurar el secret en AWS Secrets Manager. ' +
      'Ver docs/server-bootstrap-env-vars.md.'
  );
}
```
