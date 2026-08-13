# Git y YAML — Flujo de Ramas, Commits Convencionales y Sintaxis YAML desde Cero

> **Guía 01 de 5** — Nivel Fundamentos | **Prerrequisitos:** [00-que-es-cicd.md](./00-que-es-cicd.md) completado | **Siguiente:** [02-github-actions-base.md](./02-github-actions-base.md)

---

## 🎯 Objetivos de Aprendizaje

Al terminar esta guía, serás capaz de:

- [ ] **Explicar** el flujo de ramas Git profesional: `main`, `feature/*`, Pull Requests, merge strategies
- [ ] **Escribir** mensajes de commit siguiendo **Conventional Commits** (`tipo(scope): descripción`)
- [ ] **Entender** por qué el proyecto usa **Husky + commitlint** para forzar commits convencionales
- [ ] **Leer y escribir YAML** válido: escalares, listas, mapas, estructuras anidadas
- [ ] **Dominar** YAML avanzado básico: bloques multilínea (`|` y `>`), anclas y alias (`&` y `*`)
- [ ] **Conectar** YAML con GitHub Actions: leer un workflow real comentado línea por línea

---

## 📋 Prerequisitos

1. ✅ **Guía 00 completada** — Entiendes qué es CI/CD, pipeline stages, shifting left, DORA
2. ✅ **Git básico** — Sabes `clone`, `add`, `commit`, `push`, `pull`, `checkout`, `branch`
3. ✅ **Editor de código** — VS Code recomendado (resalta YAML, valida sintaxis)

> **Si no completaste la guía 00:** Vuelve a [00-que-es-cicd.md](./00-que-es-cicd.md) — los conceptos de pipeline y CI/CD se dan por sentados aquí.

---

## 🌳 Teoría: Flujo de Ramas Git y Pull Requests

### La Rama `main` es Sagrad

> **Regla de oro:** `main` **siempre** debe estar deployable. Nunca commits directos a `main`.

```
main ──────────────────────────────────────────────► (producción)
  │
  ├─► feature/login ──► PR #42 ──► merge ──► main
  │
  ├─► feature/api-v2 ──► PR #43 ──► merge ──► main
  │
  └─► fix/typo-readme ──► PR #44 ──► merge ──► main
```

### Estrategia: Trunk-Based Development (TBD) Ligero

El proyecto usa **TBD simplificado**:

| Rama        | Propósito                           | Vida útil          | Merge a       |
| ----------- | ----------------------------------- | ------------------ | ------------- |
| `main`      | Código listo para producción        | Permanente         | —             |
| `feature/*` | Una feature/chore/fix completa      | Corta (horas-días) | `main` via PR |
| `fix/*`     | Bugfix urgente                      | Muy corta          | `main` via PR |
| `release/*` | Preparación de versión (Changesets) | Días               | `main` via PR |

> **No usamos:** `develop`, `staging`, `hotfix/*` long-lived, GitFlow completo. **Por qué:** Complejidad innecesaria para equipo pequeño; TBD + feature flags + preview environments cubre las necesidades.

### Ciclo de Vida de un Pull Request

```mermaid
sequenceDiagram
    participant Dev as Desarrollador
    participant Local as Repo Local
    participant GH as GitHub
    participant CI as GitHub Actions

    Dev->>Local: git checkout -b feature/nueva-funcionalidad
    Dev->>Local: Edita código (commits convencionales)
    Dev->>Local: git push -u origin feature/nueva-funcionalidad
    Local->>GH: Crea rama remota
    Dev->>GH: Abre Pull Request → main
    GH->>CI: Dispara workflows (ci.yml, security.yml, etc.)
    CI->>GH: Reporta checks (✅/❌)
    Dev->>GH: Revisa feedback, hace push si correcciones
    CI->>GH: Re-ejecuta checks
    Note over GH: Code Review (aprobación requerida)
    Dev->>GH: Merge (Squash & Merge o Merge Commit)
    GH->>CI: Dispara CD (deploy.yml en push a main)
```

**Checks obligatorios en este repo (branch protection):**

- ✅ `ci.yml` — todos los jobs verdes
- ✅ `security.yml` — sin hallazgos críticos
- ✅ `quality.yml` — lint + format pasan
- ✅ Aprobación de al menos 1 reviewer

---

## 📝 Conventional Commits: Estándar de Mensajes

### Formato Canónico

```
<tipo>(<scope>): <descripción corta>

[cuerpo opcional]

[footer(s) opcional(es)]
```

### Tipos Principales (de `@commitlint/config-conventional`)

