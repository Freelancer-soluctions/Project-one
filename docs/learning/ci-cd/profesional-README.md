# 🏆 Nivel Profesional — Guías 18 a 23

> **Ruta de aprendizaje CI/CD · Nivel 4 de 4**
> Índice del nivel **Profesional**: 6 guías (18-23) que cubren seguridad avanzada (SAST/SCA/SBOM), seguridad programada, Dependabot, mantenimiento de workflows, métricas DORA y pipelines enterprise.

Bienvenido al nivel **Profesional**, el cuarto y último nivel de la ruta de aprendizaje de CI/CD del proyecto. Si has completado los niveles **Fundamentos** (guías 00-04), **Intermedio** (guías 05-10) y **Avanzado** (guías 11-17), estás listo para el salto de **Senior a Staff**: dejarás de "operar el CI" y empezarás a **diseñar, asegurar, medir y mantener el pipeline como un activo de producción**.

En este nivel aprenderás la familia de seguridad SAST/SCA/SBOM desde cero, el modelo de seguridad de 3 niveles (pre-commit / PR / cron), la gestión rutinaria de Dependabot, la filosofía de mantenimiento de workflows ("el código se pudre"), las métricas DORA y SLSA que separan a un Senior de un Staff, y los patrones de un pipeline enterprise de referencia.

## 🎯 Objetivos de aprendizaje

Al completar este nivel serás capaz de:

1. **Explicar la familia de seguridad de aplicaciones desde cero**: SAST (CodeQL), SCA (Trivy), SBOM (Anchore), detección de secrets (Gitleaks) y Dependency Review, y leer `security.yml` de principio a fin.
2. **Operar la seguridad por cron**: el modelo de seguridad de 3 niveles (pre-commit / PR / cron), `scheduled-security.yml` (Gitleaks full-history) y `security-digest.yml` (SBOM + OSV + digest).
3. **Gestionar Dependabot de forma rutinaria**: los 3 ecosistemas (npm, github-actions, docker), la rutina mensual de revisión y por qué Dependabot evita el drift de actions.
4. **Mantener workflows con una filosofía clara**: `.nvmrc` como single source of truth, `fetch-depth: 0` opt-in, política de versionado de actions, checklist trimestral y anti-patrones.
5. **Interpretar métricas DORA y SLSA**: las 4 métricas DORA, los niveles SLSA 1-4, y dónde se ubica el proyecto (nivel 2-3).
6. **Evaluar patrones enterprise**: qué separa el CI/CD del proyecto de un pipeline enterprise de 30+ jobs, VEX, escaneo de IaC y future-proofing.

## 📋 Prerequisitos

Antes de empezar este nivel debes haber completado:

- **Nivel Fundamentos** (guías 00-04): qué es CI/CD, Git y YAML, GitHub Actions, secrets y variables, Docker básico.
- **Nivel Intermedio** (guías 05-10): husky y git hooks, walkthrough de `ci.yml`, workflows reutilizables, composite actions, caching y testing.
- **Nivel Avanzado** (guías 11-17): CD, AWS, Floci, `deploy.yml`, `preview.yml`, OIDC, ECS y Changesets.

Se asume que ya conoces los workflows del proyecto, Husky, composite actions, caching, AWS CD con Floci/ECS/OIDC y Changesets.

Si no has completado el nivel Avanzado, te recomendamos empezar por el [índice de Avanzado](./avanzado-README.md) antes de continuar.

## 🗺️ Roadmap de la ruta de aprendizaje

La ruta completa de CI/CD del proyecto tiene **4 niveles**. Este índice corresponde al nivel **Profesional**, el cuarto y último:

| Nivel           | Guías | Estado        | Contenido                                                                   |
| --------------- | ----- | ------------- | --------------------------------------------------------------------------- |
| **Fundamentos** | 00-04 | ✅ Completado | Qué es CI/CD, Git y YAML, GitHub Actions, secrets, Docker                   |
| **Intermedio**  | 05-10 | ✅ Completado | Husky, ci.yml, workflows reutilizables, composite actions, caching, testing |
| **Avanzado**    | 11-17 | ✅ Completado | CD, AWS, Floci, deploy.yml, preview.yml, OIDC, ECS, Changesets              |
| **Profesional** | 18-23 | 🟢 En curso   | Seguridad avanzada, Dependabot, mantenimiento, DORA, SLSA, enterprise       |

## 📚 Guías del nivel Profesional

