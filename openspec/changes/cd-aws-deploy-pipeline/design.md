## Context

Ver `proposal.md` → *Why* para la motivación (Stage 7 del plan `docs/cicd-plan-implementacion.md`: CD inexistente, brecha C3).

Estado que condiciona el diseño:
- **No existe infraestructura AWS** en el repo (sin Terraform/CloudFormation) ni cuenta AWS activa en el proyecto. El usuario está **aprendiendo AWS** y decidió usar Floci como emulador antes de tocar cloud real.
- `apps/server/Dockerfile` (node:20-alpine) **no builda con `npm ci --omit=dev`**: el postinstall `prisma generate` requiere el CLI de Prisma. Fix coordinado con `ci-preview-environments` tasks 0.1-0.2 (misma corrección para BUILD y CD — dependencia, no duplicación).
- El server: Express + Socket.IO en un único HTTP server (puerto 3000), Prisma + PostgreSQL, `@aws-sdk/client-secrets-manager` que respeta `AWS_ENDPOINT_URL`. Health endpoint `GET /health` lo introduce `ci-preview-environments` task 3.0 — el CD depende de que exista.
- `release.yml` (Changesets) ya corre en push a `main`; el CD debe convivir sin duplicar versionado.
- Siblings (`ci-security-enhance`, `ci-secret-scanning`, `ci-preview-environments`, `ci-floci-migration`): acciones pinneadas por tag, `GITHUB_TOKEN`-only salvo donde AWS sea imprescindible.

## Goals / Non-Goals

**Goals:**
- Pipeline CD real **diseñado completo** (build → ECR → staging → producción → rollback) que el usuario pueda implementar **por fases mientras aprende AWS**, con cada fase desbloqueada por un hito de aprendizaje con Floci
- Fase 1 (implementable YA, sin cuenta AWS): build + validación de imagen contra stack emulado (Floci + Postgres efímera), workflow `deploy.yml` con environments/gates que **skippea limpio** los jobs cloud sin infra, documentación de arquitectura + Terraform reference + learning path
- Fase 2 (post-learning): ECR push, ECS Fargate, RDS, OIDC — tareas que requieren el conocimiento AWS adquirido
- Autenticación AWS por **OIDC** (sin access keys de larga vida)
- Rollback de app y BD en < 15 min

**Non-Goals:**
- No provisionar infraestructura AWS real en este change (es fase 2, gated por learning)
- No implementar blue/green con CodeDeploy en la primera versión (circuit breaker de ECS cubre el rollback automático; blue/green es stretch goal)
- No cubrir el deploy del client React (Vercel, fuera de este change)
- No modificar el comportamiento del server ni sus contratos de API
- No crear infraestructura de red para el stack emulado (efímera, muere con el runner)

## Decisions

### D1. Fases de implementación: "Scaffold ahora, activar al completar learning" (DECISIÓN CENTRAL)

**Decisión**: implementación **por dos fases**. La fase 1 (sin cuenta AWS) se implementa en este change; la fase 2 (cloud real) queda como tareas explícitas en `tasks.md` que el usuario activa al completar hitos del learning path con Floci.

| Fase | Requiere | Qué implementa | Desbloqueo |
|---|---|---|---|
| **1 (YA)** | Nada de AWS | Dockerfile fix + `.dockerignore`, job `docker-build` (build + boot validation vs Floci+Postgres), `deploy.yml` con jobs cloud gated, environments, docs (arquitectura + Terraform reference + learning path) | Merge del change |
| **2 (post-learning)** | Cuenta AWS + hitos Floci | ECR push, ECS Fargate, RDS, OIDC, activación de deploy staging/prod, verificación de rollback | Hitos del learning path (docs/aws-cd-learning-path.md) + infra presente |

**Por qué**: respeta la decisión del usuario ("aprender AWS antes de usarlo") sin cancelar el CD: el pipeline queda diseñado y la parte no-cloud verificable, y las tareas cloud son en sí mismas el vehículo de aprendizaje. Evita dos extremos malos: implementar cloud real a ciegas (riesgo/costo sin conocimiento) o solo documentar sin código (cero progreso, pipeline ficticio).

**Alternativas consideradas**:
- *Implementación inmediata completa*: descartada — contradice la decisión explícita del usuario y asume cuenta/credenciales AWS inexistentes.
- *Solo documentación (referencia) hasta terminar learning*: descartada — la fase 1 aporta valor real (build verificable, workflow validado, docs) sin AWS.

