## Purpose

Define el contrato de contenido, estructura y estilo pedagógico de las 5 guías del nivel Fundamentos de la ruta de aprendizaje de CI/CD, para que un desarrollador Junior pueda aprender CI/CD desde cero usando la implementación real del proyecto como caso de estudio.

## ADDED Requirements

### Requirement: Guías del nivel Fundamentos

El nivel Fundamentos SHALL contener exactamente 5 guías markdown en `docs/learning/ci-cd/`: `00-que-es-cicd.md`, `01-git-y-yaml.md`, `02-github-actions-base.md`, `03-secrets-variables.md` y `04-docker-basico-para-cicd.md`.

#### Scenario: Existen las 5 guías

- **WHEN** se inspecciona el directorio `docs/learning/ci-cd/`
- **THEN** existen los 5 archivos de guía con los nombres exactos especificados

#### Scenario: No hay guías fuera del nivel

- **WHEN** se listan los archivos del nivel Fundamentos
- **THEN** no existen guías de niveles superiores (intermedio, avanzado, profesional) en este directorio

### Requirement: Estructura obligatoria de cada guía

Cada guía SHALL seguir la estructura: objetivos de aprendizaje, prerequisitos, sección de teoría desde cero, sección de implementación en el proyecto, resumen y enlace a la siguiente guía.

#### Scenario: La guía abre con objetivos y prerequisitos

- **WHEN** se lee el inicio de cualquier guía del nivel
- **THEN** contiene una sección de objetivos de aprendizaje y una sección de prerequisitos antes del contenido teórico

#### Scenario: La guía conecta teoría con implementación real

- **WHEN** se recorre el cuerpo de la guía
- **THEN** contiene una sección de teoría desde cero y una sección que muestra la implementación real en el proyecto con snippets de código que citan la ruta fuente

#### Scenario: La guía cierra con resumen y navegación

- **WHEN** se lee el final de cualquier guía
- **THEN** contiene un resumen de lo aprendido y un enlace a la siguiente guía del nivel (o al README si es la última)

### Requirement: Contenido didáctico de 00-que-es-cicd

La guía `00-que-es-cicd.md` SHALL explicar CI vs CD, las etapas de un pipeline, las métricas DORA y el concepto de "shifting left", usando analogías y conectando con `docs/cicd-plan-implementacion.md`.

#### Scenario: Explica CI vs CD desde cero

- **WHEN** un lector sin conocimientos previos de CI/CD lee la guía
- **THEN** puede distinguir integración continua de entrega/despliegue continuo mediante definiciones y analogías

#### Scenario: Describe etapas de pipeline

- **WHEN** la guía presenta el pipeline
- **THEN** enumera sus etapas (build, test, deploy, etc.) y las ilustra con un diagrama mermaid

#### Scenario: Conecta con el plan de implementación del proyecto

- **WHEN** la guía menciona el pipeline del proyecto
- **THEN** enlaza a `docs/cicd-plan-implementacion.md` y a los workflows reales de `.github/workflows/`

### Requirement: Contenido didáctico de 01-git-y-yaml

La guía `01-git-y-yaml.md` SHALL enseñar ramas de git, Pull Requests, Conventional Commits (Husky + commitlint del proyecto) y sintaxis YAML desde cero (escalares, listas, mapas, multilínea, anclas).

#### Scenario: Enseña flujo de ramas y PRs

- **WHEN** un lector que solo conoce git básico lee la guía
- **THEN** aprende el flujo de ramas, Pull Requests y revisión de código con ejemplos

#### Scenario: Explica Conventional Commits con el setup real

- **WHEN** la guía trata los mensajes de commit
- **THEN** explica el formato Conventional Commits y muestra la configuración real de Husky y commitlint del proyecto

#### Scenario: Enseña YAML desde cero

- **WHEN** un lector que nunca escribió YAML lee la guía
- **THEN** aprende escalares, listas, mapas, bloques multilínea y anclas con ejemplos comentados

### Requirement: Contenido didáctico de 02-github-actions-base

La guía `02-github-actions-base.md` SHALL explicar workflows, jobs, steps, triggers (push, pull_request, workflow_dispatch, cron), runners (ubuntu-latest vs self-hosted), expresiones `${{ }}`, contextos y outputs de job vs step.

#### Scenario: Explica la anatomía de un workflow

- **WHEN** un lector sin experiencia en GitHub Actions lee la guía
- **THEN** distingue workflow, job y step y su jerarquía, ilustrada con un diagrama mermaid

#### Scenario: Explica triggers

