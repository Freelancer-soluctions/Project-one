## Purpose

Define el contrato de contenido, estructura y estilo pedagógico de las 7 guías del nivel Avanzado de la ruta de aprendizaje de CI/CD, para que un desarrollador Junior que completó los niveles Fundamentos e Intermedio pueda aprender Continuous Deployment y el ecosistema AWS del proyecto (ECS Fargate, ECR, RDS, ALB, IAM OIDC, Secrets Manager) usando Floci como emulador local de cero costo y la implementación real del proyecto como caso de estudio.

## ADDED Requirements

### Requirement: Guías del nivel Avanzado

El nivel Avanzado SHALL contener exactamente 7 guías markdown en `docs/learning/ci-cd/`: `11-cd-conceptos-aws.md`, `12-floci-emulador-aws.md`, `13-deploy-yml-walkthrough.md`, `14-preview-environments-yml.md`, `15-oidc-sin-credenciales-estaticas.md`, `16-ecs-circuit-breaker-health-checks.md` y `17-changesets-release-yml.md`.

#### Scenario: Existen las 7 guías

- **WHEN** se inspecciona el directorio `docs/learning/ci-cd/`
- **THEN** existen los 7 archivos de guía con los nombres exactos especificados

#### Scenario: No hay guías fuera del nivel

- **WHEN** se listan los archivos del nivel Avanzado
- **THEN** no existen guías de niveles superiores (profesional) en este directorio

### Requirement: Estructura obligatoria de cada guía

Cada guía SHALL seguir la estructura: objetivos de aprendizaje, prerequisitos ("completado Fundamentos + Intermedio"), sección de teoría desde cero, sección de walkthrough de la implementación real en el proyecto, resumen y enlace a la siguiente guía.

#### Scenario: La guía abre con objetivos y prerequisitos

- **WHEN** se lee el inicio de cualquier guía del nivel
- **THEN** contiene una sección de objetivos de aprendizaje y una sección de prerequisitos antes del contenido teórico
- **AND** la sección de prerequisitos indica explícitamente que el lector debe haber completado los niveles Fundamentos (00-04) e Intermedio (05-10)

#### Scenario: La guía conecta teoría con implementación real

- **WHEN** se recorre el cuerpo de la guía
- **THEN** contiene una sección de teoría desde cero y una sección que hace walkthrough de la implementación real en el proyecto con snippets de código que citan la ruta fuente

#### Scenario: La guía cierra con resumen y navegación

- **WHEN** se lee el final de cualquier guía
- **THEN** contiene un resumen de lo aprendido y un enlace a la siguiente guía del nivel (o al README si es la última)

### Requirement: Contenido didáctico de 11-cd-conceptos-aws

La guía `11-cd-conceptos-aws.md` SHALL explicar CI vs CD, las estrategias de despliegue (blue-green, canary) y el inventario de servicios AWS que usa el proyecto (ECS Fargate, ECR, RDS PostgreSQL, IAM OIDC, ALB con sticky sessions para Socket.IO, VPC, Secrets Manager), asumiendo que el lector nunca usó AWS, e incluyendo el diagrama mermaid de componentes de `docs/aws-deploy-architecture.md`.

#### Scenario: Explica CI vs CD y estrategias de despliegue desde cero

- **WHEN** un lector que completó Fundamentos e Intermedio pero nunca usó AWS lee la guía
- **THEN** distingue integración continua de entrega/despliegue continuo y entiende blue-green y canary mediante definiciones, analogías y una tabla comparativa

#### Scenario: Presenta el inventario de servicios AWS del proyecto

- **WHEN** la guía presenta los servicios AWS
- **THEN** enumera ECS Fargate, ECR, RDS PostgreSQL, IAM OIDC, ALB, VPC y Secrets Manager con el propósito de cada uno en el proyecto

#### Scenario: Incluye el diagrama de arquitectura

- **WHEN** la guía muestra la arquitectura AWS del proyecto
- **THEN** reproduce una versión SIMPLIFICADA del diagrama mermaid de `docs/aws-deploy-architecture.md` (~20-30 líneas, cite el path) — no las ~48 líneas completas; el mermaid simplificado se considera material didáctico esencial y se exceptúa de la regla <40 líneas

