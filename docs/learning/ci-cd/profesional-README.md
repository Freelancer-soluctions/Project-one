# 🏆 Nivel Profesional — Guías 18 a 29

> **Ruta de aprendizaje CI/CD · Nivel 4 de 4**
> Índice del nivel **Profesional**: gobernanza y revisión (18-22), pipeline enterprise (23), DAG de infraestructura (24) y seguridad, Dependabot, mantenimiento y métricas DORA (25-29).

Bienvenido al nivel **Profesional**, el cuarto y último nivel de la ruta de aprendizaje de CI/CD del proyecto. Si has completado los niveles **Fundamentos** (guías 00-04), **Intermedio** (guías 05-10) y **Avanzado** (guías 11-17), estás listo para el salto de **Senior a Staff**: dejarás de "operar el CI" y empezarás a **diseñar, asegurar, medir y mantener el pipeline como un activo de producción**.

En este nivel aprenderás la familia de seguridad SAST/SCA/SBOM desde cero, el modelo de seguridad de 3 niveles (pre-commit / PR / cron), la gestión rutinaria de Dependabot, la filosofía de mantenimiento de workflows ("el código se pudre"), las métricas DORA y SLSA que separan a un Senior de un Staff, y los patrones de un pipeline enterprise de referencia.

## 🎯 Objetivos de aprendizaje

Al completar este nivel serás capaz de:

1. **Explicar la familia de seguridad de aplicaciones desde cero**: SAST (CodeQL), SCA (Trivy), SBOM (Anchore), detección de secrets (Gitleaks) y Dependency Review, y leer `security.yml` de principio a fin.
2. **Operar la seguridad por cron**: el modelo de seguridad de 3 niveles (pre-commit / PR / cron), `scheduled-security.yml` (Gitleaks full-history) y `security-digest.yml` (SBOM + OSV + digest).
3. **Gestionar Dependabot de forma rutinaria**: los 3 ecosistemas (npm, github-actions, docker), la rutina mensual de revisión y por qué Dependabot evita el drift de actions.
4. **Mantener workflows con una filosofía clara**: `.nvmrc` como single source of truth, `fetch-depth: 0` opt-in, política de versionado de actions, checklist trimestral y anti-patrones.
5. **Interpretar métricas DORA y SLSA**: las 4 métricas DORA, los niveles SLSA 1-4, y dónde se ubica el proyecto (Build L1, con camino abierto a L2).
6. **Evaluar patrones enterprise**: qué capacidades (SLSA, VEX, IaC, entornos reales) separan realmente a un pipeline enterprise — más allá del número de jobs — y qué parte del future-proofing merece la pena.

## 📋 Prerequisitos

Antes de empezar este nivel debes haber completado:

- **Nivel Fundamentos** (guías 00-04): qué es CI/CD, Git y YAML, GitHub Actions, secrets y variables, Docker básico.
- **Nivel Intermedio** (guías 05-10): husky y git hooks, walkthrough de `ci.yml`, workflows reutilizables, composite actions, caching y testing.
- **Nivel Avanzado** (guías 11-17): CD, AWS, Floci, `deploy.yml`, `preview.yml`, OIDC, ECS y Changesets.

Se asume que ya conoces los workflows del proyecto, Husky, composite actions, caching, AWS CD con Floci/ECS/OIDC y Changesets.

Si no has completado el nivel Avanzado, te recomendamos empezar por el [índice de Avanzado](./avanzado-README.md) antes de continuar.

## 🗺️ Roadmap de la ruta de aprendizaje

La ruta completa de CI/CD del proyecto tiene **4 niveles**. Este índice corresponde al nivel **Profesional**, el cuarto y último:

| Nivel           | Guías | Estado        | Contenido                                                               |
| --------------- | ----- | ------------- | ----------------------------------------------------------------------- |
| **Fundamentos** | 00-04 | ✅ Completado | Qué es CI/CD, Git y YAML, GitHub Actions, secrets, Docker               |
| **Intermedio**  | 05-10 | ✅ Completado | Husky, ci.yml, workflows reutilizables, composite actions, caching      |
| **Avanzado**    | 11-17 | ✅ Completado | CD, AWS, Floci, deploy.yml, preview.yml, OIDC, ECS, Changesets          |
| **Profesional** | 18-29 | 🟢 En curso   | Gobernanza, enterprise, DAG, seguridad, Dependabot, mantenimiento, DORA |

## 📚 Guías del nivel Profesional

