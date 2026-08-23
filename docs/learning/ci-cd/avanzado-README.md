# 🚀 Nivel Avanzado — Guías 11 a 17

> **Ruta de aprendizaje CI/CD · Nivel 3 de 4**
> Índice del nivel **Avanzado**: 7 guías (11-17) que cubren despliegue continuo, AWS, OIDC y releases.

Bienvenido al nivel **Avanzado** de la ruta de aprendizaje de CI/CD del proyecto. Si has completado los niveles **Fundamentos** (guías 00-04) e **Intermedio** (guías 05-10), estás listo para el salto a la infraestructura real de despliegue: AWS, ECS, OIDC, entornos de preview y releases automatizadas.

En este nivel dejarás de ver el CI/CD como "un workflow que corre tests" y empezarás a entenderlo como un **sistema de despliegue completo**: cómo se construye una imagen Docker, cómo se publica en un registro privado (ECR), cómo se despliega en producción con rollback automático, cómo se crean entornos de preview por pull request y cómo se publican releases versionadas con Changesets.

## 🎯 Objetivos de aprendizaje

Al completar este nivel serás capaz de:

1. **Distinguir CI de CD** y explicar las estrategias de despliegue blue-green y canary con sus ventajas y riesgos.
2. **Navegar AWS desde cero**: cuenta, región, ARN, consola, servicios regionales vs globales, y el inventario de servicios que usa este proyecto (ECS, ECR, RDS, IAM, ALB, VPC, Secrets Manager).
3. **Usar Floci** como emulador local de AWS para desarrollo y CI, entendiendo qué es y qué **NO** es (no es un proveedor de hosting).
4. **Leer `deploy.yml`** de principio a fin: build de imagen, push a ECR, despliegue a staging y producción con aprobación manual.
5. **Leer `preview.yml`**: entornos de preview por pull request con Floci, Prisma migrate, smoke tests y comentario automático en el PR.
6. **Explicar OIDC** y por qué elimina las credenciales estáticas de AWS en CI.
7. **Explicar el circuit breaker de ECS** y los health checks que protegen cada despliegue.
8. **Explicar el flujo de releases** con Changesets: versionado semántico, changelog y publicación a npm.

## 📋 Prerequisitos

Antes de empezar este nivel debes haber completado:

- **Nivel Fundamentos** (guías 00-04): qué es CI/CD, Git y YAML, GitHub Actions, secrets y variables, Docker básico.
- **Nivel Intermedio** (guías 05-10): husky y git hooks, walkthrough de `ci.yml`, workflows reutilizables, composite actions, caching y testing.

Si no has completado el nivel Intermedio, te recomendamos empezar por el [índice de Intermedio](./intermedio-README.md) antes de continuar.

## 🗺️ Roadmap de la ruta de aprendizaje

La ruta completa de CI/CD del proyecto tiene **4 niveles**. Este índice corresponde al nivel **Avanzado**:

| Nivel           | Guías | Estado          | Contenido                                                                   |
| --------------- | ----- | --------------- | --------------------------------------------------------------------------- |
| **Fundamentos** | 00-04 | ✅ Completado   | Qué es CI/CD, Git y YAML, GitHub Actions, secrets, Docker                   |
| **Intermedio**  | 05-10 | ✅ Completado   | Husky, ci.yml, workflows reutilizables, composite actions, caching, testing |
| **Avanzado**    | 11-17 | 🟠 En curso     | CD, AWS, Floci, deploy.yml, preview.yml, OIDC, ECS, Changesets              |
| **Profesional** | 18+   | 🔜 Próximamente | Terraform, observabilidad, costos, seguridad avanzada                       |

## 📚 Guías del nivel Avanzado