#### Scenario: Introduce conceptos AWS fundamentales

- **WHEN** la guía introduce AWS
- **THEN** explica la navegación por consola AWS, el concepto de ARN, la región us-east-1 y la distinción entre servicios regionales (ECS, ECR, RDS) y globales (IAM)

### Requirement: Contenido didáctico de 12-floci-emulador-aws

La guía `12-floci-emulador-aws.md` SHALL explicar qué es Floci (MIT, 68 servicios, puerto 4566, imagen ~90MB, arranque ~24ms), compararlo con LocalStack, justificar su uso (cero costo cloud para aprendizaje/CI), presentar el stack `docker-compose.preview.yml`, dar comandos hands-on y explicar el patrón del script `preview-smoke.mjs`, siguiendo la secuencia pedagógica Floci → Consola → Terraform de `docs/aws-cd-learning-path.md`.

#### Scenario: Explica Floci desde cero

- **WHEN** un lector que nunca usó un emulador AWS lee la guía
- **THEN** entiende qué es Floci, sus características (licencia MIT, 68 servicios, puerto 4566, ~90MB, ~24ms) y su rol como emulador local de AWS

#### Scenario: Compara Floci con LocalStack

- **WHEN** la guía presenta alternativas
- **THEN** incluye una tabla comparativa Floci vs LocalStack (licencia, tamaño de imagen, servicios, costo)

#### Scenario: Muestra el stack docker-compose.preview.yml

- **WHEN** la guía presenta el stack de emulación
- **THEN** desglosa `apps/server/docker-compose.preview.yml` (servicios floci, db, server) citando la ruta fuente

#### Scenario: Da comandos hands-on

- **WHEN** la guía presenta la práctica
- **THEN** incluye comandos reales: `docker compose up -d floci`, healthcheck, y las env vars con credenciales dummy (`AWS_ACCESS_KEY_ID=test`, `AWS_ENDPOINT_URL=http://localhost:4566`)

#### Scenario: Explica el patrón preview-smoke.mjs

- **WHEN** la guía presenta las pruebas contra Floci
- **THEN** explica el patrón del script `apps/server/scripts/preview-smoke.mjs` (CreateSecret + GetSecretValue contra Secrets Manager emulado)

#### Scenario: Presenta la secuencia pedagógica

- **WHEN** la guía presenta la ruta de aprendizaje AWS
- **THEN** explica la secuencia Floci → Consola AWS → Terraform referenciando `docs/aws-cd-learning-path.md`

#### Scenario: Aclara que Floci NO es un proveedor de hosting

- **WHEN** la guía presenta Floci **THEN** explica explícitamente (con cita literal o paráfrasis cercana) que Floci NO es un proveedor de hosting — es un emulador para dev/CI; producción usa AWS real — enlazando la advertencia de docs/aws-dev-local-floci.md:21 y docs/aws-learning-with-floci.md:21

### Requirement: Contenido didáctico de 13-deploy-yml-walkthrough

La guía `13-deploy-yml-walkthrough.md` SHALL hacer un walkthrough profundo de `.github/workflows/deploy.yml`: Fase 1 (docker-build con Floci + Postgres efímera + smoke tests) y Fase 2 (ecr-push, deploy-staging, deploy-production con aprobación manual), incluyendo el gating con `vars.AWS_ROLE_ARN != ''`, los jobs skipped con `::notice::`, el inventario de secrets y los concurrency groups.

#### Scenario: Desglosa la Fase 1

- **WHEN** la guía recorre el job `docker-build`
- **THEN** explica el build de la imagen, los services containers (Floci + Postgres efímera), el health check y los smoke tests contra el stack emulado, con snippets citando `.github/workflows/deploy.yml`

#### Scenario: Desglosa la Fase 2

- **WHEN** la guía recorre los jobs `ecr-push`, `deploy-staging` y `deploy-production`
- **THEN** explica el push a ECR vía OIDC, el registro de task definition, el deploy a ECS con circuit breaker y la aprobación manual del environment production

#### Scenario: Explica el gating y los jobs skipped

- **WHEN** la guía explica el gating de Fase 2
- **THEN** explica que los jobs de Fase 2 se ejecutan solo si `vars.AWS_ROLE_ARN != ''` y que los jobs `*-skipped` emiten `::notice::` annotations visibles en la UI de Actions para el learning path de Fase 1