| #   | Guía                                                                          | Descripción                                                                                                                            | Estado         |
| --- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| 18  | [Trunk-based development](./18-trunk-based-development.md)                    | Estrategia de ramas integradas, PRs pequeños y despliegue continuo                                                                     | ✅ Publicada   |
| 19  | [Governance Gates](./19-governance-gates.md)                                  | Framework de 5 niveles de enforcement: commit → PR → merge → post-merge → audit                                                        | ✅ Publicada   |
| 20  | [Governance Stage](./20-governance-stage.md)                                  | Implementación por fases de los gates de gobernanza en el pipeline del proyecto                                                        | ✅ Publicada   |
| 21  | [Code Review](./21-code-review.md)                                            | La técnica de QA nº 1: por qué, 6 dimensiones, técnicas, IA, métricas, single-dev                                                      | ✅ Publicada   |
| 22  | [Rulesets](./22-rulesets-guide.md)                                            | Catálogo de reglas, bypass actors, enforcement y binding ruleset ↔ checks                                                              | ✅ Publicada   |
| 23  | [Pipeline enterprise de referencia](./23-ci-enterprise-reference-pipeline.md) | Escala real (15 archivos / 94 jobs), SLSA L1-L3, VEX, IaC advisory, future-proofing; `ci-enterprise.yml` **retirado** → snippets 02/09 | ✅ Publicada   |
| 24  | [DAG de infraestructura](./24-dag-infraestructura.md)                         | Grafo acíclico del pipeline, panorama de sistemas y el DAG real de `ci.yml`                                                            | ✅ Publicada   |
| 25  | security.yml: SAST, SCA y SBOM                                                | Familia de seguridad desde cero, 5 jobs de `security.yml`, permisos                                                                    | 📝 Planificada |
| 26  | Seguridad programada (cron)                                                   | Modelo de 3 niveles, `scheduled-security.yml`, `security-digest.yml`                                                                   | 📝 Planificada |
| 27  | Dependabot: 3 ecosistemas                                                     | `dependabot.yml`, rutina mensual, drift de actions                                                                                     | 📝 Planificada |
| 28  | Mantenimiento de workflows                                                    | `.nvmrc` SSOT, `fetch-depth` opt-in, checklist trimestral, anti-patrones                                                               | 📝 Planificada |
| 29  | Métricas DORA y performance tuning                                            | 4 métricas DORA, SLSA, tuning del pipeline, `act` local                                                                                | 📝 Planificada |

### Nota sobre la numeración

El plan original de este nivel asignaba a sus guías los números **18-23**, pero 18-22 ya estaban ocupadas por la serie de gobernanza y revisión y el 24 por el DAG. Para no romper enlaces ni renombrar archivos publicados, las guías pendientes se renumeran a **25-29** conservando su orden relativo (seguridad → cron → Dependabot → mantenimiento → DORA), y sólo la 23 coincide con el plan original. Las filas marcadas como "Planificada" **no tienen archivo todavía**: no son enlaces a propósito.

## 🛣️ Orden de lectura recomendado

Las guías están ordenadas de forma **acumulativa**: cada una asume los conceptos de la anterior.

1. **Gobernanza y revisión (18-22)** — trunk-based development → governance gates → governance stage → code review → rulesets. Gobiernan _qué puede entrar_ en `main` y _cómo se revisa_.
2. **Guía 23 (enterprise)** — el salto de escala: qué capacidades añade un pipeline enterprise y dónde está realmente este repo.
3. **Guía 24 (DAG)** — el grafo del pipeline: por qué el orden de los jobs no es el orden del archivo.
4. **Guía 25 (security.yml)** — la base de seguridad del nivel: SAST, SCA, SBOM, secrets y dependency review.
5. **Guía 26 (seguridad programada)** — el modelo de 3 niveles y la red de seguridad por cron.
6. **Guía 27 (Dependabot)** — la gestión rutinaria de dependencias y el drift de actions.
7. **Guía 28 (mantenimiento)** — la filosofía de mantener el pipeline vivo.
8. **Guía 29 (DORA y performance)** — la medición: los marcos Staff-level y el cierre del nivel.

> Si sigues la serie de gobernanza por separado: **18** (trunk-based) → **19** (governance gates) → **20** (governance stage) → **21** (code review) → **22** (rulesets). Tras gobernar _qué puede entrar_ en `main`, la guía 21 enseña _cómo se revisa_ y la 22 convierte las decisiones en reglas ejecutables.

