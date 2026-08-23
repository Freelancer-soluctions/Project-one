## Why

El proyecto tiene un sistema CI/CD real y maduro (GitHub Actions, Docker, AWS, Floci) documentado en `docs/cicd-estado-actual.md`, `docs/cicd-plan-implementacion.md` y `docs/workflows-mantenimiento-guia.md`, pero no existe una ruta de aprendizaje didáctica que lleve a un desarrollador Junior (0-2 años, conoce JS básico, no conoce YAML, GitHub Actions, Docker ni CI/CD) desde cero hasta nivel profesional usando la implementación real del proyecto como caso de estudio. Sin esta guía, un Junior se enfrenta a 1979+ líneas de documentación técnica de estado actual sin un orden pedagógico, lo que genera fricción de onboarding y curvas de aprendizaje empinadas.

## What Changes

- Crear el directorio `docs/learning/ci-cd/` con 6 archivos markdown que forman el nivel **Fundamentos** de una guía de aprendizaje incremental de CI/CD en 4 niveles (Fundamentos → Intermedio → Avanzado → Profesional).
- `README.md`: índice del nivel Fundamentos, roadmap de los 4 niveles, prerequisitos, objetivos de aprendizaje y navegación entre guías.
- `00-que-es-cicd.md`: qué es CI vs CD, etapas de pipeline, métricas DORA, concepto de "shifting left". Enseñanza basada en analogías, conectada a `docs/cicd-plan-implementacion.md`.
- `01-git-y-yaml.md`: ramas de git, Pull Requests, Conventional Commits (el proyecto usa Husky + commitlint) y sintaxis YAML desde cero (escalares, listas, mapas, multilínea, anclas).
- `02-github-actions-base.md`: fundamentos de GitHub Actions: workflows, jobs, steps, triggers (push, pull_request, workflow_dispatch, cron), runners (ubuntu-latest vs self-hosted), expresiones (`${{ }}`), contextos, outputs de job vs step.
- `03-secrets-variables.md`: secrets vs variables de GitHub, environments, environment secrets, principio de mínimo privilegio, y cómo el proyecto usa secrets (gating con `vars.AWS_ROLE_ARN`, secrets `STAGING_*`/`PROD_*` — referenciando `docs/workflows-mantenimiento-guia.md`).
- `04-docker-basico-para-cicd.md`: Docker básico para CI/CD: Dockerfile, imágenes, multi-stage builds (el `apps/server/Dockerfile` real del proyecto), docker-compose, y el concepto de contenedor Floci (solo introducción — profundización en el cambio 3).
- **No se modifica código de aplicación**: es documentación didáctica nueva. No se duplica contenido existente de `docs/cicd-*.md` — se referencia con enlaces.

## Capabilities

### New Capabilities

- `cicd-fundamentals-guide`: Guía didáctica de nivel Fundamentos (5 guías: 00-que-es-cicd, 01-git-y-yaml, 02-github-actions-base, 03-secrets-variables, 04-docker-basico-para-cicd) con estructura pedagógica obligatoria (objetivos de aprendizaje, prerequisitos, teoría desde cero con analogías, sección de implementación en el proyecto con snippets reales citando la fuente, resumen y enlace a la siguiente guía).
- `cicd-guide-readme-index`: Archivo `README.md` índice del nivel Fundamentos con roadmap de los 4 niveles, prerequisitos, objetivos de aprendizaje, navegación entre las 6 guías y enlaces cruzados a los niveles futuros (intermedio/avanzado/profesional).

### Modified Capabilities

<!-- Ninguna: no cambian requisitos de capacidades existentes. Es documentación nueva. -->

## Impact

- **Nuevo directorio**: `docs/learning/ci-cd/` con 6 archivos markdown (README + 5 guías).
- **Sin impacto en código**: no se tocan `apps/`, `.github/workflows/`, ni dependencias.
- **Referencias (solo lectura)**: `docs/cicd-estado-actual.md`, `docs/cicd-plan-implementacion.md`, `docs/workflows-mantenimiento-guia.md`, `docs/aws-deploy-architecture.md`, `docs/aws-cd-learning-path.md`, `docs/aws-dev-local-floci.md`, `docs/aws-learning-with-floci.md`, `.github/workflows/*.yml`.
- **Convención**: documentación en español (convención del proyecto), 800-1500 líneas por guía (README.md: 200-800 líneas), tablas markdown, diagramas mermaid, bloques de código con snippets reales citando la ruta fuente.
