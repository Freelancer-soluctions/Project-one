# Implementation Tasks: CD AWS Deploy Pipeline

> Cada grupo de tasks mapea a requisitos de los specs (`cd-docker-ecr`, `cd-staging-deploy`, `cd-production-deploy`, `cd-rollback`, `cd-aws-learning-path`) y a las decisiones del design (D1-D10). Fase 1 = sin cuenta AWS; Fase 2 = desbloqueada por hitos del learning path con Floci.
>
> **DEPENDENCIA DE ORDEN DE MERGE (HARD)**: tasks 0.1-0.3 requieren el Dockerfile fix + `.dockerignore` + `GET /health` de `ci-preview-environments` (tasks 0.1-0.2 y 3.0 de ese change). `ci-preview-environments` DEBE mergearse ANTES que este change — NO aplicar el fix aquí (evita ediciones duplicadas/conflictivas en `apps/server/Dockerfile` y `src/app.js`); verificar solo.

## 0. Prerrequisitos y coordinación con siblings

- [x] 0.1 Verificar Dockerfile fix + `.dockerignore` del change sibling `ci-preview-environments` (tasks 0.1-0.2): `npm ci --omit=dev` no debe romper el postinstall `prisma generate` (copiar `prisma/` antes del `npm ci` o mover `prisma generate` tras `COPY . .` con el CLI disponible). **SIN fallback**: si el sibling NO está mergeado, BLOQUEAR este change (dependencia dura declarada) — no re-aplicar el fix
- [x] 0.2 Verificar `docker build apps/server` end-to-end y que la imagen bootea `node src/bin/index.js` con el Prisma client generado — es el gate de entrada de todo el CD
- [x] 0.3 Verificar que existe `GET /health` (task 3.0 de `ci-preview-environments`); si NO existe, BLOQUEAR (dependencia dura) — no añadir la ruta aquí para evitar duplicación con el sibling
- [x] 0.4 Confirmar que las actions GitHub quedan pinneadas por tag y el patrón `GITHUB_TOKEN`-only donde no se requiera AWS (consistencia con los siblings)
- [x] 0.5 **(REMEDIACIÓN 2026-08-10)** Documentar y aplicar las env vars de bootstrap del server exigidas por `apps/server/src/middleware/encription-prisma-middleware.js` (líneas 4-17: lee `ALGORITHM` y lanza `throw` en import si `AES_GCM_KEY` falta o no tiene 32 bytes — el proceso aborta antes de `httpServer.listen(3000)`). Sin estas env vars, todo workflow que arranque el contenedor del server falla con curl exit code 7 (conexión rechazada). Lugar donde aplica: (a) `preview.yml` step "Start server container" — **dummy key inline** (preview nunca desencripta datos reales; ver docs/server-bootstrap-env-vars.md); (b) `deploy.yml` job `docker-build` step "Start server container" — **dummy key inline** (validación emulada); (c) `deploy.yml` jobs `deploy-staging`/`deploy-production` — **`AES_GCM_KEY` via Secrets Manager ARN** (`STAGING_AES_GCM_KEY_SECRET_ARN` / `PROD_AES_GCM_KEY_SECRET_ARN`), `ALGORITHM=aes-256-gcm` como `environment` (constante pública). Referencia operativa: `docs/server-bootstrap-env-vars.md`. Verificar que ningún cambio SDD/archivo duplica esta corrección — `ci-preview-environments` archivado (2026-08-08) omitió estas env vars en sus artefactos; este change las remedia.

## 1. Fase 1 — Job docker-build (build + validación sin AWS)