## 🔍 Descripción detallada de las guías

### Guía 23 — Pipeline enterprise de referencia

**Objetivo**: cerrar la parte comparativa del nivel con el salto de escala. Aprenderás a medir la escala real del pipeline (y por qué "9 workflows" o "30+ jobs" no son métricas de madurez), qué capacidades definen un pipeline enterprise, los requisitos de SLSA Build L1-L3, VEX, el estado real del escaneo de IaC y qué parte del future-proofing (Kubernetes, canary, feature flags, OpenTelemetry) merece la pena.

**Contenido destacado**:

- Las cuatro métricas de escala que se confunden en una: archivos (15), definiciones de job (94, 57 en `ci.yml`),
  workflows activos en el registro (9) y required checks (4).
- El drift de conteo: `quality.yml` eliminado (jobs inline `if: false`) y `ci-enterprise.yml` retirado → los archivos
  bajaron y los jobs de `ci.yml` subieron; la comparación "9 vs 30+ jobs" queda obsoleta.
- Los 14 stages del pipeline genérico (`ci-cd-pipeline-empresarial.md` §2.3) frente a lo que el repo cubre hoy.
- SLSA: tabla L1-L4, posición real del proyecto (Build L1: SBOM sin provenance firmada) y qué falta para L3.
- VEX: los 4 statuses (not_affected, affected, fixed, under_investigation) y por qué `ignore-unfixed` de Trivy es un
  sustituto pobre.
- Escaneo de IaC: existe como `checkov-iac` en `ci.yml` (advisory, `soft_fail`), no en `security.yml`; la FASE 2
  (baseline fail-on-new) está planificada y sin implementar.
- `ci-enterprise.yml` como referencia didáctica: paths `frontend/`/`backend/` inexistentes, cache miss garantizado y
  path filter muerto. **El archivo está retirado** (ver `CONTEXT-CICD.md` §5.9), así que el módulo trabaja con los
  snippets de las guías 02/09.
- Future-proofing con criterio coste/beneficio: por qué canary y Kubernetes no son la siguiente prioridad de este repo.

**Hands-on**: medir archivos/jobs/`if: false`, detectar paths fantasma en `cache-dependency-path`, comparar el drift
actual de pins (`setup-node` en dos versiones vs `paths-filter` en una) y auditar el nivel SLSA en dos comandos.

### Guía 25 — security.yml: SAST, SCA y SBOM

**Objetivo**: construir la base de seguridad del nivel. Aprenderás la taxonomía de seguridad de aplicaciones **desde cero** — SAST, SCA, SBOM, secrets detection y dependency review — y leerás el workflow `security.yml` de principio a fin: sus 5 jobs, triggers, concurrency y el modelo de permisos de mínimo privilegio.

**Contenido destacado**:

- Tabla comparativa SAST vs SCA vs SBOM vs secrets detection vs dependency review.
- Job `sast`: CodeQL `init@v4` + `analyze@v4`, `languages: javascript,actions`, autobuild comentado → `npm ci` manual (monorepo con workspaces).
- Job `dependency-scan`: Trivy `aquasecurity/trivy-action@0.36.0`, scan fs, severidad CRITICAL/HIGH, `exit-code: '1'` (fail-closed), `ignore-unfixed: true`, SARIF upload con `if: always()`.
- Job `sbom`: `anchore/sbom-action@v0.24.0`, CycloneDX JSON, artifact 365 días.
- Job `secrets`: Gitleaks OSS (diff scan) + licensed (gated por `${{ secrets.GIT_LEAKS }}`) + el gotcha del warning/skip silencioso.
- Job `dependency-review`: `actions/dependency-review-action@v5` (vuln + license check en PR).
- Modelo de permisos: `security-events: write` en los workflows que suben SARIF, y la excepción histórica de `ci-enterprise.yml` (workflow **retirado**; el archivo ya no existe).

**Hands-on**: leer `security.yml` en el repo y localizar cada job, trigger y permiso.

### Guía 26 — Seguridad programada (cron)

**Objetivo**: entender la seguridad por cron como la red de seguridad que cubre lo que el diff no ve. Aprenderás el **modelo de seguridad de 3 niveles** (pre-commit / PR / cron) como principio organizador, y desglosarás `scheduled-security.yml` y `security-digest.yml`.

**Contenido destacado**:

- El modelo de 3 niveles con diagrama mermaid: pre-commit (Husky), PR (security.yml), cron (lunes 03:00 UTC).
- `scheduled-security.yml`: cron `0 3 * * 1`, checkout `fetch-depth: 0`, Gitleaks full-history `--log-opts="--all"` → JSON + SARIF, uploads con `if: always()`.
- `security-digest.yml`: mismo cron, SBOM + OSV Scanner, digest con `scripts/security/generate-security-digest.mjs`, comment opcional en PR.
- Jobs `notify-failure`: `needs` + `if: failure()` + `issues: write` que crean issues en fallo.
- Semántica fail-closed: `continue-on-error` removido, rol de `if: always()` en uploads.

**Hands-on**: inspeccionar ambos workflows y el script de digest en el repo.

### Guía 27 — Dependabot: 3 ecosistemas

**Objetivo**: dominar la gestión rutinaria de dependencias con Dependabot. Aprenderás los 3 ecosistemas configurados en `.github/dependabot.yml`, la rutina mensual de revisión y por qué Dependabot es la defensa contra el drift de actions.

**Contenido destacado**:

- Concepto de Dependabot: PRs automáticos de dependencias y su rol en la cadena de suministro.
- Ecosistema npm: raíz, weekly lunes 03:00 UTC, grupos dev-deps minor/patch, ignore de majors react/react-dom.
- Ecosistemas github-actions (prefix `ci`) y docker (`apps/server`, prefix `ci`).
- Diferencia de cadencia npm vs github-actions (por qué las actions se priorizan).
- Rutina mensual: revisar cluster de PRs, batch-merge patch+minor, evaluar major aparte.
- Por qué Dependabot evita el drift de actions (medible en la tabla de pins de `CONTEXT-CICD.md` §13.5) y qué pasa si `dependabot.yml` desaparece.

**Hands-on**: revisar los PRs de Dependabot abiertos y clasificarlos por tipo de bump.

### Guía 28 — Mantenimiento de workflows

**Objetivo**: adoptar la filosofía de mantenimiento "**los workflows son código y se pudren**". Aprenderás los casos reales del repo (Caso 1 EBADENGINE, Caso 2 test-reporter), las políticas de `.nvmrc`, `fetch-depth` y versionado de actions, el checklist trimestral y los anti-patrones.

**Contenido destacado**:

- Filosofía de mantenimiento (`workflows-mantenimiento-guia.md` sección 1).
- `.nvmrc` como single source of truth: Caso 1 (EBADENGINE omniroute@3.8.49, commit `cf5e1bb`) y su propagación atómica. El caso se resolvió con 9 archivos de workflow; hoy hay **15 archivos y 94 definiciones de job** (fuente: `CONTEXT-CICD.md` §3.4) — el número caduca, la regla de editar la fuente de verdad y propagar en un solo commit no.
- `fetch-depth: 0` opt-in: Caso 2 (dorny/test-reporter exit 128) y anti-patrones asociados.
- Política de versionado de actions: tags vs SHA pinning (decisión: tags + Dependabot gana).
- Gotcha del timeout de bash 120s en `.husky/pre-commit` (commits `cf5e1bb` y `32d35a8`).
- Checklist de mantenimiento trimestral (11 items de la sección 17).
- Anti-patrones: editar `.nvmrc` workflow por workflow, engines floors, `fetch-depth: 0` "por si acaso", combinar bump+workflow.

**Hands-on**: ejecutar el checklist trimestral contra el repo real.

### Guía 29 — Métricas DORA y performance tuning

**Objetivo**: medir el pipeline con los marcos Staff-level y cerrar el nivel. Aprenderás las 4 métricas DORA, los niveles SLSA 1-4, y las técnicas de performance tuning del pipeline (jobs paralelos, cache hit ratio, path filtering, concurrency, composite actions, `act`).

**Contenido destacado**:

- Las 4 métricas DORA en tabla: Deployment Frequency, Lead Time for Changes, Change Failure Rate, MTTR.
- Cómo el pipeline del proyecto afecta cada métrica (conexión con `docs/ci-cd-pipeline-empresarial.md` §26).
- SLSA desde cero: niveles 1-4 y dónde se ubica el proyecto (Build L1: SBOM + dependency review sin provenance firmada; L2 = un job `actions/attest`).
- Framing Staff-level: DORA y SLSA como marcadores de la transición Senior → Staff.
- Performance tuning: jobs paralelos, cache hit ratio (npm/Vitest/Playwright), path filtering (`dorny/paths-filter`), cancelación por `concurrency`, composite actions.
- `act` para dry-run local sin gastar minutos de GitHub Actions.