#### Scenario: Presenta el inventario de secrets

- **WHEN** la guía presenta los secrets
- **THEN** enumera `vars.AWS_ROLE_ARN`, `vars.AWS_ACCOUNT_ID`, `secrets.STAGING_*` y `secrets.PROD_*` con su uso, referenciando `docs/workflows-mantenimiento-guia.md` sección 14

#### Scenario: Explica el gotcha JWT_SECRET vs SECRETKEY

- **WHEN** la guía trata los secrets de JWT
- **THEN** explica que el ARN legacy se llama `*_JWT_SECRET_SECRET_ARN` pero el env var inyectado es `SECRETKEY` (no `JWT_SECRET`), citando `docs/aws-deploy-architecture.md` y `docs/workflows-mantenimiento-guia.md`

#### Scenario: Explica los concurrency groups

- **WHEN** la guía trata la concurrencia
- **THEN** explica los grupos `deploy-staging` y `deploy-production` con `cancel-in-progress: false` y por qué no se cancelan deploys en curso

### Requirement: Contenido didáctico de 14-preview-environments-yml

La guía `14-preview-environments-yml.md` SHALL hacer un walkthrough de `.github/workflows/preview.yml`: triggers (pull_request opened/reopened/synchronize + workflow_dispatch), services (Floci + Postgres efímera), build de imagen Docker del server, Prisma migrate, arranque del contenedor, health check, smoke tests contra Floci, captura de URL de preview Vercel vía commit status API y comentario en PR con marker `<!-- preview-environments -->`, incluyendo la concurrency `preview-${{ github.event.pull_request.number }}` con cancel-in-progress:true.

#### Scenario: Explica los triggers

- **WHEN** la guía trata los disparadores de preview.yml
- **THEN** explica `pull_request` (opened, reopened, synchronize) sobre main y `workflow_dispatch`

#### Scenario: Desglosa el flujo de validación backend

- **WHEN** la guía recorre los steps del job preview
- **THEN** explica el build de la imagen, Prisma migrate, el arranque del contenedor con env vars dummy, el health check (200 o 503) y los smoke tests contra Floci

#### Scenario: Explica la captura de URL de Vercel

- **WHEN** la guía trata la integración con Vercel
- **THEN** explica la captura de la URL de preview vía commit status API (`gh api repos/.../commits/${SHA}/status`) con polling

#### Scenario: Explica el comentario en PR

- **WHEN** la guía trata la publicación del resultado
- **THEN** explica el comentario combinado (URL Vercel + estado backend) con marker `<!-- preview-environments -->` y `edit-mode: replace` para actualizar en vez de duplicar

#### Scenario: Explica la concurrency

- **WHEN** la guía trata la concurrencia de preview.yml
- **THEN** explica el grupo `preview-${{ github.event.pull_request.number }}` (o `preview-manual`) con `cancel-in-progress: true` y por qué se cancela la preview anterior del mismo PR

### Requirement: Contenido didáctico de 15-oidc-sin-credenciales-estaticas

La guia `15-oidc-sin-credenciales-estaticas.md` SHALL explicar OpenID Connect a fondo: por que OIDC en lugar de access keys de larga duracion, el flujo completo (GitHub firma un JWT → la trust policy IAM verifica → STS assume-role-with-web-identity → credenciales temporales), el modelo preciso de la trust policy (condicion StringLike `sub=repo:owner/repo:*` + `aud=sts.amazonaws.com`), el filtro de environment viviendo en GitHub Environments (no en la trust policy), y la politica de minimo privilegio.

#### Scenario: Explica por que OIDC en lugar de access keys

- **WHEN** un lector que conoce secrets pero no OIDC lee la guia
- **THEN** entiende los problemas de las access keys de larga duracion (rotacion dolorosa, blast radius amplio, auditoria dificil) y como OIDC los resuelve

#### Scenario: Explica el flujo OIDC GitHub→AWS

- **WHEN** la guia explica el mecanismo de autenticacion
- **THEN** describe el flujo completo: GitHub firma un JWT, la trust policy del rol IAM verifica el token, STS asume el rol via assume-role-with-web-identity, y se entregan credenciales temporales