| #   | Guía                                                                              | Descripción                                                                      | Tiempo estimado |
| --- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------- | ----------------------------------------------- |
| 11  | [Conceptos de CD y AWS](./11-cd-conceptos-aws.md)                                 | CI vs CD, blue-green y canary, AWS desde cero, inventario de servicios           | 60-90 min       |
| 12  | [Floci: emulador de AWS](./12-floci-emulador-aws.md)                              | Qué es Floci, vs LocalStack, docker-compose.preview.yml, hands-on                | 60-90 min       |
| 13  | [Walkthrough de deploy.yml](./13-deploy-yml-walkthrough.md)                       | Fase 1 (build) y Fase 2 (ECR + staging + producción), gating, secrets            | 90-120 min      |
| 14  | [Entornos de preview (preview.yml)](./14-preview-environments-yml.md)             | Triggers, Floci + Postgres, Prisma migrate, smoke tests, comentario en PR        | 90-120 min      |
| 15  | [OIDC sin credenciales estáticas](./15-oidc-sin-credenciales-estaticas.md)        | Por qué OIDC, flujo JWT, trust policy, mínimo privilegio                         | 60-90 min       |
| 16  | [ECS: circuit breaker y health checks](./16-ecs-circuit-breaker-health-checks.md) | Task definition por SHA, force-new-deployment, rollback, smoke tests             | 60-90 min       |
| 17  | [Changesets y release.yml](./17-changesets-release-yml.md)                        | Flujo de release, changesets/action, fetch-depth 0, .changeset/                  | 60-90 min       |
| 05b | [Firma de Commits SSH ed25519](./05b-commit-signing.md)                           | Firma local ed25519, ruleset GitHub, OpenSpec `ci-commit-signing`, 6 fases F0-F5 | 60-90 min       | **05b** _(transversal: git local, antes de CI)_ |

5. **Guía 05 — Husky Git Hooks**: husky y hooks locales (pre-commit, commit-msg, pre-push).
6. **Guía 05b — Firma de Commits SSH ed25519**: firma local ed25519, reglaset GitHub, OpenSpec `ci-commit-signing`. _Transversal: cubre conceptos git local aplicables antes de avanzar al nivel CD._

### Orden de lectura recomendado

Las guías están ordenadas de forma **acumulativa**: cada una asume los conceptos de la anterior.

1. Empieza por la **guía 11** (conceptos) — es la base teórica de todo el nivel.
2. Sigue con la **guía 12** (Floci) — necesitarás el emulador para los hands-on de las guías 13 y 14.
3. Continúa con las **guías 13 y 14** (walkthroughs de deploy.yml y preview.yml) — son las dos caras del despliegue: producción y preview.
4. Profundiza con las **guías 15 y 16** (OIDC y ECS) — la seguridad y la robustez del despliegue.
5. Cierra con la **guía 17** (Changesets) — el flujo de release que publica el trabajo de todo el nivel.
6. **Guía 05b — Firma de Commits SSH ed25519**: reforzando la capa de autoría y supply-chain security, con conceptos que se conectan con la guía 05 (husky hooks) y preparando el terreno para el nivel Profesional. Útil como transición antes de las guías 18-23 de seguridad profesional.

> **Nota**: La guía 05b cubre conceptos de firma git que son independientes del nivel Avanzado CD, por eso se inserta después de la guía 05 (nivel Intermedio) como guía transversal.

## 🔍 Descripción detallada de las guías

### Guía 11 — Conceptos de CD y AWS desde cero

**Objetivo**: construir la base teórica del nivel. Aprenderás a distinguir CI de CD con analogías y tablas comparativas, conocerás las estrategias de despliegue **blue-green** y **canary** con diagramas, y aterrizarás los conceptos AWS fundamentales: cuenta, región, ARN, consola, servicios regionales vs globales.

**Contenido destacado**:

- Tabla comparativa CI vs CD y dónde encaja cada workflow del proyecto.
- Estrategias de despliegue: blue-green (dos entornos, switch de tráfico) y canary (porcentaje progresivo).
- Inventario de servicios AWS del proyecto: ECS Fargate, ECR, RDS PostgreSQL, IAM OIDC, ALB con sticky sessions para Socket.IO, VPC y Secrets Manager.
- Diagrama de arquitectura simplificado (versión didáctica de `docs/aws-deploy-architecture.md`).