**Hands-on**: calcular las 4 métricas DORA del proyecto con datos reales de GitHub Actions.

## 🧑‍🏫 Cómo usar este nivel

### Metodología

Cada guía sigue la misma estructura, consistente con los niveles anteriores:

1. **🎯 Objetivos de aprendizaje** — qué sabrás hacer al terminar.
2. **📋 Prerequisitos** — qué necesitas saber antes de empezar.
3. **Teoría primero** — conceptos explicados desde cero con analogías (especialmente la familia SAST/SCA/SBOM y SLSA/VEX).
4. **Walkthrough con `# Source:`** — análisis de los archivos reales del repo con citas a la fuente.
5. **Hands-on** — comandos y ejercicios para practicar.
6. **FAQ, glosario y checklist** — repaso y autoevaluación.
7. **Navegación** — enlaces a la guía anterior y siguiente.

### Regla de oro: link-don't-copy

Las guías de este nivel **no copian** la documentación técnica existente del repo. Cuando un fragmento de un doc de referencia es esencial para el aprendizaje, se incluye como snippet corto (<40 líneas) con cita a la fuente; si es más largo, se enlaza. Busca siempre el marcador `# Source:` en los walkthroughs.

### Documentos de referencia

Estas guías se apoyan en la documentación técnica existente del proyecto. No necesitas leerlos completos antes, pero te serán útiles como referencia:

| Documento                                             | Contenido                                                             | Se usa en       |
| ----------------------------------------------------- | --------------------------------------------------------------------- | --------------- |
| `docs/learning/ci-cd/workflows-mantenimiento-guia.md` | Playbook de mantenimiento de workflows (casos, checklist, inventario) | Guías 25-28     |
| `docs/CONTEXT-CICD.md`                                | Inventario de workflows (§3.4, §5.9), pins y drift (§13.5)            | Guías 23, 25-27 |
| `docs/ci-cd-pipeline-empresarial.md`                  | 14 stages (§2.3), supply chain §25, métricas DORA y costo (§26)       | Guías 23, 29    |
| `docs/security/security-enterprise-guide.md`          | Guía enterprise de seguridad (SLSA, VEX, SBOM)                        | Guías 23, 29    |
| `docs/aws-deploy-architecture.md`                     | Arquitectura de despliegue AWS                                        | Guía 23         |
| `docs/aws-cd-learning-path.md`                        | Ruta pedagógica AWS: Floci → Consola → Terraform                      | Guía 23         |

### Archivos fuente que analizarás

| Archivo               | Ruta                                                  | Guías  |
| --------------------- | ----------------------------------------------------- | ------ |
| Security pipeline     | `.github/workflows/security.yml`                      | 25, 23 |
| Seguridad programada  | `.github/workflows/scheduled-security.yml`            | 26     |
| Security digest       | `.github/workflows/security-digest.yml`               | 26     |
| Dependabot            | `.github/dependabot.yml`                              | 27     |
| Digest script         | `scripts/security/generate-security-digest.mjs`       | 26     |
| CI enterprise         | — (archivo **retirado**; snippets guías 02/09)        | 23     |
| Guía de mantenimiento | `docs/learning/ci-cd/workflows-mantenimiento-guia.md` | 28     |

## ❓ FAQ

### ¿Necesito conocimientos previos de seguridad para este nivel?

**No.** La guía 25 introduce la familia SAST/SCA/SBOM **desde cero**, con analogías y tablas comparativas. Si completaste los niveles anteriores, tienes el contexto de CI/CD necesario; la seguridad se construye sobre esa base. Las guías 29 y 23 hacen lo mismo con DORA, SLSA y VEX.

### ¿Qué diferencia hay entre este nivel y el Avanzado?

El nivel **Avanzado** se centra en el **CD**: cómo el código verificado se convierte en una imagen, se publica y se despliega (AWS, OIDC, ECS, Changesets). El nivel **Profesional** se centra en la **madurez del pipeline como activo**: seguridad en profundidad (SAST/SCA/SBOM), mantenimiento rutinario, métricas de rendimiento (DORA) y evaluación de patrones enterprise.

### ¿Qué es el "modelo de seguridad de 3 niveles"?