#### Scenario: Muestra el modelo preciso de la trust policy

- **WHEN** la guia explica la trust policy OIDC
- **THEN** ensena el modelo preciso:
  - (a) La trust policy IAM contiene una condicion StringLike con `sub=repo:owner/repo:*` (paths all branches/envs) + StringEquals `aud=sts.amazonaws.com`
  - (b) El "filtro de environment" (staging/production) NO esta dentro de la trust policy; vive en GitHub Environments (protection rules + secrets/vars con scope de entorno)
  - Mostrar el HCL de `docs/aws-deploy-architecture.md` (github-oidc.tf) como referencia
  - _Nota didactica:_ `docs/cicd-estado-actual.md:1340` dice `:ref:refs/heads/main` (mas restrictivo), pero el HCL real usa `repo:*` — mencionar como leccion de "siempre verificar trust policies contra la infra real, no contra doc secundaria"

#### Scenario: Explica el minimo privilegio

- **WHEN** la guia presenta la politica del rol
- **THEN** explica la politica de minimo privilegio (ECR push/pull, ECS update/describe solo en clusters del proyecto) con la seccion de IAM OIDC de `docs/aws-deploy-architecture.md`

#### Scenario: Distingue IAM user vs IAM role

- **WHEN** la guia introduce IAM **THEN** explica la diferencia entre IAM user (credenciales estaticas de larga duracion, rotation manual) e IAM role (credenciales temporales asumidas via STS assume-role / assume-role-with-web-identity, expiran en 1-12h) Y por que OIDC elimina la necesidad de users para CI (GitHub firma JWT → AWS IAM trust policy verifica → STS emite creds temporales scoped al role)

#### Scenario: Advierte sobre la limitacion STS de Floci

- **WHEN** la guia practica assume-role-with-web-identity contra Floci **THEN** menciona que Floci STS puede no validar completamente el token OIDC — el test valida la estructura de la trust policy, no la verificacion completa de firma JWT (referencia: docs/aws-cd-learning-path.md M4)

### Requirement: Contenido didactico de 16-ecs-circuit-breaker-health-checks

La guia `16-ecs-circuit-breaker-health-checks.md` SHALL explicar la mecanica de despliegue ECS: registro de task definition pineada por Git SHA, `aws ecs update-service --force-new-deployment`, `deploymentCircuitBreaker={enable:true,rollback:true}` con rollback automatico si fallan los health checks, la config de health check (interval 30s, timeout 5s, retries 3, startPeriod 60s, path /health) y los smoke tests remotos post-deploy (staging 5 min, prod 5 min — 30 retries × 10s ambas), mostrando por que este patron es "production-grade" vs un deploy naive.

#### Scenario: Explica el registro de task definition pineada por SHA

- **WHEN** la guia explica el despliegue ECS
- **THEN** explica el registro de task definition con imagen taggeada por Git SHA y por que el pinning por SHA garantiza reproducibilidad

#### Scenario: Explica el force-new-deployment y el circuit breaker

- **WHEN** la guia explica el mecanismo de despliegue
- **THEN** explica `aws ecs update-service --force-new-deployment` y `deploymentCircuitBreaker={enable:true,rollback:true}` con rollback automatico si los health checks fallan

#### Scenario: Detalla la configuracion de health check

- **WHEN** la guia presenta el health check del contenedor
- **THEN** detalla la configuracion (interval 30s, timeout 5s, retries 3, startPeriod 60s, path /health) y el significado de cada parametro

#### Scenario: Explica los smoke tests post-deploy

- **WHEN** la guia presenta la validacion post-deploy
- **THEN** explica los smoke tests remotos (staging 5 min, prod 5 min — 30 retries × 10s ambas) y que la diferencia de rigor NO es un health window mas largo en prod, sino (a) la aprobacion manual via GitHub Environments (protection rule de production) y (b) el concurrency group separado deploy-production (cancel-in-progress: false)

#### Scenario: Contrasta con un deploy naive

- **WHEN** la guia compara patrones de despliegue
- **THEN** muestra por que este patron es "production-grade" frente a un deploy naive (sin health checks ni rollback automatico)

### Requirement: Contenido didactico de 17-changesets-release-yml