### D2. Compute para staging/producción: ECS Fargate

**Decisión**: **ECS Fargate** (clúster `project-one-staging` / `project-one-prod`, servicio `api`), consistente con el plan (sección 9) y con `deploymentCircuitBreaker` nativo para rollback automático.

**Por qué**: contenedores sin gestionar EC2 (el usuario aprende orquestación sin el overhead de parchear VMs); desplegar = (1) `ecs register-task-definition` con la imagen del SHA (nueva revisión) y (2) `ecs update-service --force-new-deployment` (D5 — sin la revisión nueva el deploy es un no-op silencioso); el circuit breaker revierte rollouts no saludables automáticamente (requisito de `cd-production-deploy` y `cd-rollback`).

**Alternativas**: *EC2 + PM2* (control total pero ops pesada, contradice serverless-first del plan) · *EKS* (sobredimensionado para un solo servicio) · *App Runner* (más simple pero menos learning value de orquestación y sin circuit breaker ECS).

### D3. PostgreSQL en producción: RDS PostgreSQL (learning + managed)

**Decisión**: **Amazon RDS PostgreSQL**, instancia mínima al inicio (p. ej. `db.t3.micro`/Serverless v2) para controlar costo. Fase 2c, después de los hitos ECR/ECS.

**Por qué**: el plan ya lo decidió (sección 9) y es el mayor *learning value* AWS del stack (backups/PITR/security groups/secret rotation), integración nativa con Prisma (`DATABASE_URL`). El costo se mitiga con instancia mínima y apagado en horarios de no uso (documentado).

**Alternativas**: *Postgres external (Neon/Supabase)* — más barato y zero-ops, pero rompe el learning path AWS y añade un segundo proveedor · *Postgres en el mismo Fargate* — anti-patrón (estado efímero, sin backups managed).

### D4. Autenticación AWS: OIDC (role-to-assume), sin access keys

**Decisión**: `aws-actions/configure-aws-credentials@v4` con `role-to-assume: ${{ vars.AWS_ROLE_ARN }}` (ARN guardado como **repository variable**, NO secret — D6: el ARN no es confidencial y `secrets` no es accesible en `if` de job), `aws-region: us-east-1`, y los jobs OIDC requieren `permissions: id-token: write, contents: read` (task 2.1). IAM role federado con GitHub OIDC (provider `token.actions.githubusercontent.com`), política de **mínimo privilegio**: `ecr:GetAuthorizationToken`, `ecr:InitiateLayerUpload/PutImage/CompleteLayerUpload`, `ecr:BatchCheckLayerAvailability`, `ecr:BatchGetImage`, `ecr:GetDownloadUrlForLayer` (set completo de push/pull al repo `project-one-server`), `ecs:UpdateService/DescribeServices` (solo clústeres del proyecto), `ecr:CreateRepository` (bootstrap).

**Por qué**: credenciales efímeras de 1h, sin secrets de larga vida que rotar, estándar GitHub→AWS. Consistente con el principio de los siblings (mínimo secreto).

**Alternativas**: *access keys en secrets* — rechazado (rotación manual, riesgo de fuga, no es learning value) · *GitHub App con credenciales propias* — innecesario con OIDC.

### D5. Mecanismo de deploy: rolling con circuit breaker en AMBOS entornos (blue/green como stretch goal)

**Decisión**: para staging y producción: (1) `aws ecs register-task-definition` con la nueva imagen (tag SHA) y (2) `aws ecs update-service --cluster <env> --service api --force-new-deployment` con `--deployment-configuration "deploymentCircuitBreaker={enable=true,rollback=true}"` — **el circuit breaker se habilita en AMBOS entornos** (paridad D5: un solo mecanismo). El rollback automático revierte si los health checks del target group fallan. **NOTA**: `force-new-deployment` solo redeploya la task definition PINNEADA por SHA — sin un nuevo `register-task-definition`, un deploy nuevo despliega la imagen ANTERIOR (no-op silencioso).

**Por qué**: un solo mecanismo para ambos entornos (paridad), rollback automático nativo, cero infraestructura extra. Blue/green con CodeDeploy añade ALB swap controlado pero más piezas — queda como stretch goal si el usuario quiere profundizar (open question, no cambia tasks).