**Hands-on**: ninguno (guía teórica). Prepara el terreno para la guía 12.

### Guía 12 — Floci: emulador de AWS

**Objetivo**: aprender a usar **Floci**, el emulador open source de AWS que el proyecto usa en desarrollo y CI. Entenderás qué es, cómo se compara con LocalStack, cómo se configura en `docker-compose.preview.yml` y cómo interactuar con él mediante comandos y scripts.

**Contenido destacado**:

- Qué es Floci: MIT, ~68 servicios, puerto 4566, imagen ~90MB, arranque ~24ms.
- Tabla comparativa Floci vs LocalStack (licencia, tamaño, servicios, costo).
- Desglose de `apps/server/docker-compose.preview.yml` (servicios floci, db, server).
- Patrón del script `apps/server/scripts/preview-smoke.mjs` (CreateSecret + GetSecretValue).
- ⚠️ **Advertencia clave**: Floci NO es un proveedor de hosting — es un emulador para dev/CI; producción usa AWS real.

**Hands-on**: levantar Floci con Docker Compose, verificar el healthcheck y ejecutar el smoke test.

### Guía 13 — Walkthrough de deploy.yml

**Objetivo**: leer el workflow de despliegue de producción de principio a fin. Es el corazón del CD del proyecto.

**Contenido destacado**:

- **Fase 1** (job `docker-build`): build de la imagen, servicios efímeros Floci + Postgres, health check y smoke tests contra el stack emulado.
- **Fase 2**: `ecr-push` (OIDC + ECR login + push taggeado por SHA), `deploy-staging` y `deploy-production` (aprobación manual vía environment).
- Gating `vars.AWS_ROLE_ARN != ''` y jobs `*-skipped` con `::notice::`.
- Inventario de secrets y el gotcha `JWT_SECRET` vs `SECRETKEY`.
- Concurrency groups con `cancel-in-progress: false`.

**Hands-on**: seguir un despliegue real en GitHub Actions y localizar cada fase en la UI.

### Guía 14 — Entornos de preview (preview.yml)

**Objetivo**: entender cómo el proyecto crea un **entorno de preview por pull request** usando Floci + Postgres efímeros, ejecuta Prisma migrate, corre smoke tests y publica la URL de Vercel en el PR.

**Contenido destacado**:

- Triggers: `pull_request` (opened, reopened, synchronize) sobre `main` + `workflow_dispatch`.
- Servicios efímeros Floci + Postgres y build de la imagen del server.
- Prisma migrate, arranque del contenedor con env vars dummy, health check (200 o 503) y smoke tests.
- Captura de la URL de preview de Vercel vía commit status API (`gh api`) con polling.
- Comentario en el PR con marker `<!-- preview-environments -->` y `edit-mode: replace`.
- Concurrency `preview-<n>` con `cancel-in-progress: true`.

**Hands-on**: abrir un PR y observar el workflow de preview en acción, incluyendo el comentario automático.

### Guía 15 — OIDC sin credenciales estáticas

**Objetivo**: entender por qué el proyecto usa **OIDC** en lugar de access keys de larga duración, y cómo funciona el flujo completo: GitHub firma un JWT → la trust policy de IAM lo verifica → STS emite credenciales temporales.

**Contenido destacado**:

- Problemas de las access keys estáticas: rotación dolorosa, blast radius, auditoría difícil.
- Flujo OIDC completo con diagrama mermaid.
- Modelo preciso: trust policy `StringLike repo:owner/repo:*` + `aud=sts.amazonaws.com` + filtro de environment en GitHub.
- Lección de verificación: la inconsistencia `:ref:refs/heads/main` (documentado) vs `repo:*` (HCL real).
- Política de mínimo privilegio (ECR push/pull, ECS update/describe solo en clusters del proyecto).
- IAM role vs IAM user: credenciales temporales vs estáticas.

**Hands-on**: inspeccionar `infra/` (HCL de Terraform) y localizar la trust policy real.

### Guía 16 — ECS: circuit breaker y health checks