| #   | Guía                                                                          | Descripción                                                          | Tiempo estimado |
| --- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------------- |
| 18  | [security.yml: SAST, SCA y SBOM](./18-security-yml-sast-sca-sbom.md)          | Familia de seguridad desde cero, 5 jobs de security.yml, permisos    | 90-120 min      |
| 19  | [Seguridad programada (cron)](./19-scheduled-security-yml.md)                 | Modelo de 3 niveles, scheduled-security.yml, security-digest.yml     | 90-120 min      |
| 20  | [Dependabot: 3 ecosistemas](./20-dependabot-3-ecosistemas.md)                 | dependabot.yml, rutina mensual, drift de actions                     | 60-90 min       |
| 21  | [Mantenimiento de workflows](./21-mantenimiento-workflows.md)                 | .nvmrc SSOT, fetch-depth opt-in, checklist trimestral, anti-patrones | 90-120 min      |
| 22  | [Métricas DORA y performance tuning](./22-dora-metrics-performance-tuning.md) | 4 métricas DORA, SLSA, tuning del pipeline, act local                | 90-120 min      |
| 23  | [Pipeline enterprise de referencia](./23-ci-enterprise-reference-pipeline.md) | 9 vs 30+ jobs, SLSA L3, VEX, IaC, future-proofing                    | 90-120 min      |

### Guías de la serie Governance / Review (existentes en el repo)

Las guías reales **18-21** que existen hoy en el repo pertenecen a la **serie de gobernanza y revisión**, y son un recorrido acumulativo hacia el enforcement de `main`:

| #   | Guía                                                       | Descripción                                                                       |
| --- | ---------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 18  | [Trunk-based development](./18-trunk-based-development.md) | Estrategia de ramas integradas, PRs pequeños y despliegue continuo                |
| 19  | [Governance Gates](./19-governance-gates.md)               | Framework de 5 niveles de enforcement: commit → PR → merge → post-merge → audit   |
| 20  | [Governance Stage](./20-governance-stage.md)               | Implementación por fases de los gates de gobernanza en el pipeline del proyecto   |
| 21  | [Code Review](./21-code-review.md)                         | La técnica de QA nº 1: por qué, 6 dimensiones, técnicas, IA, métricas, single-dev |

> ⚠️ **Nota de sincronización**: la tabla superior (18-23) es el **plan original** del nivel Profesional (matriz de seguridad/Dependabot/DORA/enterprise). La tabla de abajo refleja las **guías realmente creadas** hoy (serie governance/review). La reconciliación completa del plan pasa a otra sesión; **la guía 21 (code review) es un archivo real** y tiene la numeración coherente con la serie governance (tras la 20).

### Orden de lectura recomendado

Las guías están ordenadas de forma **acumulativa**: cada una asume los conceptos de la anterior.

1. Empieza por la **guía 18** (security.yml) — es la base de toda la seguridad del nivel.
2. Sigue con la **guía 19** (seguridad programada) — el modelo de 3 niveles que organiza todo.
3. Continúa con la **guía 20** (Dependabot) — la gestión rutinaria de dependencias.
4. Profundiza con la **guía 21** (mantenimiento) — la filosofía de mantener el pipeline.
5. Mide con la **guía 22** (DORA y performance) — los marcos Staff-level.
6. Cierra con la **guía 23** (enterprise) — el salto de escala y el wrap-up del nivel.

> **Serie governance/review (guías reales 18-21)**: si estás siguiendo la serie que existe hoy en vez del plan superior, el orden es **18** (trunk-based) → **19** (governance gates) → **20** (governance stage) → **21** (code review). La guía 21 cierra la serie de revisión: tras gobernar _qué puede entrar_ en `main`, aprendes _cómo se revisa_ bien lo que entra.

## 🔍 Descripción detallada de las guías

### Guía 18 — security.yml: SAST, SCA y SBOM

**Objetivo**: construir la base de seguridad del nivel. Aprenderás la taxonomía de seguridad de aplicaciones **desde cero** — SAST, SCA, SBOM, secrets detection y dependency review — y leerás el workflow `security.yml` de principio a fin: sus 5 jobs, triggers, concurrency y el modelo de permisos de mínimo privilegio.

**Contenido destacado**:

- Tabla comparativa SAST vs SCA vs SBOM vs secrets detection vs dependency review.
- Job `sast`: CodeQL `init@v4` + `analyze@v4`, `languages: javascript,actions`, autobuild comentado → `npm ci` manual (monorepo con workspaces).
- Job `dependency-scan`: Trivy `aquasecurity/trivy-action@0.36.0`, scan fs, severidad CRITICAL/HIGH, `exit-code: '1'` (fail-closed), `ignore-unfixed: true`, SARIF upload con `if: always()`.
- Job `sbom`: `anchore/sbom-action@v0.24.0`, CycloneDX JSON, artifact 365 días.
- Job `secrets`: Gitleaks OSS (diff scan) + licensed (gated por `${{ secrets.GIT_LEAKS }}`) + el gotcha del warning/skip silencioso.
- Job `dependency-review`: `actions/dependency-review-action@v5` (vuln + license check en PR).
- Modelo de permisos: `security-events: write` en los workflows que suben SARIF, y la excepción de `ci-enterprise.yml`.

**Hands-on**: leer `security.yml` en el repo y localizar cada job, trigger y permiso.

### Guía 19 — Seguridad programada (cron)

**Objetivo**: entender la seguridad por cron como la red de seguridad que cubre lo que el diff no ve. Aprenderás el **modelo de seguridad de 3 niveles** (pre-commit / PR / cron) como principio organizador, y desglosarás `scheduled-security.yml` y `security-digest.yml`.

**Contenido destacado**:

- El modelo de 3 niveles con diagrama mermaid: pre-commit (Husky), PR (security.yml), cron (lunes 03:00 UTC).
- `scheduled-security.yml`: cron `0 3 * * 1`, checkout `fetch-depth: 0`, Gitleaks full-history `--log-opts="--all"` → JSON + SARIF, uploads con `if: always()`.
- `security-digest.yml`: mismo cron, SBOM + OSV Scanner, digest con `scripts/security/generate-security-digest.mjs`, comment opcional en PR.
- Jobs `notify-failure`: `needs` + `if: failure()` + `issues: write` que crean issues en fallo.
- Semántica fail-closed: `continue-on-error` removido, rol de `if: always()` en uploads.

**Hands-on**: inspeccionar ambos workflows y el script de digest en el repo.

### Guía 20 — Dependabot: 3 ecosistemas

**Objetivo**: dominar la gestión rutinaria de dependencias con Dependabot. Aprenderás los 3 ecosistemas configurados en `.github/dependabot.yml`, la rutina mensual de revisión y por qué Dependabot es la defensa contra el drift de actions.

**Contenido destacado**:

- Concepto de Dependabot: PRs automáticos de dependencias y su rol en la cadena de suministro.
- Ecosistema npm: raíz, weekly lunes 03:00 UTC, grupos dev-deps minor/patch, ignore de majors react/react-dom.
- Ecosistemas github-actions (prefix `ci`) y docker (`apps/server`, prefix `ci`).
- Diferencia de cadencia npm vs github-actions (por qué las actions se priorizan).
- Rutina mensual: revisar cluster de PRs, batch-merge patch+minor, evaluar major aparte.
- Por qué Dependabot evita el drift de actions y qué pasa si `dependabot.yml` desaparece.

**Hands-on**: revisar los PRs de Dependabot abiertos y clasificarlos por tipo de bump.

### Guía 21 — Mantenimiento de workflows

**Objetivo**: adoptar la filosofía de mantenimiento "**los workflows son código y se pudren**". Aprenderás los casos reales del repo (Caso 1 EBADENGINE, Caso 2 test-reporter), las políticas de `.nvmrc`, `fetch-depth` y versionado de actions, el checklist trimestral y los anti-patrones.

**Contenido destacado**:

- Filosofía de mantenimiento (`docs/workflows-mantenimiento-guia.md` sección 1).
- `.nvmrc` como single source of truth: Caso 1 (EBADENGINE omniroute@3.8.49, commit `cf5e1bb`), propagación atómica a 9 workflows + composite.
- `fetch-depth: 0` opt-in: Caso 2 (dorny/test-reporter exit 128) y anti-patrones asociados.
- Política de versionado de actions: tags vs SHA pinning (decisión: tags + Dependabot gana).
- Gotcha del timeout de bash 120s en `.husky/pre-commit` (commits `cf5e1bb` y `32d35a8`).
- Checklist de mantenimiento trimestral (11 items de la sección 17).
- Anti-patrones: editar `.nvmrc` workflow por workflow, engines floors, `fetch-depth: 0` "por si acaso", combinar bump+workflow.

