## 1. Setup del nivel Avanzado

- [x] 1.1 Crear `docs/learning/ci-cd/avanzado-README.md` con: indice del nivel (7 guias 11-17 con descripcion breve y orden de lectura), prerequisitos ("completado Fundamentos + Intermedio"), objetivos de aprendizaje del nivel, navegacion (enlace de vuelta a Intermedio y referencia al futuro nivel Profesional), y cross-links a los docs AWS de referencia
- [x] 1.2 Verificar que `avanzado-README.md` es archivo separado (no fusiona `README.md` de Fundamentos ni `intermedio-README.md`)

## 2. Guia: Conceptos CD y AWS

- [x] 2.1 Escribir `docs/learning/ci-cd/11-cd-conceptos-aws.md` con objetivos de aprendizaje y prerequisitos
- [x] 2.2 Explicar CI vs CD desde cero con analogias y tabla comparativa (continua de Fundamentos)
- [x] 2.3 Explicar estrategias de despliegue: blue-green y canary con diagrama mermaid
- [x] 2.4 Introducir conceptos AWS fundamentales: cuenta, region (us-east-1), ARN, navegacion por consola, servicios regionales (ECS, ECR, RDS) vs globales (IAM)
- [x] 2.5 Presentar el inventario de servicios AWS del proyecto: ECS Fargate, ECR, RDS PostgreSQL, IAM OIDC, ALB (sticky sessions para Socket.IO), VPC, Secrets Manager — con tabla
- [x] 2.6 Reproducir una versión SIMPLIFICADA del diagrama mermaid de `docs/aws-deploy-architecture.md` (~20-30 líneas, cite el path) — no las ~48 líneas completas; exceptuado de la regla anti-duplicación <40 líneas como material didáctico esencial
- [x] 2.7 Cerrar con resumen y enlace a `12-floci-emulador-aws.md`

## 3. Guia: Floci emulador de AWS

