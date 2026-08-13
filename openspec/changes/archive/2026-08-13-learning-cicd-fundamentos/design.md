## Context

El proyecto tiene un ecosistema CI/CD real y maduro: 9 workflows en `.github/workflows/` (ci.yml, deploy.yml, preview.yml, quality.yml, release.yml, scheduled-security.yml, security-digest.yml, security.yml, ci-enterprise.yml), Dockerfile multi-stage en `apps/server/`, despliegue AWS con Floci, y documentación técnica extensa (`docs/cicd-estado-actual.md` de 1979 líneas, `docs/cicd-plan-implementacion.md` de 3149 líneas, `docs/workflows-mantenimiento-guia.md`). Esta documentación es de referencia técnica (estado actual, planes, mantenimiento) — asume que el lector ya conoce CI/CD. No existe una ruta didáctica incremental. Ver `proposal.md` para la motivación completa.

## Goals / Non-Goals

**Goals:**

- Crear el nivel Fundamentos (6 archivos en `docs/learning/ci-cd/`) de una ruta de aprendizaje de 4 niveles que lleve a un Junior de cero a profesional usando el proyecto real como caso de estudio.
- Estructura pedagógica reproducible en cada guía: objetivos → prerequisitos → teoría desde cero → implementación en el proyecto → resumen → siguiente guía.
- Guías autosuficientes en contenido didáctico pero que referencian (no copian) la documentación técnica existente.

**Non-Goals:**

- NO escribir las guías aún — este cambio solo genera los artefactos OpenSpec (proposal, specs, design, tasks).
- Niveles Intermedio (cambio `learning-cicd-intermedio`, ya creado), Avanzado (`learning-cicd-avanzado`, ya creado) y Profesional (`learning-cicd-profesional`, ya creado) están fuera del alcance de ESTE cambio pero ya existen como cambios OpenSpec adyacentes.
- NO modificar código de aplicación, workflows ni infraestructura.
- NO reescribir ni migrar `docs/cicd-*.md` existentes.

## Decisions

### D1: Enfoque pedagógico "teoría primero → implementación después"

Cada guía abre con teoría desde cero usando analogías (el lector nunca vio CI/CD), y solo después muestra cómo se materializa en el proyecto real con snippets citados.

**Por qué**: El público objetivo (Junior 0-2 años, JS básico, sin YAML/CI-CD/Docker) necesita el concepto abstracto antes del detalle concreto del repo; mostrar primero código de producción abruma. La secuencia teoría→implementación ancla cada concepto abstracto en un ejemplo real que el lector puede abrir y explorar.

**Alternativa considerada**: Solo enlazar a `docs/cicd-*.md` (cero contenido nuevo). Rechazada: esa documentación asume conocimientos previos y no tiene orden didáctico. **Alternativa considerada**: Guía única gigante. Rechazada: 800-1500 líneas por tema es el máximo manejable; una sola guía de 6000+ líneas sería inabordable.

### D2: Estructura de 4 niveles (Fundamentos → Intermedio → Avanzado → Profesional)

La ruta completa se divide en 4 cambios OpenSpec secuenciales, cada uno con su propio conjunto de guías.

**Por qué**: Descompone el aprendizaje en saltos de dificultad verificables (cada nivel es un cambio OpenSpec con specs y revisión), permite que los cambios 2-4 incorporen feedback de implementación del anterior, y da al lector hitos claros. Además cada nivel es un PR revisable independientemente.

**Distribución temática por nivel**: (1) Fundamentos: conceptos CI/CD, git+YAML, Actions base, secrets/variables, Docker básico. (2) Intermedio: workflows reales del repo en profundidad, jobs y caching, matrices. (3) Avanzado: seguridad, AWS/IAM, Floci en profundidad, quality gates. (4) Profesional: mantenimiento de pipelines, observabilidad, buenas prácticas organizacionales. El detalle exacto de 2-4 se define en sus propios cambios.

### D3: Stack de referencia (GitHub Actions + Git Hooks + AWS + Floci)

La guía enseña exactamente el stack que el proyecto usa en producción: GitHub Actions (workflows), Husky + commitlint (hooks locales), Docker multi-stage, AWS con Floci.

**Por qué**: El aprendizaje se vuelve "aprender haciendo" sobre infraestructura real del proyecto. No se inventan stacks hipotéticos. Floci se menciona en Fundamentos solo como introducción conceptual (el lector aún no tiene contexto para AWS); la profundización es del nivel Avanzado.

### D4: Anti-duplicación — enlazar en lugar de copiar

