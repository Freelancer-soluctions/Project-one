## Context

El proyecto tiene un ecosistema CI/CD maduro con 9 workflows en `.github/workflows/` (ci.yml, quality.yml, security.yml, scheduled-security.yml, security-digest.yml, deploy.yml, preview.yml, release.yml, ci-enterprise.yml), una composite action (setup-monorepo), Dependabot configurado en `.github/dependabot.yml`, y documentación técnica extensa (`docs/cicd-estado-actual.md` de 1979 líneas con Stage 4 Security y Stage 6 Operate/Monitor, `docs/cicd-plan-implementacion.md` de 3149 líneas con §12 DORA/SLSA/VEX, `docs/workflows-mantenimiento-guia.md` con el playbook completo de mantenimiento). Esta documentación es de referencia técnica y asume conocimientos; los niveles Fundamentos (00-04), Intermedio (05-10) y Avanzado (11-17) de la ruta didáctica ya están diseñados en cambios OpenSpec previos (`learning-cicd-fundamentos`, `learning-cicd-intermedio`, `learning-cicd-avanzado`). Ver `proposal.md` para la motivación completa.

## Goals / Non-Goals

**Goals:**

- Crear el nivel Profesional (6 guías 18-23 + `profesional-README.md`) que complete la ruta de 4 niveles, llevando al lector de "operar el CI" a "diseñar, asegurar, medir y mantener el pipeline como activo de producción" (nivel Staff).
- Enseñar la familia SAST/SCA/SBOM/Secrets/Dependency Review desde cero usando `.github/workflows/security.yml` como caso real de 5 jobs.
- Enseñar el modelo de seguridad de 3 niveles (pre-commit / PR / cron) como principio organizador, usando `scheduled-security.yml` y `security-digest.yml`.
- Enseñar DORA, SLSA y VEX como los marcos que marcan la transición Senior → Staff, conectando con `docs/cicd-plan-implementacion.md`.
- Enseñar la filosofía de mantenimiento de workflows usando `docs/workflows-mantenimiento-guia.md` como fuente intensiva (Casos 1-2, checklist trimestral, anti-patrones).
- Cerrar la ruta con un wrap-up de graduación en `profesional-README.md` que conecte los 4 niveles.

**Non-Goals:**

- NO escribir las guías aún — este cambio solo genera los artefactos OpenSpec (proposal, specs, design, tasks).
- NO modificar código de aplicación, workflows, Dependabot ni infraestructura.
- NO reescribir ni migrar `docs/cicd-*.md`, `docs/workflows-mantenimiento-guia.md` ni `docs/aws-*.md`.
- NO implementar mejoras de seguridad reales en el pipeline (p. ej. no añadir VEX real, no crear IaC scan) — el nivel solo enseña; los gaps se documentan como learning.
- NO duplicar el contenido de `docs/security/security-enterprise-guide.md` — se referencia para SLSA/VEX en profundidad.

## Decisions

### D1: Continuidad con los niveles previos (numeración 18-23, mismo estilo)

El nivel continúa la numeración secuencial (Fundamentos 00-04 → Intermedio 05-10 → Avanzado 11-17 → Profesional 18-23) y reutiliza el mismo contrato pedagógico (objetivos → prerequisitos → teoría → implementación → resumen → siguiente guía), el idioma español y el rango de 800-1500 líneas por guía.

**Por qué**: La ruta es un solo artefacto de aprendizaje; romper el patrón en el último nivel confundiría al lector. La continuidad formal refuerza la sensación de progresión (cada nivel es "más de lo mismo, más profundo"). Se verifica contra `specs/cicd-professional-guide/spec.md` y los cambios previos `learning-cicd-fundamentos` e `learning-cicd-intermedio`.

**Alternativa considerada**: Nivel con formato distinto (ej. sin numeración, estilo "handbook" técnico). Rechazada: rompe el contrato pedagógico establecido y dificulta la navegación entre niveles.

### D2: Conceptos de seguridad (SAST/SCA/SBOM) introducidos desde cero

La guía 18 no asume ningún background de seguridad: define SAST, SCA, SBOM, secrets detection y dependency review desde sus fundamentos (qué problema resuelven, qué detectan, dónde se ubican en la cadena de suministro) antes de mostrar el workflow real.

**Por qué**: El lector del nivel Avanzado domina CI/CD y AWS pero puede no conocer la taxonomía de seguridad de aplicaciones. La familia SAST/SCA/SBOM es el vocabulario del nivel Profesional; sin definirlo desde cero el walkthrough de `security.yml` sería ruido técnico. Sigue el mismo principio "teoría primero → implementación después" de los niveles previos.

**Alternativa considerada**: Asumir que el lector ya conoce los términos (solo nombrarlos). Rechazada: el objetivo del nivel es enseñar SecOps desde la base; nombrar sin explicar crea falsa competencia.