Es el principio organizador de la guía 26: la seguridad del proyecto se organiza en 3 capas complementarias — **pre-commit** (hooks de Husky locales: Semgrep + Gitleaks en staged), **PR/CI** (`security.yml` en cada PR: Trivy, CodeQL, Gitleaks diff, SBOM, Dependency Review) y **cron** (`scheduled-security.yml` + `security-digest.yml` cada lunes: Gitleaks full-history, OSV, digest). Cada capa tiene coste y cobertura distintos; juntas forman "shifting left con red de seguridad por cron".

### ¿Qué son las métricas DORA y por qué importan?

**DORA** (DevOps Research and Assessment) define 4 métricas estándar de rendimiento de entrega: **Deployment Frequency** (frecuencia de deploys), **Lead Time for Changes** (tiempo de commit a producción), **Change Failure Rate** (% de deploys que causan incidentes) y **MTTR** (tiempo de recuperación). Son el estándar de la industria para medir si el pipeline es un activo o un freno. Guía 29.

### ¿Qué es SLSA?

**SLSA** (Supply-chain Levels for Software Artifacts) es un marco de niveles 1-4 para la seguridad de la cadena de suministro: cuánta confianza puedes tener en que un artifact se construyó de forma íntegra y verificable. El proyecto se ubica en **Build L1** (SBOM CycloneDX + dependency review, sin provenance firmada: no hay `attest`, `cosign`, `provenance` ni `sigstore` en los workflows); el OIDC hacia AWS no cuenta como SLSA Build. Alcanzar L2 es un job de `actions/attest`. Guías 29 y 23.

### ¿Qué es VEX?

**VEX** (Vulnerability Exploitability Exchange) es un estándar para comunicar si una vulnerabilidad conocida **es explotable en tu contexto** específico. Tiene 4 statuses: `not_affected`, `affected`, `fixed` y `under_investigation`. Evita el ruido de alertas: una vuln que no afecta tu uso no debe bloquear el deploy. Guía 23.

### ¿Cuánto tiempo toma completar el nivel?

Entre **10 y 14 horas** en total, dependiendo de tu ritmo: cada guía toma entre 60 y 120 minutos (ver tabla de guías). Las guías 25 y 26 (seguridad) son las más densas porque introducen conceptos desde cero.

### ¿Puedo saltarme alguna guía?

Las guías 25 y 26 son **prerequisito** de las demás del bloque de seguridad: sin la familia SAST/SCA/SBOM y sin el modelo de 3 niveles, las guías 27-29 serán difíciles de seguir. Las guías 27, 28 y 29 son más independientes entre sí, pero todas asumen el contexto de las dos primeras.

### ¿Dónde están los archivos de los que hablan las guías?

Todos los archivos analizados están en el repo:

- Workflows: `.github/workflows/`
- Dependabot: `.github/dependabot.yml`
- Docs de referencia: `docs/`
- Scripts de seguridad: `scripts/security/`

La sección "Archivos fuente" de este README tiene la tabla completa con rutas.

### ¿Qué hago si encuentro un error en una guía?

Abre un issue o un PR corrigiendo la guía. Las guías son parte del repo y siguen el mismo flujo de calidad que el código: cualquier cambio pasa por CI.

## 📖 Glosario

| Término               | Definición                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| **SAST**              | Static Application Security Testing: análisis estático del código fuente buscando vulnerabilidades      |
| **SCA**               | Software Composition Analysis: análisis de dependencias de terceros buscando vulnerabilidades conocidas |
| **SBOM**              | Software Bill of Materials: inventario machine-readable de componentes, versiones y dependencias        |
| **CodeQL**            | Motor de análisis de GitHub para SAST (lenguajes: javascript, actions, etc.)                            |
| **Trivy**             | Escáner de vulnerabilidades (SCA) de Aqua Security, usado en el job dependency-scan                     |
| **Gitleaks**          | Herramienta de detección de secrets en repositorios git                                                 |
| **Dependency Review** | Action de GitHub que revisa el diff de dependencias de un PR (vuln + licencias)                         |
| **SARIF**             | Static Analysis Results Interchange Format: formato estándar para resultados de análisis estático       |
| **CycloneDX**         | Estándar de SBOM (OWASP) en formato JSON/XML                                                            |
| **OSV Scanner**       | Escáner de vulnerabilidades de Google basado en la base de datos OSV                                    |
| **Dependabot**        | Bot de GitHub que abre PRs automáticos de actualización de dependencias                                 |
| **Drift**             | Desviación gradual: actions que se quedan stale por falta de actualización                              |
