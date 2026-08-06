## Context

- See `proposal.md` — Why: Stage 6 del plan `docs/cicd-plan-implementacion.md` (preview per PR). Decisión de scope (2026-07): Floci **NO** es un proveedor de hosting cloud — es un **emulador local de AWS** ("Any Cloud. Locally", MIT, puerto 4566). Se descarta el hosting cloud pagado para previews (Railway/Render/Fly.io); Floci se adopta como capa de aprendizaje y emulación de AWS en local y CI.
- El repo no tiene infraestructura de preview: sin staging ni hosting de la API; el client corre en Vite dev local; `apps/server/docker-compose.yml` es dev-local (db, pgAdmin, api, nginx, prometheus, grafana) y **NO se modifica** para preview.
- `apps/server/Dockerfile` ya existe (node:20-alpine, EXPOSE 3000, CMD `node src/bin/index.js`) — reutilizable para la imagen del server del stack emulado.
- `apps/server/src/config/aws/secret-manager.client.js` ya respeta `AWS_ENDPOINT_URL` (configura el `SecretsManagerClient` con ese endpoint cuando la variable está definida) — el código está listo para emulación **sin cambios de aplicación**.
- Floci (`floci/floci:v1.5.11`, MIT) emula 68 servicios AWS en el puerto 4566, storage en memoria, sin telemetría (~90 MB, startup ~24 ms). Sustituye a LocalStack Community, que exige auth token desde marzo 2026. Docs oficiales: floci.io.
- El client es Vite (`vite build` → `apps/client/dist`); Vercel no está conectado aún como GitHub App.
- La migración LocalStack→Floci en dev local es el change `ci-floci-migration` (separado) — aquí solo se incorpora Floci al stack de preview.

## Goals / Non-Goals

**Goals:**
- Cada PR contra `main` obtiene validación completa: preview del client (Vercel GitHub App nativa, URL automática por PR) + backend validado contra AWS emulado (Floci) con build + migraciones + smoke tests.
- Stack AWS emulado reproducible en local y CI desde un compose dedicado (`apps/server/docker-compose.preview.yml`): server + Floci + PostgreSQL efímera.
- Comentario único y actualizable en el PR con la URL del preview Vercel y el estado de la validación del backend emulado.
- Cero recursos cloud persistentes: validación efímera (muere con el runner) + Vercel auto-cleanup del preview al mergear/cerrar.
- Documentación de aprendizaje AWS con Floci (`docs/aws-learning-with-floci.md`).
- Solo `GITHUB_TOKEN` como secreto (sin secrets custom).

**Non-Goals:**
- NO desplegar a producción ni a staging; no tocar entornos existentes.
- NO hosting cloud pagado para el preview de la API (sin Railway/Render/Fly.io) — Floci emula, no hostea.
- NO migrar LocalStack→Floci en dev local (change `ci-floci-migration`).
- NO crear el pipeline CD post-merge (Stage 7) ni infraestructura AWS real.
- NO cambiar contratos de la API ni flujos de usuario de la app.
- NO añadir acciones custom de Vercel en el workflow (integración nativa GitHub App).

## Decisions

### D1: Stack de emulación definido en `apps/server/docker-compose.preview.yml` (nuevo), sin tocar el compose de dev local

**Decisión:** Crear `apps/server/docker-compose.preview.yml` con tres servicios:
- `floci`: imagen oficial `floci/floci:v1.5.11` (pin concreto, consistente con la política de pinning del repo — gitleaks v8.22.1, sbom-action v0.17.2), puerto `4566:4566`, `FLOCI_STORAGE_MODE=memory`, `FLOCI_HOSTNAME=floci`, healthcheck `["CMD", "floci", "health"]` — emula AWS en local/CI sin cuenta real.
- `db`: `postgres:16-alpine`, sin volumen persistente, healthcheck `pg_isready`, credenciales de test — PostgreSQL efímera por stack.
- `server`: build desde el `Dockerfile` existente, puerto `3000:3000`, `depends_on` db + floci healthy, env: `DATABASE_URL` apuntando al servicio `db`, `AWS_ENDPOINT_URL=http://floci:4566` (nombre de servicio del compose), credenciales dummy (`AWS_ACCESS_KEY_ID=test`, `AWS_SECRET_ACCESS_KEY=test`) y `AWS_REGION=us-east-1`.

**Alternativas (rechazadas):** Modificar `apps/server/docker-compose.yml` para añadir floci → rompe dev local y mezcla concerns; el plan ya prevé ese cambio como `ci-floci-migration`.
**Rationale:** Compose dedicado = stack reproducible idéntico en local y CI; el compose dev-local queda intacto; aislamiento total de entornos.
**Tradeoff:** Mantener dos compose files (dev-local y preview) — aceptable porque sus concerns son distintos (desarrollo diario vs emulación/validación).