**Objetivo**: entender cómo ECS protege cada despliegue: task definition pineada por SHA, `force-new-deployment`, circuit breaker con rollback automático y health checks configurables.

**Contenido destacado**:

- Registro de task definition pineada por Git SHA (reproducibilidad).
- `aws ecs update-service --force-new-deployment` + `deploymentCircuitBreaker={enable:true,rollback:true}`.
- Parámetros de health check: interval 30s, timeout 5s, retries 3, startPeriod 60s, path `/health`.
- Smoke tests post-deploy (staging 5 min, prod 5 min — 30 retries × 10s).
- Por qué producción NO es "un health window más largo": aprobación manual + concurrency group separado.
- Contraste: deploy naive vs deploy production-grade.

**Hands-on**: revisar un deployment en la consola de ECS y localizar el circuit breaker.

### Guía 17 — Changesets y release.yml

**Objetivo**: entender el flujo de release del proyecto con **Changesets**: versionado semántico, changelog automático y publicación a npm.

**Contenido destacado**:

- Flujo: push a `main` → detectar changesets pendientes → PR "chore: version packages" → merge → publicar a npm + tags git.
- Por qué `fetch-depth: 0` es requerido (changesets necesita los diffs de commits).
- Estructura de `.changeset/` (archivos de changeset, config.json, README).
- Referencia a la spec `openspec/specs/release-workflow/spec.md`.
- Concurrency group `release` con `cancel-in-progress: false`.

**Hands-on**: crear un changeset, ver el PR de versionado y seguir una release real.

### Guía 05b — Firma de Commits SSH ed25519

**Objetivo**: cerrar el nivel Avanzado con la capa de firma de commits y ruleset de enforcement. Aprenderás a configurar una clave SSH ed25519 dedicada, firmar commits localmente, y comprender las 6 fases del cambio OpenSpec `ci-commit-signing` (F0-F5), desde la configuración inicial hasta el ruleset de enforcement en `main`. Diferenciarás cuándo el ruleset nativo de GitHub basta y cuándo el job `verify-signatures` (F2) es indispensable, especialmente en squash-merge flujos.

**Contenido destacado**:

- Problema de autoría falsificable en Git y el vacío de firma.
- Cómo funciona la firma: clave privada local → badge Verified en GitHub.
- Tabla comparativa de métodos: GPG/SSH/S-MIME/sigstore (estatus Verified vs Unverified).
- **Por qué este repo elige SSH ed25519** (sin gpg-agent, rotación, compatibilidad git >= 2.34).
- Las 6 fases del OpenSpec `ci-commit-signing` (F0-F5): documentación, clave local, job CI, spike release, modo vigilant, ruleset.
- El hueco del squash-merge: ruleset nativo suficiente para merge-commit/rebase, pero insuficiente para squash-merge — ahí es donde F2 marca la diferencia.
- Flujo completo ASCII: máquina ↔ GitHub (firmado → badge → CI gate → enforcement).
- Qué NO hace: no reescribe 374 legacy, no toca Husky, no firma tags, no usa gitsign.
- Impacto enterprise: supply chain security, compliance SOC2/PCI-DSS, confianza colaboradores, política estándar orgs.

**Hands-on**: generar clave `id_ed25519_projectERP`, configurar `git config --global gpg.format ssh` + `user.signingkey` + `commit.gpgsign true`, verificar con `git log --show-signature`, y ejecutar el job `verify-signatures` en CI.

## 🧑‍🏫 Cómo usar este nivel

### Metodología

Cada guía sigue la misma estructura, consistente con los niveles anteriores:

1. **🎯 Objetivos de aprendizaje** — qué sabrás hacer al terminar.
2. **📋 Prerequisitos** — qué necesitas saber antes de empezar.
3. **Teoría primero** — conceptos explicados desde cero con analogías.
4. **Walkthrough con `# Source:`** — análisis de los archivos reales del repo con citas a la fuente.
5. **Hands-on** — comandos y ejercicios para practicar.
6. **FAQ, glosario y checklist** — repaso y autoevaluación.
7. **Navegación** — enlaces a la guía anterior y siguiente.