La guia `17-changesets-release-yml.md` SHALL hacer un walkthrough de `.github/workflows/release.yml`: push a main → detectar changesets pendientes → abrir PR "chore: version packages" (titulo real, no "Version Packages") → merge → publicar a npm + crear tags git, explicando el `fetch-depth: 0` requerido, la estructura del directorio `.changeset/` y referenciando la spec existente `openspec/specs/release-workflow/spec.md`.

#### Scenario: Explica el flujo de release

- **WHEN** la guia recorre release.yml
- **THEN** explica el flujo: push a main, deteccion de changesets pendientes, apertura de PR "chore: version packages" (titulo real), y al mergear la publicacion a npm y creacion de tags git

#### Scenario: Detalla el PR title real y la concurrency

- **WHEN** la guia detalla release.yml **THEN** cita el PR title real `chore: version packages` y menciona el concurrency group `release` con `cancel-in-progress: false`

#### Scenario: Explica el fetch-depth: 0

- **WHEN** la guia explica el checkout del repositorio
- **THEN** explica por que `fetch-depth: 0` (historial completo) es requerido porque changesets necesita los diffs de commits

#### Scenario: Explica la estructura .changeset/

- **WHEN** la guia presenta el directorio de changesets
- **THEN** explica la estructura de `.changeset/` (archivos de changeset, config.json, README) y como se crean los changesets

#### Scenario: Referencia la spec existente

- **WHEN** la guia menciona el workflow de release
- **THEN** referencia `openspec/specs/release-workflow/spec.md` como spec existente

### Requirement: Estilo didactico y formato

Las guias SHALL usar espanol, estructura teoria primero → implementacion del proyecto, conceptos AWS introducidos desde cero (asumiendo que el lector nunca uso la consola AWS), tablas markdown para comparaciones, diagramas mermaid para flujos y arquitectura, bloques de codigo con snippets reales citando la ruta fuente, y una extension de 800-1500 lineas por archivo.

#### Scenario: Las guias estan en espanol

- **WHEN** se lee cualquier guia del nivel
- **THEN** el contenido esta escrito en espanol siguiendo la convencion del proyecto

#### Scenario: Estructura teoria primero luego implementacion

- **WHEN** se recorre el cuerpo de cualquier guia
- **THEN** primero presenta la teoria desde cero y luego conecta con la implementacion real del proyecto con snippets citando la ruta fuente

#### Scenario: Conceptos AWS desde cero

- **WHEN** una guia introduce un servicio AWS
- **THEN** explica el concepto desde cero asumiendo que el lector nunca uso AWS, incluyendo navegacion por consola, ARN, region us-east-1 y la distincion entre servicios regionales (ECS, ECR, RDS) y globales (IAM)

#### Scenario: Usan tablas y diagramas

- **WHEN** la guia presenta comparaciones o flujos
- **THEN** usa tablas markdown para comparaciones y diagramas mermaid para flujos y arquitectura

#### Scenario: Los snippets citan su fuente

- **WHEN** la guia incluye un snippet de codigo del proyecto
- **THEN** el bloque de codigo indica la ruta del archivo fuente (p. ej. `.github/workflows/deploy.yml`)

#### Scenario: Extension dentro del rango

- **WHEN** se mide la extension de cada guia
- **THEN** cada archivo tiene entre 800 y 1500 lineas

### Requirement: Sin duplicacion de documentacion existente

Las guias SHALL referenciar con enlaces la documentacion existente (`docs/aws-deploy-architecture.md`, `docs/aws-cd-learning-path.md`, `docs/aws-dev-local-floci.md`, `docs/aws-learning-with-floci.md`, `docs/cicd-estado-actual.md` seccion 10, `docs/workflows-mantenimiento-guia.md` seccion 14) en lugar de copiar su contenido.

#### Scenario: Se enlaza en lugar de copiar

- **WHEN** una guia necesita contenido que ya existe en docs/aws-\*.md u otros docs de referencia
- **THEN** enlaza al documento existente en lugar de duplicar el contenido

#### Scenario: Los enlaces cruzados funcionan

- **WHEN** se validan los enlaces entre guias del nivel y hacia docs/
- **THEN** todas las rutas relativas apuntan a archivos existentes