### D2: PostgreSQL efímera por PR (postgres:16-alpine)

**Decisión:** Cada stack preview levanta su propia PostgreSQL efímera dentro del compose (`db`, sin volumen persistente) y ejecuta `npx prisma migrate deploy` al provisionar. La imagen `postgres:16-alpine` coincide con la convención de los tests de integración del change `ci-test-integration` (service container `postgres:16-alpine`).

**Alternativas (rechazadas):**
- `postgres:17` como el compose dev-local → diverge de la convención de tests de integración y de CI; sin ganancia funcional.
- DB compartida de staging → staging no existe (Stage 7); datos de un PR contaminarían otros previews; viola aislamiento.
- Apuntar a la DB local de dev → no accesible desde el entorno del preview/CI.

**Rationale:** Datos desechables por PR → sin fugas entre PRs; una sola versión de Postgres en todo el tooling de tests/preview.
**Tradeoff:** La minor version 16 difiere del dev-local (17) — no afecta: `prisma migrate deploy` replica el esquema y ninguna feature usada depende de la minor version.

### D3: Floci como capa de emulación AWS — NO hosting

**Decisión:** Floci (`floci/floci:v1.5.11`, puerto 4566) es el emulador AWS del stack de preview, para **aprendizaje y validación**. NO es un proveedor de hosting: la API validada contra Floci no se expone en una URL pública.

**Por qué Floci:**
- **Objetivo de aprendizaje del usuario**: aprender AWS antes de usar cloud real; Floci permite desarrollar contra servicios AWS 1:1 sin cuenta ni costo.
- **LocalStack Community sunset (marzo 2026)**: exige auth token y licencia restrictiva; Floci es MIT (forever free), 68 servicios vs ~26, imagen ~90 MB vs ~1 GB, startup ~24 ms vs ~3.3 s, sin telemetría.
- **Código listo**: la app usa `@aws-sdk/client-secrets-manager` y `secret-manager.client.js` ya honra `AWS_ENDPOINT_URL` — cero cambios de aplicación para emular.

**Servicios relevantes:** `secretsmanager` (usado por la app hoy — target del smoke test del preview) y el catálogo completo de los 68 servicios AWS que emula Floci (s3, dynamodb, sqs, sns, lambda, rds, etc.), documentado en `docs/aws-learning-with-floci.md` con sus diferencias frente a AWS real. Los smoke tests del workflow cubren `secretsmanager` (seed + get-secret-value); el resto se explora vía la guía de aprendizaje.

**Alternativas (rechazadas):** LocalStack Community → auth token desde mar 2026, 26 servicios, más lento y pesado; hosting cloud de la API para preview → costo + complejidad + contradice la decisión de scope.
**Rationale:** Emulación local/CI cubre validación + aprendizaje con cero costo y cero recursos cloud.
**Tradeoff:** Floci no es 100% idéntico a AWS real (limitaciones por servicio) — aceptable para preview; producción usará AWS real y la guía documenta el learning path.

### D4: Vercel GitHub App nativa para el preview del client (sin acción custom)

**Decisión:** Conectar Vercel como GitHub App en el dashboard: root directory `apps/client`, framework preset Vite. Vercel crea preview deployments automáticos por PR (URL única por branch) y los elimina al mergear/cerrar. **No se añade ninguna acción custom de Vercel ni archivo en el repo** — es configuración de dashboard, documentada en `docs/aws-learning-with-floci.md`.

**Alternativa (rechazada):** `amondnet/vercel-action` en el workflow → la delegación exige integración nativa sin acción custom; además la acción requiere `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` y falla en PRs de forks.
**Rationale:** Cero workflow code para el deploy del client; Vercel gestiona build, URL y cleanup nativamente; el workflow solo captura la URL para el comentario combinado (ver D7).
**Tradeoff:** Configuración manual en dashboard (una sola vez) + la URL de preview puede tardar en estar lista — mitigado en D5/D7 con poll acotado y publicación no bloqueante.

### D5: Workflow `preview.yml` — build + stack emulado + smoke tests + comentario combinado

**Decisión:** Crear `.github/workflows/preview.yml` con un **job único `preview`** (ubuntu-latest):