Las guías referencian `docs/cicd-estado-actual.md`, `docs/cicd-plan-implementacion.md`, `docs/workflows-mantenimiento-guia.md` y los docs AWS/Floci con enlaces relativos. Los snippets de workflows se copian en pequeño (10-40 líneas) solo cuando son material didáctico esencial y siempre citando la ruta fuente.

**Por qué**: Evita drift de documentación (dos versiones del mismo dato que se desincronizan), reduce el mantenimiento y respeta los docs existentes como fuente de verdad técnica. Un snippet didáctico corto con cita de fuente es aceptable y pedagógico; copiar secciones enteras no lo es.

**Regla práctica**: >40 líneas continuas de un archivo existente → enlace. <40 líneas con valor didáctico → snippet con cita de ruta.

### D5: Estrategia de cross-references

Cada guía enlaza: (a) a la guía anterior y siguiente del nivel (o README), (b) a los docs técnicos relevantes, (c) a los workflows reales por ruta relativa, (d) el README enlaza a los niveles futuros.

**Por qué**: Crea un grafo navegable donde el lector puede saltar de concepto a implementación real, y los niveles futuros se anuncian desde el día 1 (roadmap visible). Los enlaces relativos desde `docs/learning/ci-cd/` usan `../../` para alcanzar `docs/` y `../../../.github/workflows/` para `.github/workflows/` (p. ej. `../../cicd-estado-actual.md` y `../../../.github/workflows/ci.yml`).

### D6: Por qué 6 archivos (README + 5 guías) para este nivel

Cada guía cubre exactamente un tema con 800-1500 líneas: 5 temas + 1 índice.

**Por qué**: Es el punto dulce entre un mega-documento (inabordable, sin navegación) y 20 micro-docs (fragmentación, navegación costosa). El tamaño de 800-1500 líneas permite profundidad real con ejemplos, tablas y mermaid sin saturar al lector Junior. 5 temas = 5 PRs de contenido revisables.

**Alternativa considerada**: 3 guías más largas (2500+ líneas). Rechazada: excede la capacidad de atención y complica la revisión. **Alternativa considerada**: fusionar 03-secrets-variables en 02-github-actions-base. Rechazada: secrets/variables es un tema con su propia complejidad (environments, mínimo privilegio) y merece tratamiento propio.

### D7: Idioma español

Todo el contenido didáctico se escribe en español, siguiendo la convención de la documentación existente del proyecto.

**Por qué**: La documentación técnica del repo (docs/cicd-\*.md, guías de workflows) está en español; el público Junior objetivo del proyecto es hispanohablante. Los términos técnicos (workflow, job, step, trigger, secret, runner) se mantienen en inglés cuando son el término estándar de la industria, con explicación en español.

### D8: Estructura de cada guía (contrato pedagógico)

Toda guía del nivel sigue: `# Título` → `## Objetivos de aprendizaje` → `## Prerequisitos` → `## Teoría` (desde cero, analogías) → `## Implementación en el proyecto` (snippets con ruta fuente) → `## Resumen` → `## Siguiente guía` (enlace).

**Por qué**: Uniformidad = predecibilidad para el lector. Un Junior sabe siempre dónde está dentro de la guía. Esta estructura está formalizada en `specs/cicd-fundamentals-guide/spec.md` como requisito verificable.

### D9: Formato rico (tablas + mermaid)

Comparaciones (CI vs CD, secrets vs variables, job vs step outputs) en tablas markdown; flujos (pipeline, jerarquía workflow/job/step, ciclo de vida de PR) en diagramas mermaid.

**Por qué**: El público Junior aprende mejor con estructura visual; las tablas y diagramas mermaid son nativos de markdown/GitHub, sin dependencias externas, y renderizan en GitHub y editores.

## Risks / Trade-offs

- **[Riesgo] Drift de snippets**: los snippets copiados de workflows reales pueden quedar obsoletos si el workflow cambia → Mitigación: citar siempre la ruta fuente en el bloque de código, mantener snippets cortos (<40 líneas), y añadir una tarea de verificación de referencias (task 7.x/8.x).
- **[Riesgo] Enlaces rotos**: rutas relativas hacia `docs/` y `.github/` pueden romperse al reestructurar el repo → Mitigación: task de verificación de cross-references al final del nivel (task 7.x) y uso consistente de rutas relativas desde `docs/learning/ci-cd/`.
- **[Trade-off] Extensión 800-1500 líneas**: escribir 5 guías de hasta 1500 líneas es costoso de producir y revisar → Mitigación: cada guía es un bloque de tareas independiente (ver tasks.md), revisable por separado.
- **[Riesgo] Docs de referencia en evolución**: `docs/workflows-mantenimiento-guia.md` y los docs AWS/Floci pueden cambiar entre el diseño y la implementación → Mitigación: las guías enlazan por ruta relativa (no por contenido copiado), así el enlace sigue funcionando aunque el contenido evolucione.
- **[Riesgo] Alcance de Floci en Fundamentos**: explicar Floci a un lector que aún no conoce AWS puede confundir → Mitigación: introducción conceptual breve (qué es un contenedor de despliegue) con enlace a los docs de Floci, y promesa explícita de profundización en el nivel Avanzado.