- [x] 1.1 Crear `.github/workflows/deploy.yml` (NUEVO): trigger `push: branches: [main]` + `workflow_dispatch` (para verificación manual sin merge — task 4.2); **concurrencia dividida por entorno** (D10): `group: deploy-staging, cancel-in-progress: false` para docker-build/ecr-push/deploy-staging y `group: deploy-production, cancel-in-progress: false` para deploy-production (un solo grupo bloquearía deploys de staging detrás de un approval de producción pendiente)
- [x] 1.2 Job `docker-build` (ubuntu-latest, `permissions: contents: read`): checkout@v5 + `docker build apps/server` etiquetando `project-one-server:${GITHUB_SHA}` y `project-one-server:latest` (D7 — tag inmutable por SHA)
- [x] 1.3 Service containers del job: `floci` (`floci/floci:1.5.31` pinneado, healthcheck `["CMD-SHELL", "curl -f http://localhost:4566/_localstack/health"]`, puerto 4566, `FLOCI_HOSTNAME=floci`) + `db` (postgres:16-alpine, healthcheck `pg_isready`, credenciales `test`/`test`/`project_one_cd`) — patrón del workflow preview del sibling
- [x] 1.4 Boot de la imagen contra el stack emulado: `prisma migrate deploy` (`DATABASE_URL=postgresql://test:test@localhost:5432/project_one_cd`), arrancar el contenedor con `AWS_ENDPOINT_URL=http://localhost:4566` + credenciales dummy + `AWS_REGION=us-east-1` + **`AES_GCM_KEY` (dummy base64 de 32 bytes cero, `AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=`) + `ALGORITHM=aes-256-gcm` inline** (task 0.5 — sin estas env vars el middleware de encripción aborta el proceso Node en el bootstrap del módulo, antes de `httpServer.listen(3000)` → curl devuelve exit code 7), health check `/health` aceptando 200 (ok) o 503 (degraded DB) con retries (paridad con `preview.yml`)
- [x] 1.5 Correr `npm run test:smoke` (working-directory: apps/server) contra el stack emulado; confirmar que ningún request sale a AWS real (todo vía `AWS_ENDPOINT_URL` — requisito de validación sin cuenta AWS)
- [~] 1.6 Verificar que el job corre verde en un push a main de prueba sin credenciales AWS configuradas

## 2. Fase 1 — deploy.yml scaffold: jobs cloud gated (ECR + staging + producción)

- [x] 2.1 Job `ecr-push` (`needs: docker-build`) gated con `if: ${{ vars.AWS_ROLE_ARN != '' }}` (D6 — `vars`, NO `secrets`: GitHub Actions no permite secrets en `if` de job): `permissions: id-token: write, contents: read` (requerido por OIDC role-to-assume), `aws-actions/configure-aws-credentials@v4` (`role-to-assume: ${{ vars.AWS_ROLE_ARN }}`, `aws-region: us-east-1`) + `aws-actions/amazon-ecr-login@v2` + push del tag SHA y `latest` al repo ECR `project-one-server` — política IAM del role debe incluir además `ecr:BatchCheckLayerAvailability`, `ecr:BatchGetImage`, `ecr:GetDownloadUrlForLayer` (set completo de push/pull)
- [x] 2.2 Job `deploy-staging` (`needs: ecr-push`, `environment: staging`) con el mismo gate (`vars.AWS_ROLE_ARN`) y `permissions: id-token: write, contents: read` (D4 — mismo patrón OIDC que 2.1): (1) `aws ecs register-task-definition` con la nueva imagen ECR tag SHA (nueva revisión — sin esto, `force-new-deployment` redeploya la imagen ANTERIOR pinneada por SHA: no-op silencioso), (2) `aws ecs update-service --cluster project-one-staging --service api --force-new-deployment` con `--deployment-configuration "deploymentCircuitBreaker={enable=true,rollback=true}"` (D5 — circuit breaker en AMBOS entornos)
- [x] 2.3 Smoke post-deploy en staging: (a) curl con retries a `${{ secrets.STAGING_URL }}/health` esperando 200 (la URL se resuelve vía env secret, NO hardcoded) — gate de promoción a producción; (b) **AÑADIR modo remote smoke con `BASE_URL` parametrizado a la suite** (cambio de código en la suite de smoke: leer `BASE_URL` de env; si está seteada → HTTP real contra el servicio desplegado; si no → in-process) y ejecutarlo contra staging (spec `cd-staging-deploy` exige correr la suite smoke post-deploy). **NOTA**: `npm run test:smoke` sin `BASE_URL` es in-process (supertest + prisma local) y valida el runner, no el servicio desplegado — NO usar como smoke post-deploy
- [x] 2.4 Job `deploy-production` (`needs: deploy-staging`, `environment: production`, approval manual vía protection rules) con el mismo gate (`vars.AWS_ROLE_ARN`) y `permissions: id-token: write, contents: read` (D4): (1) `register-task-definition` con imagen SHA, (2) update-service con `--deployment-configuration "deploymentCircuitBreaker={enable=true,rollback=true}"` (rollback automático — spec `cd-production-deploy`)
- [x] 2.5 Health check post-deploy en producción: poll de `${{ secrets.PROD_URL }}/health` 200 durante ventana de observación (hasta 5 min); el job falla si no responde (spec `cd-production-deploy`)
- [~] 2.6 Confirmar que los jobs cloud reportan _skipped_ con razón visible cuando falta infra (`AWS_ROLE_ARN` variable no configurada) — la fase 1 corre siempre verde (spec `cd-aws-learning-path`)