- [x] 3.1 Escribir `docs/learning/ci-cd/12-floci-emulador-aws.md` con objetivos de aprendizaje y prerequisitos
- [x] 3.2 Explicar que es Floci desde cero (MIT, 68 servicios, puerto 4566, imagen ~90MB, arranque ~24ms) con enlaces a `docs/aws-dev-local-floci.md` y `docs/aws-learning-with-floci.md`
- [x] 3.3 Tabla comparativa Floci vs LocalStack (licencia, tamano de imagen, servicios, costo)
- [x] 3.4 Desglosar `apps/server/docker-compose.preview.yml` (servicios floci, db, server) citando la ruta fuente
- [x] 3.5 Comandos hands-on: `docker compose up -d floci`, healthcheck, env vars dummy (AWS_ACCESS_KEY_ID=test, AWS_ENDPOINT_URL=http://localhost:4566)
- [x] 3.6 Explicar el patron del script `apps/server/scripts/preview-smoke.mjs` (CreateSecret + GetSecretValue contra Secrets Manager emulado)
- [x] 3.7 Explicar la secuencia pedagogica Floci → Consola AWS → Terraform referenciando `docs/aws-cd-learning-path.md`
- [x] 3.8 Cerrar con resumen y enlace a `13-deploy-yml-walkthrough.md`
- [x] 3.9 Explicar literalmente que Floci NO es un proveedor de hosting — es emulador dev/CI; producción usa AWS real — enlazando docs/aws-dev-local-floci.md:21 y docs/aws-learning-with-floci.md:21

## 4. Guia: Walkthrough de deploy.yml

- [x] 4.1 Escribir `docs/learning/ci-cd/13-deploy-yml-walkthrough.md` con objetivos de aprendizaje y prerequisitos
- [x] 4.2 Desglosar Fase 1 (job docker-build): build de imagen, services Floci + Postgres efimera, health check, smoke tests contra stack emulado — con snippets citando `.github/workflows/deploy.yml`
- [x] 4.3 Desglosar Fase 2: ecr-push (OIDC + ECR login + push taggeado por SHA), deploy-staging, deploy-production (aprobacion manual via environment)
- [x] 4.4 Explicar el gating `vars.AWS_ROLE_ARN != ''` y los jobs `*-skipped` con `::notice::` annotations visibles en la UI (learning path de Fase 1)
- [x] 4.5 Inventario de secrets: vars.AWS*ROLE_ARN, vars.AWS_ACCOUNT_ID, secrets.STAGING*\_, secrets.PROD\_\_ — referenciando `docs/workflows-mantenimiento-guia.md` seccion 14
- [x] 4.6 Explicar el gotcha del ARN legacy `JWT_SECRET` vs env var `SECRETKEY` (el codigo lee SECRETKEY/REFRESHSECRETKEY, NO JWT_SECRET)
- [x] 4.7 Explicar concurrency groups (deploy-staging, deploy-production, cancel-in-progress: false)
- [x] 4.8 Cerrar con resumen y enlace a `14-preview-environments-yml.md`

## 5. Guia: Walkthrough de preview.yml

- [x] 5.1 Escribir `docs/learning/ci-cd/14-preview-environments-yml.md` con objetivos de aprendizaje y prerequisitos
- [x] 5.2 Explicar triggers: pull_request (opened, reopened, synchronize) sobre main + workflow_dispatch
- [x] 5.3 Desglosar services (Floci + Postgres efimera) y el build de la imagen Docker del server
- [x] 5.4 Desglosar Prisma migrate, arranque del contenedor (env vars dummy), health check (200 o 503) y smoke tests contra Floci — con snippets citando `.github/workflows/preview.yml`
- [x] 5.5 Explicar la captura de URL de preview Vercel via commit status API (gh api) con polling
- [x] 5.6 Explicar el comentario en PR con marker `<!-- preview-environments -->` y `edit-mode: replace`
- [x] 5.7 Explicar concurrency `preview-${{ github.event.pull_request.number }}` con cancel-in-progress: true
- [x] 5.8 Cerrar con resumen y enlace a `15-oidc-sin-credenciales-estaticas.md`

## 6. Guia: OIDC sin credenciales estaticas

- [x] 6.1 Escribir `docs/learning/ci-cd/15-oidc-sin-credenciales-estaticas.md` con objetivos de aprendizaje y prerequisitos
- [x] 6.2 Explicar por que OIDC en lugar de access keys de larga duracion (rotacion dolorosa, blast radius, auditoria dificil)
- [x] 6.3 Explicar el flujo completo: GitHub firma un JWT → trust policy IAM verifica → STS assume-role-with-web-identity → credenciales temporales — con diagrama mermaid
- [x] 6.4 Cubrir el modelo OIDC preciso: trust policy StringLike `repo:owner/repo:*` + aud=sts.amazonaws.com + filter de environment en GitHub Environments (no en trust policy); mencionar la inconsistencia `:ref:refs/heads/main` (cicd-estado-actual.md:1340) vs `repo:*` (HCL real) como lección de verificación
- [x] 6.5 Explicar la politica de minimo privilegio (ECR push/pull, ECS update/describe solo en clusters del proyecto)
- [x] 6.6 Cerrar con resumen y enlace a `16-ecs-circuit-breaker-health-checks.md`
- [x] 6.7 Explicar IAM role vs IAM user — credenciales temporales (STS assume-role) vs estáticas; por qué OIDC elimina users para CI

## 7. Guia: ECS circuit breaker y health checks

- [x] 7.1 Escribir `docs/learning/ci-cd/16-ecs-circuit-breaker-health-checks.md` con objetivos de aprendizaje y prerequisitos
- [x] 7.2 Explicar el registro de task definition pineada por Git SHA y por que el pinning por SHA da reproducibilidad
- [x] 7.3 Explicar `aws ecs update-service --force-new-deployment` y `deploymentCircuitBreaker={enable:true,rollback:true}` con rollback automatico — con snippet citando `.github/workflows/deploy.yml`
- [x] 7.4 Detallar la config de health check (interval 30s, timeout 5s, retries 3, startPeriod 60s, path /health) y el significado de cada parametro
- [x] 7.5 Explicar los smoke tests post-deploy (staging 5 min, prod 5 min — 30 retries × 10s ambas) y la diferencia de rigor entre entornos: NO es un health window mas largo en prod, sino (a) la aprobacion manual via GitHub Environments (protection rule de production) y (b) el concurrency group separado deploy-production (cancel-in-progress: false)
- [x] 7.6 Contrastar el patron "production-grade" del proyecto vs un deploy naive (sin health checks ni rollback)
- [x] 7.7 Cerrar con resumen y enlace a `17-changesets-release-yml.md`

## 8. Guia: Changesets y release.yml

- [x] 8.1 Escribir `docs/learning/ci-cd/17-changesets-release-yml.md` con objetivos de aprendizaje y prerequisitos
- [x] 8.2 Explicar el flujo de release: push a main → detectar changesets pendientes → abrir PR "chore: version packages" → merge → publicar a npm + crear tags git — con snippet citando `.github/workflows/release.yml`
- [x] 8.3 Explicar por que `fetch-depth: 0` es requerido (changesets necesita los diffs de commits)
- [x] 8.4 Explicar la estructura de `.changeset/` (archivos de changeset, config.json, README)
- [x] 8.5 Referenciar la spec existente `openspec/specs/release-workflow/spec.md`
- [x] 8.6 Cerrar con resumen y enlace de vuelta al README Avanzado (ultima guia del nivel)

## 9. Verificacion de cross-references

- [x] 9.1 Verificar que las guias 11-17 enlazan correctamente entre si (anterior/siguiente/README)
- [x] 9.2 Verificar los enlaces de vuelta a las guias de Intermedio (05-10) y a los docs AWS existentes (`docs/aws-*.md`, `docs/cicd-estado-actual.md` seccion 10, `docs/workflows-mantenimiento-guia.md` seccion 14)
- [x] 9.3 Verificar que los enlaces relativos a `docs/`, `.github/workflows/` y `apps/server/` apuntan a archivos existentes
- [x] 9.4 Verificar que los snippets citados existen en las rutas indicadas (deploy.yml, preview.yml, release.yml, docker-compose.preview.yml, preview-smoke.mjs)
- [x] 9.5 Verificar que los datos citados (tiempos de health check, títulos de PR workflow, nombres de secrets/vars, regiones) coinciden con los archivos fuente reales (deploy.yml, preview.yml, release.yml, docs/aws-deploy-architecture.md, docs/cicd-estado-actual.md §11.2)

## 10. Verificacion de anti-duplicacion

- [x] 10.1 Verificar que ninguna guia copia secciones enteras (>40 lineas) de `docs/aws-*.md` ni de las secciones 10/14 de los docs de referencia — deben enlazar en su lugar
- [x] 10.2 Verificar que los snippets cortos (<40 lineas) citan la ruta fuente
- [x] 10.3 Verificar que el contenido didactico (explicaciones AWS desde cero, analogias) es original de las guias y no duplica la documentacion tecnica existente

## 11. Control de calidad markdown

- [x] 11.1 Verificar que las 7 guias (11-17) tienen entre 800 y 1500 lineas cada una; el avanzado-README.md es un indice mas breve (200-800 lineas permitido)
- [x] 11.2 Verificar que todas las guias tienen secciones de objetivos de aprendizaje y prerequisitos al inicio
- [x] 11.3 Ejecutar lint de markdown disponible en el repo (o verificacion manual: tablas validas, mermaid sin errores, espanol)
- [x] 11.4 Verificar que el README enlaza a Intermedio (nivel previo) y referencia a Profesional (nivel siguiente)
- [x] 11.5 Verificacion final: las 7 guias + README cumplen los requisitos de `specs/cicd-advanced-guide/spec.md` y `specs/cicd-avanzado-readme-index/spec.md`