## Migration Plan

No aplica migración de sistemas: es documentación nueva en `docs/learning/ci-cd/` sin tocar código, workflows ni infraestructura. El rollout es: este cambio (Fundamentos) → revisión → implementación de guías → siguientes cambios de nivel (Intermedio, Avanzado, Profesional) en PRs independientes. Rollback: eliminar el directorio `docs/learning/ci-cd/` (no afecta nada más).

## Open Questions

- El detalle exacto de contenido de los niveles Intermedio/Avanzado/Profesional se define en sus propios cambios OpenSpec; aquí solo se referencian por nombre para el roadmap del README.
- Las tareas 8.x/9.x de verificación (anti-duplicación y lint de markdown) dependen de qué herramientas de lint markdown estén disponibles en el repo; se resuelven en implementación sin cambiar el diseño ni las specs.

## Notas de implementación (post-verify)

> Registro de divergencias spec↔realidad detectadas en `/opsx-verify` (resultado: PASS, 0 críticas / 0 warnings) antes del archivado — SUGGESTION 2 del verify. Aprobado por el usuario: nota → commit → archive.

### N1: La spec decía "multi-stage builds"; el Dockerfile real es single-stage

- La tarea 6.3 (`tasks.md`) y la spec (`specs/cicd-fundamentals-guide/spec.md`, § multi-stage) pedían "explicar multi-stage builds desglosando el `apps/server/Dockerfile` real".
- Realidad: `apps/server/Dockerfile` es **SINGLE-STAGE** (39 líneas: `FROM node:20-alpine` → `npm ci --workspace=apps/server --ignore-scripts` → `npm prune --workspace=apps/server --omit=dev` → `COPY apps/server/. .` → `CMD ["node", "src/bin/index.js"]`).
- La guía 04 (§3, "Multi-Stage Builds — Concepto Genérico", líneas ~224 y ~804) maneja la divergencia honestamente: enseña multi-stage como concepto genérico (estándar de la industria) y explica la realidad del repo (single-stage optimizado con `npm prune --omit=dev`), con ejercicio para convertirlo a multi-stage con fines de aprendizaje.
- **Nota adicional**: `design.md` (Context, línea 3, y decisión D3, línea 40) también describe el ecosistema como "Dockerfile multi-stage en `apps/server/`" — la misma imprecisión que la spec; la guía es más precisa que el diseño.
- **Acción futura**: si se refactoriza `apps/server/Dockerfile` a multi-stage, actualizar guía 04 §3 (y corregir las referencias a multi-stage en `design.md`).

### N2: Drift de versiones de Node — `.nvmrc` (22.23.1) vs Dockerfile (`node:20-alpine`)

- `.nvmrc` = **22.23.1** (dev local + CI vía `setup-node` con `node-version-file: '.nvmrc'`); `apps/server/Dockerfile` = **`node:20-alpine`** (runtime contenedor/ECS).
- Documentado en guía 04 §6 (líneas ~586-617) con impacto potencial (features Node 22+ no disponibles en Node 20 → build pasa en CI pero falla en contenedor) y mitigación (smoke tests en el job `docker-build` dentro del contenedor Node 20).
- **Estado ago 2026**: el EOL de Node 20 (abril 2026) ya se alcanzó; Alpine 20 sigue recibiendo security patches tras EOL upstream, pero queda pendiente converger versiones: evaluar upgrade a `node:22-alpine` (o 24) con test exhaustivo y/o alinear `.nvmrc`. No automático — requiere validación de compatibilidad (musl libc, native deps).

### N3: SUGGESTION 1 (no bloqueante) — fwd-ref 404 intencional

- README (línea 289) y guía 04 (línea 859) referencian `05-husky-git-hooks.md` (nivel Intermedio), que aún no existe → enlace 404 temporal.
- **Intencional**: está marcado "(cuando se implemente)" — es un forward-reference del roadmap. El 404 desaparece al implementarse el nivel Intermedio (cambio `learning-cicd-intermedio`). No requiere acción en este cambio.