### Regla de oro: link-don't-copy

Las guías de este nivel **no copian** la documentación técnica existente del repo. Cuando un fragmento de un doc de referencia es esencial para el aprendizaje, se incluye como snippet corto (<40 líneas) con cita a la fuente; si es más largo, se enlaza. Busca siempre el marcador `# Source:` en los walkthroughs.

### Documentos de referencia AWS

Estas guías se apoyan en la documentación técnica existente del proyecto. No necesitas leerlos completos antes, pero te serán útiles como referencia:

| Documento                              | Contenido                                                     | Se usa en        |
| -------------------------------------- | ------------------------------------------------------------- | ---------------- |
| `docs/aws-deploy-architecture.md`      | Arquitectura de despliegue AWS (diagrama mermaid completo)    | Guías 11, 13, 16 |
| `docs/aws-dev-local-floci.md`          | Floci para desarrollo local                                   | Guía 12          |
| `docs/aws-learning-with-floci.md`      | Aprender AWS con Floci                                        | Guía 12          |
| `docs/aws-cd-learning-path.md`         | Ruta pedagógica: Floci → Consola → Terraform                  | Guías 12, 15     |
| `docs/cicd-estado-actual.md`           | Estado actual del CI/CD (sección 10: workflows, §11.2: datos) | Guías 13, 15     |
| `docs/workflows-mantenimiento-guia.md` | Mantenimiento de workflows (sección 14: secrets)              | Guías 13, 14     |

### Archivos fuente que analizarás

| Archivo                | Ruta                                      | Guías  |
| ---------------------- | ----------------------------------------- | ------ |
| Workflow de despliegue | `.github/workflows/deploy.yml`            | 13, 16 |
| Workflow de preview    | `.github/workflows/preview.yml`           | 14     |
| Workflow de release    | `.github/workflows/release.yml`           | 17     |
| Compose de preview     | `apps/server/docker-compose.preview.yml`  | 12, 14 |
| Smoke test             | `apps/server/scripts/preview-smoke.mjs`   | 12, 14 |
| Terraform (HCL)        | `infra/`                                  | 15     |
| Spec de release        | `openspec/specs/release-workflow/spec.md` | 17     |

## ❓ FAQ

### ¿Necesito una cuenta de AWS para hacer estas guías?

**No.** Las guías 12, 13 y 14 se pueden seguir completamente con **Floci** (el emulador local) y GitHub Actions. Solo las guías 15 y 16 requieren entender AWS real, y para eso basta con leer y observar — no necesitas desplegar nada por tu cuenta. Si tienes acceso de solo lectura a la cuenta del proyecto, úsalo para inspeccionar; si no, las guías son autocontenidas.

### ¿Qué diferencia hay entre este nivel y el Intermedio?

El nivel **Intermedio** se centra en el **CI**: workflows que verifican código (tests, lint, build). El nivel **Avanzado** se centra en el **CD**: cómo el código verificado se convierte en una imagen, se publica y se despliega en entornos reales (staging, producción, preview), con seguridad (OIDC) y robustez (circuit breaker).

### ¿Por qué el proyecto usa Floci y no LocalStack?

Floci es **open source (MIT)**, ligero (~90MB de imagen, arranque ~24ms) y cubre los ~68 servicios que el proyecto necesita para desarrollo y CI. LocalStack tiene más servicios y features, pero su modelo de licencia es más restrictivo para uso comercial. La guía 12 tiene la tabla comparativa completa.

### ¿Qué es un "smoke test"?

Un **smoke test** es una verificación rápida y superficial de que el sistema **arranca y responde** — no prueba funcionalidad en profundidad, solo que "no hay humo" (no se quema). En este proyecto, los smoke tests verifican que el server responde en `/health` y que Secrets Manager emulado responde a CreateSecret/GetSecretValue.

### ¿Qué es OIDC y por qué es importante?

**OIDC (OpenID Connect)** es un protocolo que permite a GitHub Actions obtener **credenciales temporales de AWS sin guardar access keys**. En lugar de almacenar un secreto de larga duración, GitHub firma un JWT que AWS verifica y cambia por credenciales de corta duración. Es más seguro: no hay secretos que rotar ni que filtrar. Guía 15.