## 3. Fase 1 — Docs AWS (arquitectura + learning path)

- [x] 3.1 Crear `docs/aws-deploy-architecture.md` (NUEVO): inventario de componentes (ECS Fargate, ALB con stickiness para Socket.IO e idle timeout ≥ 65s, RDS PostgreSQL, ECR, IAM OIDC, VPC/security groups), relaciones y layout de red
- [x] 3.2 Incluir en `docs/aws-deploy-architecture.md` un Terraform reference (state en S3) que cubra los componentes como punto de partida para el provisionamiento real (D9)
- [x] 3.3 Crear `docs/aws-cd-learning-path.md` (NUEVO): hitos por servicio (ECR → ECS → RDS → OIDC), cada uno con práctica emulada en Floci + checkpoint task verificable; referencia cruzada a `docs/aws-learning-with-floci.md` y `docs/aws-dev-local-floci.md` de los siblings
- [x] 3.4 Documentar en el learning path: secuencia pedagógica consola-guiada → Terraform (D9), costo esperado de fase 2 y mitigación (RDS mínima, apagado fuera de horario), y que todo el aprendizaje es ejecutable sin cuenta AWS (cero costo cloud)

## 4. Fase 1 — Validación

- [x] 4.1 Validar el YAML con actionlint (o `npx actionlint`) en `.github/workflows/deploy.yml`
- [~] 4.2 Verificar el flujo fase 1 (workflow*dispatch o push de prueba a main): `docker-build` verde y jobs cloud \_skipped* con razón visible
- [x] 4.3 Revisión de seguridad: ningún access key de larga vida en secrets; `AWS_ROLE_ARN` se guarda como **repository variable** (no secret — D6); `GITHUB_TOKEN` con permisos mínimos en los jobs
- [ ] 4.4 Run `openspec validate "cd-aws-deploy-pipeline"` — todos los artifacts pasan

## 5. Fase 2 — Hito ECR (desbloqueo tras learning)