- **WHEN** la guía trata los disparadores
- **THEN** explica push, pull_request, workflow_dispatch y cron con ejemplos de los workflows reales del proyecto

#### Scenario: Explica expresiones y contextos

- **WHEN** la guía trata expresiones
- **THEN** explica la sintaxis `${{ }}`, los contextos principales (github, secrets, vars, env, needs) y la diferencia entre outputs de job y de step

### Requirement: Contenido didáctico de 03-secrets-variables

La guía `03-secrets-variables.md` SHALL explicar secrets vs variables de GitHub, environments, environment secrets, el principio de mínimo privilegio y el uso real de secrets en el proyecto (gating con `vars.AWS_ROLE_ARN`, secrets `STAGING_*`/`PROD_*`), referenciando `docs/workflows-mantenimiento-guia.md`.

#### Scenario: Diferencia secrets de variables

- **WHEN** un lector lee la guía
- **THEN** entiende la diferencia entre secrets y variables de GitHub y cuándo usar cada uno

#### Scenario: Explica environments y mínimo privilegio

- **WHEN** la guía trata entornos
- **THEN** explica environments, environment secrets y el principio de mínimo privilegio con ejemplos

#### Scenario: Muestra el uso real en el proyecto

- **WHEN** la guía muestra la implementación del proyecto
- **THEN** explica el gating con `vars.AWS_ROLE_ARN` y los secrets `STAGING_*`/`PROD_*` citando `docs/workflows-mantenimiento-guia.md` y los workflows reales

### Requirement: Contenido didáctico de 04-docker-basico-para-cicd

La guía `04-docker-basico-para-cicd.md` SHALL explicar Dockerfile, imágenes, multi-stage builds (usando `apps/server/Dockerfile` real), docker-compose y el concepto de contenedor Floci (solo introducción).

#### Scenario: Explica Dockerfile e imágenes desde cero

- **WHEN** un lector sin experiencia en Docker lee la guía
- **THEN** entiende qué es una imagen, un contenedor y un Dockerfile con ejemplos

#### Scenario: Explica multi-stage builds con el Dockerfile real

- **WHEN** la guía trata multi-stage builds
- **THEN** desglosa el `apps/server/Dockerfile` real del proyecto etapa por etapa citando la ruta fuente

#### Scenario: Introduce Floci como contenedor

- **WHEN** la guía menciona Floci
- **THEN** lo introduce solo a nivel conceptual y enlaza a los docs de AWS/Floci existentes, indicando que la profundización ocurre en el nivel Avanzado

### Requirement: Estilo didáctico y formato

Las guías SHALL usar español, tono amigable de enseñanza, tablas markdown para comparaciones, diagramas mermaid para flujos, bloques de código con snippets reales citando la ruta fuente, y una extensión de 800-1500 líneas por archivo.

#### Scenario: Las guías están en español

- **WHEN** se lee cualquier guía del nivel
- **THEN** el contenido está escrito en español siguiendo la convención del proyecto

#### Scenario: Usan tablas y diagramas

- **WHEN** la guía presenta comparaciones o flujos
- **THEN** usa tablas markdown para comparaciones y diagramas mermaid para flujos de pipeline

#### Scenario: Los snippets citan su fuente

- **WHEN** la guía incluye un snippet de código del proyecto
- **THEN** el bloque de código indica la ruta del archivo fuente (p. ej. `.github/workflows/ci.yml`)

#### Scenario: Extensión dentro del rango

- **WHEN** se mide la extensión de cada guía
- **THEN** cada archivo tiene entre 800 y 1500 líneas

### Requirement: Sin duplicación de documentación existente

Las guías SHALL referenciar con enlaces la documentación existente (`docs/cicd-estado-actual.md`, `docs/cicd-plan-implementacion.md`, `docs/workflows-mantenimiento-guia.md`, docs de AWS/Floci) en lugar de copiar su contenido.

#### Scenario: Se enlaza en lugar de copiar

- **WHEN** una guía necesita contenido que ya existe en `docs/cicd-*.md` o docs de AWS/Floci
- **THEN** enlaza al documento existente en lugar de duplicar el contenido

#### Scenario: Los enlaces cruzados funcionan

- **WHEN** se validan los enlaces entre guías del nivel y hacia `docs/`
- **THEN** todas las rutas relativas apuntan a archivos existentes

#### Scenario: Los snippets cortos con valor didáctico están permitidos

- **WHEN** se incluye un snippet corto (<40 lines) con valor didáctico desde un archivo real del proyecto
- **THEN** aparece con la ruta fuente citada en el bloque de código (cite the path) — los snippets son material didáctico, no duplicación de documentación