### ¿Qué pasa si un despliegue falla?

Depende de la fase:

- Si falla el **build o los smoke tests** (Fase 1), el workflow se detiene y **nada se despliega**.
- Si falla el **health check en ECS** (Fase 2), el **circuit breaker** revierte automáticamente a la versión anterior.
- Si falla la **aprobación manual**, el despliegue a producción simplemente no ocurre.

Ningún fallo deja el sistema a medias: esa es la diferencia entre un deploy naive y uno production-grade (guía 16).

### ¿Cuánto tiempo toma completar el nivel?

Entre **7 y 12 horas** en total, dependiendo de tu ritmo: cada guía toma entre 60 y 120 minutos (ver tabla de guías). Las guías 13 y 14 (walkthroughs) son las más largas porque incluyen hands-on con workflows reales.

### ¿Puedo saltarme alguna guía?

Las guías 11 y 12 son **prerequisito** de las demás: sin los conceptos de CD/AWS y sin saber usar Floci, los walkthroughs de las guías 13-17 serán difíciles de seguir. Las guías 15, 16 y 17 son más independientes entre sí, pero todas asumen el contexto de las dos primeras.

### ¿Dónde están los archivos de los que hablan las guías?

Todos los archivos analizados están en el repo:

- Workflows: `.github/workflows/`
- Docs de referencia: `docs/`
- Compose y scripts: `apps/server/`
- Infraestructura Terraform: `infra/`

La sección "Archivos fuente" de este README tiene la tabla completa con rutas.

### ¿Qué hago si encuentro un error en una guía?

Abre un issue o un PR corrigiendo la guía. Las guías son parte del repo y siguen el mismo flujo de calidad que el código: cualquier cambio pasa por CI.

## 📖 Glosario

| Término             | Definición                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| **ALB**             | Application Load Balancer: balanceador de carga de AWS que reparte tráfico HTTP/HTTPS entre instancias   |
| **ARN**             | Amazon Resource Name: identificador único y estandarizado de un recurso AWS                              |
| **Blue-Green**      | Estrategia de despliegue con dos entornos (Blue y Green) y switch de tráfico                             |
| **Canary**          | Estrategia de despliegue que expone la versión nueva a un porcentaje progresivo de usuarios              |
| **CD**              | Continuous Delivery/Deployment: el pipeline deja el software listo para producción y lo despliega        |
| **Changesets**      | Herramienta de versionado semántico y changelog automático para monorepos npm                            |
| **CI**              | Continuous Integration: integración y verificación frecuente del código                                  |
| **Circuit breaker** | Mecanismo de ECS que revierte automáticamente un deployment si el health check falla                     |
| **ECR**             | Elastic Container Registry: registro privado de imágenes Docker en AWS                                   |
| **ECS**             | Elastic Container Service: servicio de AWS para ejecutar contenedores                                    |
| **Fargate**         | Modo serverless de ECS: AWS gestiona los servidores                                                      |
| **Floci**           | Emulador open source (MIT) de servicios AWS para desarrollo y CI                                         |
| **Health check**    | Verificación periódica de que un servicio responde correctamente                                         |
| **IAM**             | Identity and Access Management: servicio global de identidades y permisos de AWS                         |
| **OIDC**            | OpenID Connect: protocolo para obtener credenciales temporales sin secretos estáticos                    |
| **RDS**             | Relational Database Service: base de datos gestionada de AWS                                             |
| **Smoke test**      | Verificación rápida de que el sistema arranca y responde                                                 |
| **Sticky sessions** | Configuración del ALB para que un cliente siempre caiga en la misma instancia (necesaria para Socket.IO) |
| **Task definition** | La "receta" del contenedor en ECS: imagen, CPU, memoria, health check                                    |
| **VPC**             | Virtual Private Cloud: red virtual aislada de AWS                                                        |

## 🎓 Checklist de graduación del nivel