**Alternativas**: *blue/green CodeDeploy desde el día 1* — más complejo, retrasa la primera entrega · *rolling manual* (actualizar task definition a mano) — propenso a error.

### D6. Gating de fases cloud en el workflow: `if` a nivel de job con `vars` (no secrets)

**Decisión**: jobs de fase 2 (`ecr-push`, `deploy-staging`, `deploy-production`) gated con `if: ${{ vars.AWS_ROLE_ARN != '' }}` a nivel de job. **IMPORTANTE**: GitHub Actions NO permite usar el contexto `secrets` en `if` conditionals a nivel de job (el contexto `secrets` no está disponible en `jobs.<job_id>.if`; evaluaría vacío y el job se skippearía SIEMPRE). El ARN del role NO es confidencial → se guarda como **repository variable** (`vars.AWS_ROLE_ARN`), que SÍ es accesible en `if` de job. Los secretos reales (DATABASE_URL, JWT, etc.) van en `secrets` del environment, que se pasan vía `env:`/`environment:` a los steps.

**Por qué**: la fase 1 corre verde sin AWS (cada job cloud reporta *skipped* con razón visible — requisito `cd-aws-learning-path`), y al configurar OIDC + ECR (variable `AWS_ROLE_ARN` seteada) el mismo workflow se activa sin tocar YAML.

**Riesgo controlado**: el ARN es público por naturaleza (identifica al role, no es credencial); el secreto real es el token OIDC efímero que emite GitHub y asume AWS. Nada de secrets en `if`.

### D7. Registry y tagging: ECR privado `project-one-server`, tag = SHA (+ semver opcional)

**Decisión**: repo ECR privado `project-one-server`. Tag inmutable: `github.sha` completo (trazabilidad exacta) + `latest`. Si `release.yml` publica un tag semver, el CD añade ese tag a la imagen como etiqueta adicional (decoupled: el CD no espera npm publish).

**Por qué**: el tag por SHA es el contrato de inmutabilidad (`cd-docker-ecr`); el rollback redeploya el tag anterior sin reconstruir. El semver es solo metadato de conveniencia.

### D8. Secrets de la app en staging/prod: GitHub env secrets primero, Secrets Manager en fase 2

**Decisión**: fase 1-2a: variables de entorno desde los secrets del GitHub Environment (`staging`/`production`) pasadas como `environment` del task. Fase 2c: integrar **AWS Secrets Manager** vía task execution role (IAM) + **wiring de código**: `loadSecrets()` (`src/config/aws/secrets.js`) es código muerto hoy (ningún archivo de `src/` la importa) — hay que añadir el import/llamada en bootstrap (p.ej. `src/bin/index.js`) para que la app consuma el secret del task role. La práctica se hace con Floci vía `AWS_ENDPOINT_URL` (la app ya respeta esa var).

**Por qué**: arranca sin infraestructura adicional; la migración a Secrets Manager es incremental y aprovecha el SDK existente (pero requiere el cambio de código indicado — no es solo IAM). Evita mezclar dos fuentes de secretos desde el día 1.

### D9. Infraestructura como código: consola guiada primero (learning), Terraform reference después

**Decisión**: la fase 2 provisiona **primero por consola AWS guiada** (el usuario aprende los servicios tocándolos) y **codifica después en Terraform** (reference en `docs/aws-deploy-architecture.md`, state en S3). Terraform es el IaC del plan (glosario sección 2), no CloudFormation.

**Por qué**: para un aprendiz, consola → comprensión → IaC es la secuencia pedagógica correcta; Terraform reference documentada permite reproducir y revisar (requisito `cd-aws-learning-path`). CloudFormation descartado: vendor-lock y menos ecosistema de examples que Terraform.

### D10. Concurrencia y coexistencia con release.yml

**Decisión**: `deploy.yml` con **concurrencia dividida por entorno** mediante claves `concurrency:` A NIVEL DE JOB (GitHub Actions permite solo UNA clave `concurrency` a nivel de workflow — job-level es obligatorio para dividir): `concurrency: group: deploy-staging, cancel-in-progress: false` en los jobs `docker-build`/`ecr-push`/`deploy-staging` y `concurrency: group: deploy-production, cancel-in-progress: false` en `deploy-production` (deploys no solapados por entorno; NO cancelar el anterior en curso). Un único grupo global bloquearía deploys automáticos de staging detrás de un approval de producción pendiente (viola el spec `cd-staging-deploy`). Independiente de `release.yml`: el CD se dispara en el mismo push a `main` pero no depende de la publicación npm; lee el tag git semver si existe (D7).