- **Trigger:** `pull_request` (opened, reopened, synchronize) contra `main`. NO corre en pushes directos a `main`. Se añade `workflow_dispatch` para pruebas manuales.
- **Pasos:**
  1. `actions/checkout@v5`
  2. `actions/setup-node@v4` (node-version-file `.nvmrc`, cache npm) + `npm ci` en la raíz del monorepo
  3. Service containers del job: `floci` (puerto 4566) y `db` (`postgres:16-alpine`, puerto 5432, healthcheck `pg_isready`)
  4. Build de la imagen del server: `docker build apps/server` (valida el Dockerfile que usa el compose local)
  5. `npx prisma migrate deploy` contra la PostgreSQL efímera del service container
  6. Arrancar el server desde la imagen construida (`--network=host`) con `AWS_ENDPOINT_URL=http://localhost:4566` + credenciales dummy + `AWS_REGION`; health check HTTP 200 en el endpoint de salud con reintentos
  7. **Smoke test contra AWS emulado**: script Node (`apps/server/scripts/preview-smoke.mjs`) que hace CreateSecret + GetSecretValue vía `@aws-sdk/client-secrets-manager` contra `AWS_ENDPOINT_URL`; un fallo marca la validación como fallida en el PR
  8. Capturar la URL del preview Vercel (ver D7) y publicar comentario único con marker `<!-- preview-environments -->` usando `peter-evans/find-comment` + `peter-evans/create-or-update-comment` (URL del client + estado de los smoke tests; actualización en cada `synchronize` sin duplicados)
- **Concurrencia:** grupo por PR con `cancel-in-progress: true` (ver D7).

**Alternativas (rechazadas):** Jobs separados por fase → un solo job comparte service containers y serializa build→migrate→smoke→comment de forma clara; correr el server como proceso node directo en vez de docker → docker valida además el Dockerfile que usa el compose local.
**Rationale:** Job único = service containers compartidos + secuencia determinista; los fallos son visibles como checks del PR; el smoke test ejercita el path real de la app (Secrets Manager emulado).
**Tradeoff:** Job serial (~5-8 min) y docker build en cada PR → mitigado con las capas del Dockerfile ya ordenadas (deps antes que código) y cache de capas de docker.

### D6: Cleanup — efímero por naturaleza + Vercel auto-delete

**Decisión:** No hay lógica de cleanup custom:
- El stack emulado vive solo durante el job: los service containers (Floci + PostgreSQL) mueren con el runner al terminar (éxito o fallo); no hay volúmenes persistentes ni recursos cloud que desprovisionar.
- Vercel elimina automáticamente el preview deployment del client al mergear/cerrar el PR (comportamiento nativo de la GitHub App).
- El ciclo de vida efímero se documenta en `docs/aws-learning-with-floci.md`.

**Alternativa (rechazada):** Scripts de teardown o llamadas a APIs de limpieza → no hay nada que limpiar; complejidad innecesaria.
**Rationale:** El diseño no crea recursos persistentes → el cleanup es gratis por construcción; GitHub limpia los service containers incluso si un job se cancela a mitad.
**Tradeoff:** Ninguno relevante.

### D7: Secrets y concurrencia — GITHUB_TOKEN only

**Decisión:**
- El workflow usa únicamente `GITHUB_TOKEN` (automático): para comentar en el PR y para leer el status del deployment de Vercel.
- **Captura de la URL de Vercel:** leer el commit status publicado por la Vercel GitHub App (`GET /repos/{owner}/{repo}/commits/{sha}/status` o check-runs) y extraer el `target_url` del status de Vercel — funciona solo con `GITHUB_TOKEN`, sin secrets custom. (El spec `ci-preview-client-vercel` usa este mismo mecanismo — alineado.)
- **Concurrencia:** `concurrency: { group: preview-${{ github.event.pull_request.number }}, cancel-in-progress: true }` — un nuevo commit cancela la ejecución en curso del mismo PR y arranca una nueva para el commit más reciente.

**Alternativa (rechazada como default):** Secrets `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` + Vercel REST API (`GET /v6/deployments`) → secrets extra, no funciona en PRs de forks, y contradice la directriz GITHUB_TOKEN-only.
**Rationale:** Menos secretos = menor superficie de fuga; los PRs de forks funcionan igual (GITHUB_TOKEN se inyecta automáticamente); menos dependencia de la API de Vercel.
**Tradeoff:** La URL de Vercel puede tardar en aparecer en el status → poll acotado con reintentos; si no está disponible al comentar, el comentario se publica igual con la validación backend y la URL si ya existe (no bloquea la validación).

## Risks / Trade-offs