### D3: Uso intensivo de `docs/workflows-mantenimiento-guia.md` como fuente

La guía 21 (mantenimiento) se construye sobre el playbook real: Caso 1 (EBADENGINE omniroute@3.8.49 → `.nvmrc` SSOT), Caso 2 (dorny/test-reporter exit 128 → `fetch-depth: 0` opt-in), la política de versionado de actions (tags vs SHA pinning, decisión ago 2026), el gotcha del timeout bash 120s, el checklist trimestral (11 items, sección 17) y los anti-patrones (sección 18).

**Por qué**: El documento ya contiene los incidentes reales con formato (Síntoma, Causa, Fix, Propagación, Lección). Reutilizarlo evita duplicación y ancla el aprendizaje en la historia real del repo. Las guías 18-19 también referencian las secciones 13 (security workflows), 16 (permissions) y 7 (third-party actions).

**Regla aplicada**: >40 líneas continuas de un archivo existente → enlace; <40 líneas con valor didáctico → snippet con cita de ruta (misma regla D4 del nivel Fundamentos).

### D4: DORA + SLSA + VEX como conceptos Staff-level con framing explícito Senior → Staff

Las guías 22-23 presentan DORA, SLSA y VEX como los marcadores de la transición de Senior (ejecuta el pipeline) a Staff (diseña, asegura, mide y mejora el pipeline). Cada concepto se explica desde cero y se conecta con el estado real del proyecto (`docs/cicd-plan-implementacion.md` §12 DORA, §16 Técnicas Avanzadas + §2 Glosario (SLSA), §19.2.3 gap G18 (VEX); `docs/cicd-estado-actual.md` Stage 6).

**Por qué**: El objetivo declarado del nivel es la graduación a práctica Staff. Nombrar explícitamente los marcos que diferencian niveles de experiencia (respaldado por `docs/nivel-experiencia-analisis.md`, que sitúa el pipeline security en nivel Senior) da al lector un mapa de qué debe dominar para avanzar. DORA conecta el CI/CD con métricas de negocio (deploys frecuentes, lead time, fallos, MTTR); SLSA conecta con integridad de cadena de suministro; VEX con comunicación de vulnerabilidad explotable.

### D5: Modelo de seguridad de 3 niveles (pre-commit / PR / cron) como principio organizador

La guía 19 organiza toda la seguridad del proyecto en un modelo de 3 niveles: (1) **pre-commit** — hooks de Husky locales (Semgrep + Gitleaks en staged, `.husky/pre-commit`); (2) **PR/CI** — `security.yml` en cada PR (Trivy SCA, CodeQL SAST, Gitleaks diff, SBOM, Dependency Review); (3) **cron** — `scheduled-security.yml` + `security-digest.yml` cada lunes (Gitleaks full-history, OSV, digest consolidado).

**Por qué**: Es el patrón real del proyecto (documentado en `docs/cicd-estado-actual.md` Stage 4 y en `docs/cicd-plan-implementacion.md` como "shifting left con red de seguridad por cron"). Presentarlo como modelo con diagrama mermaid da al lector un marco mental reutilizable en cualquier repo: detección temprana (barata) + detección profunda programada (cubre lo que el diff no ve). Cada capa tiene coste y cobertura distintos; el modelo explica por qué las tres coexisten.

**Alternativa considerada**: Explicar cada workflow por separado sin modelo unificador. Rechazada: pierde la lección principal del nivel — la seguridad no es un workflow, es una estrategia en capas.

### D6: `ci-enterprise.yml` como pipeline de referencia didáctico, no operativo

La guía 23 usa `ci-enterprise.yml` (8 jobs: changes, install, lint, type-check, test, build, dependency-audit, codeql) como herramienta de enseñanza de "qué es un pipeline enterprise de 30+ jobs". Se aclara explícitamente que los paths `frontend/` y `backend/` NO existen en este monorepo (usamos `apps/client`, `apps/server`), lo que causa un **cache miss garantizado** en cada run (gap A3 de `docs/cicd-estado-actual.md`), y que por tanto NO es un workflow operativo aquí.

**Por qué**: Es el workflow que el repo ya tiene como referencia de arquitectura enterprise. Usarlo evita inventar un ejemplo hipotético y permite contrastar el CI real del proyecto (9 workflows, paths `apps/*`) contra el patrón enterprise (paths `frontend/`/`backend/`, job `install` central, coverage gate). El gotcha del cache miss se convierte en lección: nunca copiar patrones sin validar que los paths existen.

**Alternativa considerada**: Ignorar `ci-enterprise.yml` por no ser operativo. Rechazada: es precisamente el material didáctico ideal para enseñar el salto de escala, y el gotcha enseña a verificar supuestos.

### D7: README final con wrap-up de graduación de los 4 niveles

`profesional-README.md` incluye una sección final de wrap-up que recorre los 4 niveles (Fundamentos → Intermedio → Avanzado → Profesional), resume lo logrado en cada uno y conecta la ruta completa en un camino de maestría CI/CD de Junior a Staff.