**Por qué**: evitar dos deploys concurrentes al mismo entorno (carrera ECS) sin acoplar los entornos entre sí. El CD no bloquea a Changesets.

## Risks / Trade-offs

- **[Costo AWS durante fase 2 (Fargate + RDS)] → Mitigación**: instancia RDS mínima (t3.micro/Serverless v2), Fargate con 1 task por entorno, apagado documentado fuera de horario; el usuario decide el presupuesto en el hito de RDS.
- **[Deploy a producción depende de aprobación humana → puede quedar desatendido]** → Mitigación: GitHub Environment protection rules con reviewers; timeout de aprobación documentado (re-deploy manual del tag si expira).
- **[`prisma migrate deploy` en el deploy → migración no reversible rompe rollback de BD]** → Mitigación: regla de reversibilidad por migración (`migrate down`), plan de datos obligatorio para migraciones irreversibles (requisito `cd-rollback`); el health check post-deploy detecta fallos antes de cortar tráfico.
- **[Gating por `vars.AWS_ROLE_ARN != ''` → si el ARN cambia (repo move) → jobs cloud se desactivan silenciosamente]** → Mitigación: `vars` es accesible en `if` de job (a diferencia de `secrets`); el ARN se documenta en el learning path; un run con jobs skipped muestra la razón visible (spec `cd-aws-learning-path`).
- **[Fase 1 sin AWS puede dar falsa sensación de "deploy hecho"] → Mitigación**: los jobs cloud skippeados reportan razón explícita y el learning path lista los pendientes; el status del workflow muestra *skipped* (no *success*) para los jobs cloud.
- **[Socket.IO detrás de ALB → sticky sessions/keep-alive]** → Mitigación: ALB target group con `stickiness` (cookie de duración) y `idle timeout` ≥ 65s (el server ya configura `keepAliveTimeout` 60s+); documentado en la arquitectura.
- **[Dockerfile fix compartido entre changes → riesgo de duplicación/conflicto]** → Mitigación: dependencia explícita de `ci-preview-environments` tasks 0.1-0.2; si ese change archiva primero, este verifica el estado sin re-aplicar.

## Migration Plan

**Fase 1 (este change, sin AWS):**
1. Coordinar/verificar Dockerfile fix + `.dockerignore` (tasks 0.1-0.2 de `ci-preview-environments`)
2. Implementar job `docker-build` (build + boot validation vs Floci + Postgres efímera) — verde sin AWS
3. Crear `deploy.yml` con jobs cloud gated (skippean limpio) + `concurrency`
4. Documentar: `docs/aws-deploy-architecture.md` + `docs/aws-cd-learning-path.md`
5. Validar `openspec validate --strict`

**Fase 2 (activación por hitos de learning):**
6. Hito ECR (Floci practice) → crear repo ECR + OIDC role + `AWS_ROLE_ARN` repository variable → job `ecr-push` se activa solo
7. Hito ECS (Floci practice) → provisionar ECS Fargate staging (consola guiada) + environment `staging` secrets → `deploy-staging` activo
8. Hito RDS (Floci practice) → provisionar RDS + `DATABASE_URL` de staging → smoke tests reales
9. Hito producción → environment `production` con reviewers + ALB + dominios → `deploy-production` activo
10. Verificar rollback: simular deploy fallido → circuit breaker revierte; `prisma migrate down` documentado

**Rollback (aplica desde fase 1 para build, fase 2 para deploy):**
- Build rojo → nada se despliega (gate natural)
- Deploy staging fallido → job rojo, sin promoción
- Deploy producción no saludable → circuit breaker revierte automáticamente a la task definition anterior; manual: redeploy del tag anterior desde ECR + `prisma migrate down` si aplica

## Open Questions

- **Blue/green con CodeDeploy**: ¿adoptarlo más adelante para producción? No cambia tasks ni specs (el circuit breaker ya cumple el rollback automático) — decidible post-fase 2.
- **Dominios/TLS**: nombre de dominio y certificado ACM para staging/prod — decidible al llegar al hito ECS/ALB (no altera el pipeline).
- **Frecuencia de deploys y autoscaling**: reglas de scaling de Fargate (por CPU/memoria) — decidible con datos de producción real.