- **[R1: URL de Vercel no disponible al comentar]** → Mitigation: poll acotado sobre el commit status de Vercel; el comentario se publica igual con la validación backend, añadiendo la URL cuando esté disponible.
- **[R2: Floci no cubre o desvía un servicio AWS necesario]** → Mitigation: smoke tests solo sobre `secretsmanager` (lo que la app usa hoy); catálogo de 68 servicios y diferencias documentadas en la guía; LocalStack (con auth token) como fallback de último recurso.
- **[R3: Docker build lento en cada PR]** → Mitigation: capas del Dockerfile ya ordenadas (deps antes que código) + cache de capas entre runs si se requiere.
- **[R4: Postgres 16 (preview/CI) vs 17 (dev-local)]** → Mitigation: `prisma migrate deploy` replica el esquema; ninguna feature depende de la minor version; 16-alpine alineado con los tests de integración.
- **[R5: PRs de forks con GITHUB_TOKEN]** → Mitigation: en PRs de forks, `GITHUB_TOKEN` es **read-only** — no puede escribir comentarios. Los steps de comentario se protegen con `if: github.event_name == 'pull_request' && github.event.pull_request.head.repo.fork == false` (+ `continue-on-error`); los PRs de forks obtienen validación vía checks, sin comentario combinado. Documentado en spec.
- **[R6: Ruido de comentario en cada synchronize]** → Mitigation: comentario único con marker estable + update-in-place + `cancel-in-progress`.
- **[R7: Smoke tests poco representativos]** → Mitigation: seed + get-secret-value cubren el path real de la app hoy; la guía de aprendizaje permite ampliar a más servicios progresivamente (p.ej. `@floci/testcontainers`).
- **[R8: Dockerfile actual no construye]** → Mitigation: `RUN npm ci --omit=dev` ejecuta el postinstall `prisma generate`, pero `prisma` CLI es devDependency (omitida) y `prisma/schema.prisma` no se copia hasta `COPY . .`. Fix en este change: reordenar el Dockerfile — copiar `prisma/` antes de `npm ci` (o mover `prisma generate` después de `COPY . .` con CLI disponible). Task 0.1.
- **[R9: Contexto de build contaminado (sin .dockerignore)]** → Mitigation: crear `apps/server/.dockerignore` (node_modules, .env, *.log, tests, dist). Sin él, el `npm ci` de la raíz + `docker build apps/server` incluiría el árbol completo de node_modules vía symlinks de workspaces. Task 0.2.
- **[R10: No existe endpoint /health]** → Mitigation: añadir ruta mínima `GET /health` (200) en `src/app.js` — cambio de app no rompiente (o usar `/metrics` existente como gate alternativo). Task 3.0.

## Migration Plan

1. Crear `apps/server/docker-compose.preview.yml` (servicios floci + db + server con `AWS_ENDPOINT_URL=http://floci:4566`).
2. Verificar el stack en local: `docker compose -f apps/server/docker-compose.preview.yml up` + health checks + `prisma migrate deploy` manual + smoke contra Secrets Manager emulado.
3. Crear el script de smoke test AWS (`apps/server/scripts/preview-smoke.mjs`) usando `@aws-sdk/client-secrets-manager`.
4. Crear `.github/workflows/preview.yml` (trigger PR, service containers, build, migrate, smoke, comentario combinado).
5. Conectar Vercel como GitHub App en el dashboard (root `apps/client`, preset Vite) — manual, documentado.
6. Crear `docs/aws-learning-with-floci.md` (stack local, servicios emulados, conexión `AWS_ENDPOINT_URL`, ruta de aprendizaje).
7. Verificar: actionlint sobre el workflow, ejecución manual vía `workflow_dispatch`, y PR de prueba real con comentario combinado.

## Open Questions

- ~~¿Capturar la URL de Vercel por commit status (GITHUB_TOKEN-only, D7) o vía Vercel REST API con `VERCEL_TOKEN` como menciona el spec `ci-preview-client-vercel`?~~ → **Resuelto**: commit status con `GITHUB_TOKEN` (D7). Zero secrets custom, funciona en PRs de forks. Spec `ci-preview-client-vercel` alineado.
- ~~¿Postgres 16 (convención tests de integración, D2) o 17 (proposal.md)?~~ → **Resuelto**: 16-alpine (D2). proposal.md alineado.
- ~~¿El smoke test debe ampliarse a más servicios AWS además de `secretsmanager` en este change, o dejarlo como follow-up (p.ej. `@floci/testcontainers` con Vitest)?~~ → **Resuelto**: solo `secretsmanager` (lo que la app usa hoy); ampliación como follow-up documentado en R7.
- ~~¿Pinear la imagen `floci/floci:latest` a una versión concreta (p.ej. v1.5.11 según `docs/cicd-plan-implementacion.md`) para reproducibilidad en CI?~~ → **Resuelto**: pin `v1.5.11`, consistente con la política de pinning del repo (gitleaks v8.22.1, sbom-action v0.17.2).