- [ ] 5.1 Completar la práctica Floci de ECR (registro emulado, push/pull con `AWS_ENDPOINT_URL`) y marcar el checkpoint en `docs/aws-cd-learning-path.md`
- [ ] 5.2 Crear el repo ECR `project-one-server` (bootstrap con `ecr:CreateRepository` o consola guiada) + **ECR lifecycle policy** (keep last N tags / 30 días) — el rollback requiere tags previos disponibles y el repo no puede crecer sin límite
- [ ] 5.3 Configurar OIDC GitHub→AWS: IAM Identity Provider (`token.actions.githubusercontent.com`, audience `sts.amazonaws.com`) + IAM role con política de mínimo privilegio (D4: ECR push al repo del proyecto + `ecs:UpdateService/DescribeServices` sobre los clústeres) + **restricción del subject claim del trust policy a `repo:<owner>/<repo>` (+ environment filter)** — evita que otros repos/workflows asuman el role
- [ ] 5.4 Añadir la variable `AWS_ROLE_ARN` al repositorio (repository **variable**, no secret — D6: secrets no funcionan en `if` de job; el ARN no es confidencial) — el job `ecr-push` se activa solo sin tocar YAML
- [ ] 5.5 Verificar push real: merge a main → `docker-build` verde + `ecr-push` sube el tag SHA a ECR

## 6. Fase 2 — Hito ECS (staging)

- [ ] 6.1 Completar la práctica Floci de ECS (task definitions, servicios, deployments) y marcar el checkpoint
- [ ] 6.2 Provisionar VPC + ALB (con stickiness e idle timeout ≥ 65s para Socket.IO) + security groups (consola guiada — D9)
- [ ] 6.3 Crear clúster ECS `project-one-staging` + task definition (imagen ECR tag SHA, puerto 3000, env del environment `staging`) + servicio `api` con deployment circuit breaker habilitado
- [ ] 6.4 Configurar el environment `staging` en GitHub (secrets: `DATABASE_URL` staging, JWT y demás — D8: env secrets primero) — **INCLUYE** `STAGING_AES_GCM_KEY_SECRET_ARN` (ARN del secret en AWS Secrets Manager que contiene la `AES_GCM_KEY` real de staging — 32 bytes base64) — task 0.5 remediación: sin esta env var, el task de ECS arranca el contenedor que aborta en el bootstrap del módulo de encripción antes de escuchar en el puerto 3000, y el health check post-deploy falla — **ADEMÁS**: provisionar el inventario completo de env vars runtime via Secrets Manager ARN (paridad con los reads del código): `SECRETKEY` (reusa el ARN existente `STAGING_JWT_SECRET_SECRET_ARN`), `REFRESHSECRETKEY` (`STAGING_REFRESH_SECRETKEY_SECRET_ARN` — ARN NUEVO), `ORIGIN_CORS`, `ORIGIN_CORS_TEST`, `FRONTEND_URL`, `BCRYPT_SALT`, `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`, `SECRETCOOKIEKEY`. **Verificar que los nombres de env var del task definition COINCIDEN con los reads del código (SECRETKEY/REFRESHSECRETKEY — NO JWT_SECRET)**: el código lee `SECRETKEY` (`src/utils/jwt/createToken.js`, `src/socket/auth.js`) y `REFRESHSECRETKEY` (`createToken.js:33,173`); `JWT_SECRET` NO existe en `apps/server/src/` (grep 0 resultados) — inyectarlo rompería todo el auth en runtime con 'Token secret key is not defined.'
- [ ] 6.5 Deploy real a staging: job `deploy-staging` activo → smoke tests post-deploy verdes (health 200 + `test:smoke` remoto con `BASE_URL` — nunca el modo in-process)

## 7. Fase 2 — Hito RDS (staging/prod DB)