| Tipo       | Cuándo usarlo                                 | Ejemplo                                            |
| ---------- | --------------------------------------------- | -------------------------------------------------- |
| `feat`     | Nueva funcionalidad para el usuario           | `feat(auth): agregar login con JWT`                |
| `fix`      | Corrección de bug                             | `fix(api): manejar error 404 en /users/:id`        |
| `docs`     | Solo documentación                            | `docs(readme): actualizar instrucciones install`   |
| `chore`    | Mantenimiento, tooling, deps (no user-facing) | `chore(deps): actualizar vitest a v2`              |
| `refactor` | Cambio interno sin cambiar comportamiento     | `refactor(utils): extraer sanitizePrismaMessage`   |
| `test`     | Añadir o modificar tests                      | `test(events): agregar integration test para RSVP` |
| `perf`     | Mejora de performance                         | `perf(db): añadir índice compuesto en events`      |
| `ci`       | Cambios en CI/CD (workflows, actions)         | `ci: agregar job e2e a ci.yml`                     |
| `build`    | Sistema de build, dependencias de prod        | `build: actualizar node a 20 en Dockerfile`        |
| `style`    | Formato, punto y coma, sin cambio lógico      | `style: prettier --write apps/server`              |
| `revert`   | Revierte commit previo                        | `revert: feat(auth): agregar login con JWT`        |

### Reglas de Oro

1. **Imperativo, presente:** "agregar" no "agregado" / "agrega"
2. **Minúscula inicial:** `feat(auth): agregar login` ✅ — `Feat(auth): Agregar login` ❌
3. **Sin punto final:** `fix: corregir typo` ✅ — `fix: corregir typo.` ❌
4. **Scope opcional pero recomendado:** `feat: agregar login` ✅ — `feat(auth): agregar login` ✅✅
5. **Límite 72 chars** en primera línea (recomendación git)

### Breaking Changes

Dos formas equivalentes:

```bash
# Opción 1: Exclamación en tipo
feat(api)!: cambiar respuesta de /users a array paginado

# Opción 2: Footer BREAKING CHANGE
feat(api): cambiar respuesta de /users a array paginado

BREAKING CHANGE: La respuesta ya no es array directo, ahora { data: [], meta: {} }
```

> **Por qué importa:** Conventional Commits **habilita automatización**: changelog automático, versionado semántico (Changesets), releases automáticos, filtrado de commits por tipo.

---

## 🔧 Husky + commitlint: El Guardián Local del Proyecto

El proyecto **fuerza** Conventional Commits en **cada commit local** via Husky hooks.

### Arquitectura de Hooks

```
.git/hooks/
├── pre-commit      → lint-staged + Semgrep + Gitleaks (archivos staged)
├── commit-msg      → commitlint (valida mensaje del commit)
└── pre-push        → vitest --changed (tests solo archivos modificados vs origin/main)
```

### commitlint.config.js (Configuración Real)

```javascript
// Source: ../../../commitlint.config.js
const config = {
  extends: ['@commitlint/config-conventional'],
};

export default config;
```

**Qué hace:** Extiende la config estándar de Conventional Commits. Valida:

- Tipo válido (feat, fix, docs, chore, refactor, test, perf, ci, build, style, revert)
- Scope opcional entre paréntesis
- Dos puntos + espacio obligatorios
- Descripción no vacía
- Breaking change válido (`!` o footer)

### .husky/commit-msg (Hook Real)

```bash
# Source: ../../../.husky/commit-msg
commitlint --edit $1
```

**Flujo:** Al hacer `git commit`, Git ejecuta este script. `commitlint` lee el archivo de mensaje temporal (`$1`), valida contra config, **falla si no pasa** → commit bloqueado.

### Ejemplos de Commits Válidos/Inválidos

| Mensaje                                | ¿Pasa? | Por qué                                  |
| -------------------------------------- | ------ | ---------------------------------------- |
| `feat(auth): agregar login JWT`        | ✅     | Tipo válido, scope, descripción          |
| `fix: corregir typo en README`         | ✅     | Tipo válido, sin scope (ok), descripción |
| `chore(deps): actualizar dependencias` | ✅     | Tipo válido, scope, descripción          |
| `feat! : breaking change en API`       | ✅     | `!` breaking, espacio opcional           |
| `agregar login`                        | ❌     | Falta tipo                               |
| `feat(auth) agregar login`             | ❌     | Falta `:`                                |
| `feat(auth):`                          | ❌     | Descripción vacía                        |
| `invalid-type(auth): hacer algo`       | ❌     | Tipo no reconocido                       |

> **Tip:** Usa `git commit` sin `-m` para que se abra tu editor y puedas escribir mensaje multilínea con cuerpo y footer.

---

## 📄 YAML desde Cero: Sintaxis Completa