**Por qué**: La ruta es un programa de aprendizaje completo, no 4 documentos sueltos. El wrap-up actúa como ceremonia de graduación: cierra el círculo, da sentido a todo el recorrido y ofrece siguientes pasos (contribuir a los workflows, proponer mejoras de seguridad, seguir con `docs/cicd-plan-implementacion.md`). Sin él, el nivel final termina sin conclusión emocional ni direccional.

### D8: Cross-references — LINK, no copiar

Las guías 18-23 referencian por enlaces relativos: `docs/workflows-mantenimiento-guia.md` (uso intensivo), `docs/cicd-estado-actual.md`, `docs/cicd-plan-implementacion.md`, `docs/security/security-enterprise-guide.md`, `docs/aws-deploy-architecture.md`, `docs/aws-cd-learning-path.md`, y los workflows reales por ruta. Los snippets se copian en pequeño (10-40 líneas) solo con valor didáctico y siempre citando la ruta fuente.

**Por qué**: Evita drift de documentación (dos versiones del mismo dato) y respeta los docs técnicos como fuente de verdad. La regla práctica del nivel Fundamentos (D4) se mantiene: >40 líneas → enlace; <40 líneas → snippet con cita.

### D9: Performance tuning con `act` para dry-run local

La guía 22 introduce `act` (ej. `act -j quality -W .github/workflows/quality.yml`) como técnica para validar cambios de workflow localmente sin gastar minutos de GitHub Actions, y lo conecta con el checklist trimestral (`docs/workflows-mantenimiento-guia.md` sección 17 item 5).

**Por qué**: El coste de GitHub Actions es un tema de nivel Staff (minutos, caches, concurrencia). `act` permite iterar rápido y barato antes de un PR; es además una herramienta citada en la guía de mantenimiento del repo. Enseñarlo cierra el tema de performance: no solo se optimiza el pipeline, se optimiza el flujo de desarrollo del propio pipeline.

## Risks / Trade-offs

- **[Riesgo] Drift de snippets**: los snippets de `security.yml`, `scheduled-security.yml`, `security-digest.yml` y `dependabot.yml` pueden quedar obsoletos si esos archivos cambian → Mitigación: citar siempre la ruta fuente, mantener snippets cortos (<40 líneas) y tarea de verificación de referencias (tasks 8.x/9.x).
- **[Riesgo] Enlaces rotos**: rutas relativas hacia `docs/` y `.github/` pueden romperse al reestructurar el repo → Mitigación: task 8.1 de verificación de cross-references y uso consistente de rutas relativas desde `docs/learning/ci-cd/`.
- **[Riesgo] Contenido de seguridad profundo mal explicado**: SAST/SCA/SBOM/SLSA/VEX son temas densos; explicarlos mal genera falsa confianza → Mitigación: teoría primero desde cero con analogías, cada concepto conectado a su implementación real en el repo, y enlaces a `docs/security/security-enterprise-guide.md` para profundización.
- **[Trade-off] Extensión 800-1500 líneas**: 6 guías de hasta 1500 líneas es costoso de producir y revisar → Mitigación: cada guía es un bloque de tareas independiente (tasks.md), revisable por separado.
- **[Riesgo] `ci-enterprise.yml` confundido con workflow operativo**: el lector podría intentar "arreglar" el cache miss → Mitigación: la guía 23 lo declara explícitamente como referencia didáctica no operativa (D6) y documenta el gotcha como lección, no como bug a corregir.
- **[Riesgo] Docs de referencia en evolución**: `docs/workflows-mantenimiento-guia.md`, `docs/cicd-*.md` y los docs AWS pueden cambiar entre diseño e implementación → Mitigación: las guías enlazan por ruta relativa (no copian contenido), así los enlaces siguen funcionando aunque el contenido evolucione.
- **[Riesgo] `docs/learning/ci-cd/` ausente**: `docs/learning/ci-cd/` aún no existe en disco — ninguno de los 4 niveles tiene guías implementadas. Esta es la implementación inicial; coordinar el orden de aplicación de los 4 cambios en el orquestador (recomendado: fundamentos → intermedio → avanzado → profesional).

## Migration Plan

No aplica migración de sistemas: es documentación nueva en `docs/learning/ci-cd/` sin tocar código, workflows, Dependabot ni infraestructura. Rollout: este cambio (Profesional) → revisión → implementación de guías 18-23 + README. Rollback: eliminar los 7 archivos nuevos (`profesional-README.md` + guías 18-23) — no afecta nada más; los niveles previos (00-17) permanecen intactos.

## Open Questions

- Ninguna pendiente: las decisiones de diseño (D1-D9) cubren estructura, contenido, fuentes y framing. Los detalles finos de redacción de cada guía se resuelven en implementación sin cambiar specs ni tasks.