**Hands-on**: ejecutar el checklist trimestral contra el repo real.

### Guía 22 — Métricas DORA y performance tuning

**Objetivo**: medir el pipeline con los marcos Staff-level. Aprenderás las 4 métricas DORA, los niveles SLSA 1-4, y las técnicas de performance tuning del pipeline (jobs paralelos, cache hit ratio, path filtering, concurrency, composite actions, `act`).

**Contenido destacado**:

- Las 4 métricas DORA en tabla: Deployment Frequency, Lead Time for Changes, Change Failure Rate, MTTR.
- Cómo el pipeline del proyecto afecta cada métrica (conexión con `docs/cicd-plan-implementacion.md` §12).
- SLSA desde cero: niveles 1-4 y dónde se ubica el proyecto (nivel 2-3 vía provenance SBOM + OIDC + dependency review).
- Framing Staff-level: DORA y SLSA como marcadores de la transición Senior → Staff.
- Performance tuning: jobs paralelos, cache hit ratio (npm/Vitest/Playwright), path filtering (`dorny/paths-filter`), cancelación por `concurrency`, composite actions.
- `act` para dry-run local sin gastar minutos de GitHub Actions.

**Hands-on**: calcular las 4 métricas DORA del proyecto con datos reales de GitHub Actions.

### Guía 23 — Pipeline enterprise de referencia

**Objetivo**: cerrar el nivel con el salto de escala. Aprenderás qué separa el CI/CD del proyecto (9 workflows) de un pipeline enterprise de 30+ jobs, los requisitos de SLSA Level 3, VEX, el escaneo de IaC, y el future-proofing (Kubernetes, canary, feature flags, OpenTelemetry).

**Contenido destacado**:

- Tabla comparativa: 9 workflows del proyecto vs pipeline enterprise de 30+ jobs.
- El drift de conteo: 12 pre-cleanup Aug 2026 → 3 zombies eliminados → 9 workflows hoy (verificar contra el filesystem real).
- SLSA Level 3: provenance firmada, builds hermetic, entornos aislados, y qué le falta al proyecto.
- VEX: los 4 statuses (not_affected, affected, fixed, under_investigation), relación con SBOM (gap G18).
- Escaneo de IaC: el gap del proyecto (job `iac-security` comentado en `security.yml`).
- `ci-enterprise.yml` como referencia didáctica: paths `frontend/`/`backend/` inexistentes, cache miss garantizado, NO operativo.
- Future-proofing: Kubernetes/EKS, canary deploys, feature flags, OpenTelemetry.

**Hands-on**: comparar `ci-enterprise.yml` con los workflows operacionales y detectar el version drift.

### Guía 21 (real) — Code Review: Práctica, Técnica y Cultura de Revisión

**Objetivo**: dominar **la técnica de QA nº 1 de la industria** — la revisión humana del código antes de que entre a `main`. Cubre el _por qué_ (8 beneficios), las **6 dimensiones** del análisis (funcionalidad, diseño, seguridad, testing, performance, documentación), las técnicas (lectura, ejecución, incremental, walkthrough), el **rol de la IA** (no aprueba, solo comenta), las métricas (SmartBear: <400 LOC, <500 LOC/h, 60-90 min) y el caso **single-dev** real del proyecto.

**Conexión con el repo**: complementa `docs/code-review-checklist.md` (la herramienta operativa) y la serie de gobernanza (guía 19). Aplica lo que los 4 checks del ruleset **no** automatizan: el juicio humano de diseño, intención y seguridad-de-diseño.

**Hands-on**: aplicar `docs/code-review-checklist.md` a un PR propio (self-review) usando las 6 dimensiones y las reglas de severidad.

## 🧑🏫 Cómo usar este nivel

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

| Documento                                    | Contenido                                                   | Se usa en        |
| -------------------------------------------- | ----------------------------------------------------------- | ---------------- |
| `docs/workflows-mantenimiento-guia.md`       | Playbook de mantenimiento de workflows (casos, checklist)   | Guías 18-21      |
| `docs/cicd-estado-actual.md`                 | Estado actual del CI/CD (Stage 4 Security, Stage 6 Operate) | Guías 18, 19, 23 |
| `docs/cicd-plan-implementacion.md`           | Plan de implementación (§12 DORA, §16 SLSA, §19.2.3 VEX)    | Guías 22, 23     |
| `docs/security/security-enterprise-guide.md` | Guía enterprise de seguridad (SLSA, VEX, SBOM)              | Guías 22, 23     |
| `docs/aws-deploy-architecture.md`            | Arquitectura de despliegue AWS                              | Guía 23          |
| `docs/aws-cd-learning-path.md`               | Ruta pedagógica AWS: Floci → Consola → Terraform            | Guía 23          |