> **YAML** (YAML Ain't Markup Language) = serialización de datos legible por humanos. **Todo workflow de GitHub Actions es YAML.**

### 1. Escalares (Valores Simples)

```yaml
# Strings (comillas opcionales salvo caracteres especiales)
nombre: "Project One"
version: '1.0.0'
descripcion: Proyecto monorepo con CI/CD maduro
multilinea_simple: Esto es una línea
  que continúa indentada (se une con espacio)

# Números
node_version: 20
timeout_minutes: 15
porcentaje: 0.95

# Booleanos
ci_enabled: true
debug_mode: false

# Null
optional_config: ~
# o
optional_config: null
```

> **Regla:** Strings con `:`, `{`, `}`, `[`, `]`, `,`, `&`, `*`, `#`, `?`, `|`, `>`, `-`, `<`, `>`, `=`, `!`, `%`, `@`, `` ` `` **requieren comillas**.

### 2. Listas (Arrays/Sequences)

```yaml
# Estilo bloque (recomendado para legibilidad)
trigger_branches:
  - main
  - develop
  - 'release/*'

# Estilo inline (compacto)
permissions: [contents: read, checks: write]

# Lista de objetos (común en jobs.steps)
steps:
  - name: Checkout
    uses: actions/checkout@v5
  - name: Setup Node
    uses: actions/setup-node@v5
    with:
      node-version-file: '.nvmrc'
```

### 3. Mapas (Objetos/Dictionaries)

```yaml
# Clave: valor (indentación 2 espacios = estándar)
job_config:
  runs-on: ubuntu-latest
  timeout-minutes: 10
  permissions:
    contents: read
    checks: write
```

### 4. Estructuras Anidadas (La Base de Workflows)

```yaml
# jobs es un mapa donde cada clave es job_id
jobs:
  build: # job_id = "build"
    name: Build Project # nombre legible
    runs-on: ubuntu-latest # runner
    steps: # lista de steps
      - name: Checkout
        uses: actions/checkout@v5
      - name: Build
        run: npm run build

  test: # job_id = "test"
    needs: build # depende de build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - run: npm test
```

### 5. Comentarios

```yaml
# Comentario de línea completa
name: 'CI' # Comentario inline (después de valor)


# NO hay comentarios de bloque /* ... */ en YAML
```

### 6. Strings Multilínea (Clave para Scripts Shell)

```yaml
# Literal (|) — preserva saltos de línea EXACTOS
script_literal: |
  echo "Paso 1"
  echo "Paso 2"
  npm run build
  # Saltos de línea se mantienen tal cual

# Plegado (>) — une líneas con espacio, preserva párrafos vacíos
script_plegado: >
  Este es un texto largo que se escribe
  en múltiples líneas pero YAML lo une
  en una sola línea con espacios.

  Este párrafo separado SÍ se mantiene.
```

**Cuál usar en GitHub Actions:**

- `run:` con **scripts shell** → usa **`|` (literal)** para preservar líneas
- `run:` con **comando único largo** → usa **`>` (plegado)** si prefieres escribirlo en varias líneas

### 7. Anclas y Alias (`&` y `*`) — Reutilización

```yaml
# Definir ancla (&) en un mapa base
defaults: &defaults
  runs-on: ubuntu-latest
  timeout-minutes: 10
  permissions:
    contents: read

# Referenciar alias (*) en jobs
jobs:
  build:
    <<: *defaults # Merge del mapa anclado
    name: Build
    steps:
      - run: npm run build

  test:
    <<: *defaults
    name: Test
    needs: build
    steps:
      - run: npm test
```

> **En Project One:** No usamos anclas extensivamente en workflows (preferimos `defaults:` en workflow root y composite actions), pero **entenderlas es esencial** para leer workflows complejos de la industria.

### 8. Separador de Documentos (`---`)

```yaml
# Primer documento
name: 'Workflow A'
on: push

---
# Segundo documento (raro en GitHub Actions, común en Kubernetes)
name: 'Workflow B'
on: pull_request
```

> **GitHub Actions:** Un archivo `.yml` = **un solo workflow**. No uses `---` múltiples.

---

## 🔗 YAML + GitHub Actions: Workflow Real Comentado

Vamos a diseccionar las **primeras 30 líneas de `ci.yml`** (el workflow principal) conectando cada clave YAML con su propósito.

```yaml
# Source: ../../../.github/workflows/ci.yml (líneas 1-30)
name: 'CI' # String: nombre en UI GitHub Actions

permissions: # Mapa: permisos por defecto para TODOS los jobs
  contents: read #   contents: read = solo lectura repo (mínimo privilegio)

on: # Mapa: triggers (cuándo corre)
  pull_request: #   Evento: pull_request
    branches: #     Filtro: solo branches
      - main #       Solo PRs hacia main

concurrency: # Mapa: control de ejecuciones concurrentes
  group: pr-${{ github.event.pull_request.number }} #   Expresión: grupo único por PR number
  cancel-in-progress: true #   Boolean: cancela run anterior del mismo grupo

jobs: # Mapa: definición de jobs (clave = job_id)
  changes: #   job_id = "changes"
    name: Detect Changes #     String: nombre legible
    runs-on: ubuntu-latest #     String: runner GitHub-hosted
    outputs: #     Mapa: outputs que otros jobs pueden leer
      frontend: ${{ steps.filter.outputs.client }} #   Expresión: output de step "filter"
      backend: ${{ steps.filter.outputs.server }}
      e2e: ${{ steps.filter.outputs.e2e }}
      shared: ${{ steps.filter.outputs.shared }}
    timeout-minutes: 5 #     Number: timeout del job
    steps: #     Lista: pasos del job
      - uses: actions/checkout@v5 #       Step: usa action checkout v5
      - uses: dorny/paths-filter@v4 #       Step: usa action paths-filter v4
        id: filter #         String: ID del step (para referenciar outputs)
        with: #         Mapa: inputs de la action
          filters: | #           String multilínea (literal |)
            client:                           #             Mapa anidado: filtro "client"
              - 'apps/client/**'              #               Lista: patrones glob
            server:                           #             Mapa anidado: filtro "server"
              - 'apps/server/**'
            e2e:
              - 'e2e/**'
            shared:
              - 'package.json'
              - 'package-lock.json'
              - '.github/workflows/**'
```

### Mapeo YAML → Conceptos GitHub Actions

| Estructura YAML          | Concepto GitHub Actions                                                 |
| ------------------------ | ----------------------------------------------------------------------- |
| `name:` (root)           | Nombre del workflow                                                     |
| `on:`                    | Triggers (eventos que disparan)                                         |
| `jobs:`                  | Mapa de jobs (clave = `job_id`)                                         |
| `jobs.<job_id>.runs-on:` | Runner (dónde corre)                                                    |
| `jobs.<job_id>.steps:`   | Lista de steps (acciones + comandos)                                    |
| `jobs.<job_id>.needs:`   | Dependencias entre jobs                                                 |
| `jobs.<job_id>.if:`      | Condicional para saltar job                                             |
| `jobs.<job_id>.outputs:` | Outputs que propagan a jobs dependientes                                |
| `steps[i].uses:`         | Action a ejecutar (`owner/repo@version` o path local)                   |
| `steps[i].with:`         | Inputs para la action                                                   |
| `steps[i].run:`          | Comando shell a ejecutar                                                |
| `steps[i].id:`           | ID para referenciar outputs (`${{ steps.<id>.outputs.<name> }}`)        |
| `${{ ... }}`             | **Expresión** — se evalúa en runtime (contextos, funciones, operadores) |

---

## 📝 Resumen: Lo Que Has Aprendido

| Tema                     | Concepto Clave                                                                                      |
| ------------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Ramas Git**            | `main` siempre deployable; `feature/*` cortas; PR obligatorio para merge                            |
| **Pull Request**         | Gatilla CI, requiere reviews, checks obligatorios (ci.yml, security.yml, quality.yml)               |
| **Conventional Commits** | `tipo(scope): descripción` — habilita changelog, versionado semántico, releases auto                |
| **Husky + commitlint**   | Hook `commit-msg` valida **cada commit local** — config en `commitlint.config.js`                   |
| **YAML Escalares**       | Strings, números, booleanos, null — comillas para caracteres especiales                             |
| **YAML Listas**          | `- item` (bloque) o `[a, b]` (inline)                                                               |
| **YAML Mapas**           | `clave: valor` con indentación 2 espacios                                                           |
| **YAML Multilínea**      | `                                                                                                   | `literal (preserva \n),`>` plegado (une con espacios) |
| **YAML Anclas**          | `&nombre` define, `*nombre` referencia, `<<: *nombre` merge                                         |
| **Workflow YAML**        | `name`, `on`, `permissions`, `concurrency`, `jobs` con `runs-on`, `steps`, `needs`, `if`, `outputs` |

---

## ➡️ Siguiente Guía

> **[02-github-actions-base.md](./02-github-actions-base.md)** — Anatomía completa de un workflow: jobs, steps, triggers (`push`, `pull_request`, `workflow_dispatch`, `cron`), runners (`ubuntu-latest` vs self-hosted), expresiones `${{ }}` y contextos (`github`, `secrets`, `vars`, `env`, `needs`), outputs de job vs step.

---

## 🔙 Guía Anterior

> **[00-que-es-cicd.md](./00-que-es-cicd.md)** — Qué es CI/CD, pipeline stages, shifting left, DORA metrics.

## 🏠 Volver al Índice

> **[README.md](./README.md)** — Roadmap completo y navegación.

---

_Parte del cambio OpenSpec `learning-cicd-fundamentos` — Nivel Fundamentos, Guía 01 de 5_