Marca cada ítem cuando lo hayas completado. Cuando todos estén marcados, habrás graduado el nivel Avanzado:

### Conceptos (guía 11)

- [ ] Puedo explicar CI vs CD con una analogía propia.
- [ ] Puedo describir blue-green y canary con sus ventajas y riesgos.
- [ ] Puedo leer un ARN y decir qué servicio, región y recurso identifica.
- [ ] Puedo enumerar los 7 servicios AWS del proyecto y su rol.

### Floci (guía 12)

- [ ] Puedo explicar qué es Floci y qué NO es (no es hosting).
- [ ] Puedo levantar Floci con Docker Compose y verificar su healthcheck.
- [ ] Puedo explicar el patrón CreateSecret + GetSecretValue del smoke test.

### deploy.yml (guía 13)

- [ ] Puedo explicar las dos fases del workflow y qué hace cada job.
- [ ] Puedo explicar el gating `vars.AWS_ROLE_ARN != ''` y los jobs `*-skipped`.
- [ ] Puedo explicar el gotcha `JWT_SECRET` vs `SECRETKEY`.

### preview.yml (guía 14)

- [ ] Puedo explicar los triggers y el flujo completo de un preview.
- [ ] Puedo explicar cómo se captura la URL de Vercel y se comenta en el PR.

### OIDC (guía 15)

- [ ] Puedo explicar el flujo JWT → trust policy → STS con un diagrama.
- [ ] Puedo explicar por qué OIDC elimina las access keys estáticas.
- [ ] Puedo explicar la diferencia entre IAM role e IAM user.

### ECS (guía 16)

- [ ] Puedo explicar el pinning por SHA y el circuit breaker con rollback.
- [ ] Puedo explicar cada parámetro del health check (interval, timeout, retries, startPeriod).
- [ ] Puedo contrastar un deploy naive vs uno production-grade.

### Changesets (guía 17)

- [ ] Puedo explicar el flujo de release completo con Changesets.
- [ ] Puedo explicar por qué `fetch-depth: 0` es necesario.

## 🧭 Navegación

### Nivel anterior: Intermedio

Si necesitas repasar los conceptos previos, vuelve al [índice de Intermedio](./intermedio-README.md) (guías 05-10) o al [índice de Fundamentos](./fundamentos-README.md) (guías 00-04).

### Nivel siguiente: Profesional

El nivel **Profesional** (guías 05b+, 🔜 próximamente) cubrirá Terraform avanzado, observabilidad, optimización de costos y seguridad avanzada. Este nivel Avanzado es el prerequisito directo.

### Índice de guías

| Guía | Título                       | Anterior                                        | Siguiente                                       |
| ---- | ---------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| 11   | Conceptos de CD y AWS        | [10-testing-pipeline](./10-testing-pipeline.md) | [12](./12-floci-emulador-aws.md)                |
| 12   | Floci: emulador de AWS       | [11](./11-cd-conceptos-aws.md)                  | [13](./13-deploy-yml-walkthrough.md)            |
| 13   | Walkthrough de deploy.yml    | [12](./12-floci-emulador-aws.md)                | [14](./14-preview-environments-yml.md)          |
| 14   | Entornos de preview          | [13](./13-deploy-yml-walkthrough.md)            | [15](./15-oidc-sin-credenciales-estaticas.md)   |
| 15   | OIDC sin credenciales        | [14](./14-preview-environments-yml.md)          | [16](./16-ecs-circuit-breaker-health-checks.md) |
| 16   | ECS circuit breaker          | [15](./15-oidc-sin-credenciales-estaticas.md)   | [17](./17-changesets-release-yml.md)            |
| 17   | Changesets y release         | [16](./16-ecs-circuit-breaker-health-checks.md) | [README Avanzado](./avanzado-README.md)         |
| 05b  | Firma de Commits SSH ed25519 | [05](./05-husky-git-hooks.md)                   | [README Avanzado](./avanzado-README.md)         |

---

_Última actualización: nivel Avanzado en construcción. Las guías 11-17 se publican de forma incremental._