- [ ] 7.1 Completar la práctica de PostgreSQL como RDS emulado (Postgres local/Floci como sustituto de aprendizaje) y marcar el checkpoint
- [ ] 7.2 Provisionar RDS PostgreSQL (instancia mínima t3.micro/Serverless v2, backups/PITR, security group restringido a los tasks/ALB — D3)
- [ ] 7.3 Migrar staging a RDS: `DATABASE_URL` real (env secret del environment `staging`), `prisma migrate deploy` como paso del deploy, verificar smoke. **Definir el punto de ejecución del migrate y el path de red**: (a) desde el runner de GitHub → el security group de RDS debe permitir egress de las IPs del runner (inestable), o (b) preferiblemente ECS one-off task (`aws ecs run-task` con la misma task definition) o SSM Session Manager contra el contenedor — la red runner→RDS sin whitelist fija NO funciona; documentar la opción elegida y secuenciarla respecto al update-service
- [ ] 7.4 Integrar AWS Secrets Manager vía task execution role: **requiere wiring real de código** — `loadSecrets()` en `src/config/aws/secrets.js` es código muerto hoy (nadie lo importa en `src/`); añadir el import + llamada en bootstrap/config loading (p.ej. en `src/bin/index.js` o config de arranque) para que la app consuma el secret del task role. NO es solo IAM — es un cambio de código (practicado con Floci vía `AWS_ENDPOINT_URL`)

## 8. Fase 2 — Hito producción

- [ ] 8.1 Completar la práctica Floci de OIDC/IAM y marcar el checkpoint
- [ ] 8.2 Provisionar clúster ECS `project-one-prod` + RDS prod + environment `production` en GitHub con protection rules (reviewers obligatorios — env gate) — **INCLUYE** `PROD_AES_GCM_KEY_SECRET_ARN` en los secrets del environment (paridad con staging 6.4) — al ser la clave de producción, el secret en AWS Secrets Manager debe ser una key real y robusta (32 bytes aleatorios, nunca el dummy de CI), restringida por IAM a la task execution role de producción (D8: Secrets Manager en fase 2) — **ADEMÁS** (paridad con 6.4): inventario completo de env vars runtime via `PROD_*` ARNs: `SECRETKEY` (reusa `PROD_JWT_SECRET_SECRET_ARN`), `REFRESHSECRETKEY` (`PROD_REFRESH_SECRETKEY_SECRET_ARN` — ARN NUEVO), `ORIGIN_CORS`, `ORIGIN_CORS_TEST`, `FRONTEND_URL`, `BCRYPT_SALT`, `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`, `SECRETCOOKIEKEY`. **Verificar que los nombres de env var del task definition COINCIDEN con los reads del código (SECRETKEY/REFRESHSECRETKEY — NO JWT_SECRET)** — mismo criterio que 6.4
- [ ] 8.3 Configurar dominios/TLS (certificado ACM + DNS) para staging y producción (open question resuelta en este punto)
- [ ] 8.4 Activar `deploy-production`: promoción con approval manual → deploy + health check de 5 min verdes (spec `cd-production-deploy`)

## 9. Fase 2 — Verificación de rollback

- [ ] 9.1 Simular un deploy fallido en staging/prod (imagen rota o health check que falla) → el circuit breaker revierte automáticamente a la task definition anterior (spec `cd-rollback`)
- [ ] 9.2 Verificar el redeploy manual del tag anterior desde ECR (rollback de app en < 15 min): (1) `register-task-definition` con el tag SHA anterior, (2) `update-service --force-new-deployment` — documentado en `docs/aws-deploy-architecture.md`
- [ ] 9.3 Probar `prisma migrate down` en staging (migración reversible) y documentar el procedimiento de rollback de BD
- [ ] 9.4 Run `openspec validate "cd-aws-deploy-pipeline" --strict` final y archivar el change

## 10. Fase 2 — Seguimiento: cambio hermano de observabilidad (Sentry)

- [ ] 10.1 Tras Phase 2 deploy funcional (staging + producción verdes): aplicar el change hermano `cd-observability-sentry` (Sentry error tracking + deploy markers) — añade el step `getsentry/action-release@v1` + milestone comment al final de los jobs `deploy-staging`/`deploy-production` de este workflow y las env vars `SENTRY_DSN`/`SENTRY_RELEASE` a los task definitions (patrón D8); NO duplicar aquí — ese change declara la dependencia/complemento (SA) y es quien edita `deploy.yml`