### Archivos fuente que analizarás

| Archivo               | Ruta                                            | Guías  |
| --------------------- | ----------------------------------------------- | ------ |
| Security pipeline     | `.github/workflows/security.yml`                | 18, 23 |
| Seguridad programada  | `.github/workflows/scheduled-security.yml`      | 19     |
| Security digest       | `.github/workflows/security-digest.yml`         | 19     |
| Dependabot            | `.github/dependabot.yml`                        | 20     |
| CI enterprise         | `.github/workflows/ci-enterprise.yml`           | 23     |
| Digest script         | `scripts/security/generate-security-digest.mjs` | 19     |
| Guía de mantenimiento | `docs/workflows-mantenimiento-guia.md`          | 18-21  |

## ❓ FAQ

### ¿Necesito conocimientos previos de seguridad para este nivel?

**No.** La guía 18 introduce la familia SAST/SCA/SBOM **desde cero**, con analogías y tablas comparativas. Si completaste los niveles anteriores, tienes el contexto de CI/CD necesario; la seguridad se construye sobre esa base. Las guías 22 y 23 hacen lo mismo con DORA, SLSA y VEX.

### ¿Qué diferencia hay entre este nivel y el Avanzado?

El nivel **Avanzado** se centra en el **CD**: cómo el código verificado se convierte en una imagen, se publica y se despliega (AWS, OIDC, ECS, Changesets). El nivel **Profesional** se centra en la **madurez del pipeline como activo**: seguridad en profundidad (SAST/SCA/SBOM), mantenimiento rutinario, métricas de rendimiento (DORA) y evaluación de patrones enterprise.

### ¿Qué es el "modelo de seguridad de 3 niveles"?

Es el principio organizador de la guía 19: la seguridad del proyecto se organiza en 3 capas complementarias — **pre-commit** (hooks de Husky locales: Semgrep + Gitleaks en staged), **PR/CI** (`security.yml` en cada PR: Trivy, CodeQL, Gitleaks diff, SBOM, Dependency Review) y **cron** (`scheduled-security.yml` + `security-digest.yml` cada lunes: Gitleaks full-history, OSV, digest). Cada capa tiene coste y cobertura distintos; juntas forman "shifting left con red de seguridad por cron".

### ¿Qué son las métricas DORA y por qué importan?

**DORA** (DevOps Research and Assessment) define 4 métricas estándar de rendimiento de entrega: **Deployment Frequency** (frecuencia de deploys), **Lead Time for Changes** (tiempo de commit a producción), **Change Failure Rate** (% de deploys que causan incidentes) y **MTTR** (tiempo de recuperación). Son el estándar de la industria para medir si el pipeline es un activo o un freno. Guía 22.

### ¿Qué es SLSA?

**SLSA** (Supply-chain Levels for Software Artifacts) es un marco de niveles 1-4 para la seguridad de la cadena de suministro: cuánta confianza puedes tener en que un artifact se construyó de forma íntegra y verificable. El proyecto se ubica en nivel 2-3 vía provenance SBOM + OIDC + dependency review. Guías 22 y 23.

### ¿Qué es VEX?

**VEX** (Vulnerability Exploitability Exchange) es un estándar para comunicar si una vulnerabilidad conocida **es explotable en tu contexto** específico. Tiene 4 statuses: `not_affected`, `affected`, `fixed` y `under_investigation`. Evita el ruido de alertas: una vuln que no afecta tu uso no debe bloquear el deploy. Guía 23.

### ¿Cuánto tiempo toma completar el nivel?

Entre **8 y 12 horas** en total, dependiendo de tu ritmo: cada guía toma entre 60 y 120 minutos (ver tabla de guías). Las guías 18 y 19 (seguridad) son las más densas porque introducen conceptos desde cero.

### ¿Puedo saltarme alguna guía?

Las guías 18 y 19 son **prerequisito** de las demás: sin la familia SAST/SCA/SBOM y sin el modelo de 3 niveles, las guías 20-23 serán difíciles de seguir. Las guías 20, 21 y 22 son más independientes entre sí, pero todas asumen el contexto de las dos primeras.

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
