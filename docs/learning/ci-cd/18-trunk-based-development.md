# 18 — Trunk-Based Development (TBD): Guía Completa

> **Guía 18 — Enterprise CI/CD** | Anterior: [17-changesets-release-yml.md](./17-changesets-release-yml.md)
>
> Trunk-Based Development es el modelo de branching que mantiene `main` siempre deployable. Esta guía cubre desde conceptos básicos hasta patrones enterprise, integrado con el stack de Project-one (commit signing, commitlint, DCO, PR Title Lint, CODEOWNERS, squash merge).

---

## 🎯 Objetivo

1. **Qué es TBD** y por qué es el estándar enterprise
2. **Cómo funciona** el flujo completo de branches
3. **Cómo se integra** con nuestro stack de CI/CD
4. **Errores comunes** y cómo evitarlos
5. **Patrones enterprise** para equipos grandes

---

## 📋 Resumen Ejecutivo

| Concepto        | Regla                                 |
| --------------- | ------------------------------------- |
| Branch lifetime | Horas a ~2 días, nunca semanas        |
| Integración     | Al menos 1 vez cada 24h               |
| Main status     | Siempre deployable y releasable       |
| Merge method    | Squash and merge (enterprise default) |
| Branch deletion | Siempre después de merge              |
| Branch reuse    | **NUNCA** después de squash merge     |

---

## 🏗️ ¿Qué es Trunk-Based Development?

TBD es un modelo donde todos los desarrolladores colaboran en una sola rama llamada `trunk` (renombrada `main` en 2020). La regla definitoria: resistir la presión de crear branches de desarrollo de larga duración usando técnicas documentadas (feature flags, branch-by-abstraction).

```
main (trunk) ─────●────●────●────●────●────●────●────
                   ↑    ↑    ↑    ↑    ↑    ↑    ↑
                  A    B    C    D    E    F    G   ← features cortas
                 (1d) (4h) (2d) (8h) (1d) (3h) (6h)
```

### Principios Fundamentales

1. **Branches cortas**: horas a ~2 días, nunca semanas
2. **Integración frecuente**: commit/merge a trunk al menos 1 vez cada 24h
3. **Main siempre deployable**: el estado acordado como "bueno"
4. **Trabajo incompleto se esconde**: feature flags, nunca branch larga

### Evolución Histórica

```
Antes de Git     →  Gitflow (2010)     →  GitHub Flow     →  TBD
(branches largas)  (5 branches)         (main + branches)  (main + branches cortas)
                   Mobile/versionado    Web apps/SaaS      CI/CD maduro
```

---

## 🔄 TBD vs Alternativas

| Dimensión                      | Gitflow                                     | GitHub Flow       | Trunk-Based                  |
| ------------------------------ | ------------------------------------------- | ----------------- | ---------------------------- |
| **Branches de larga duración** | 5 (main, develop, feature, release, hotfix) | 1 (main) + cortas | 1 (main) + opcionales cortas |
| **Lifetime de branch**         | Semanas/meses                               | Días              | Horas a ~2 días              |
| **Cadencia de release**        | Programada/versionada                       | Continua          | Continua                     |
| **Feature flags**              | Opcional                                    | Útil              | **Requerido** a escala       |
| **Merge conflicts**            | Comunes                                     | Ocasionales       | Raros                        |
| **Mejor para**                 | Móvil, libs, regulado                       | Web apps/SaaS     | CI/CD maduro, alta velocidad |
| **DORA elite**                 | No                                          | Casi              | ✅ Sí                        |

### ¿Por qué TBD en enterprise?

- **Google**: ~35k desarrolladores en un monorepo trunk
- **Meta, Microsoft**: Azure DevOps practica TBD a escala
- **DORA research**: elite performers despliegan on demand con <3 branches activas y lifetime <1 día

---

## 🌿 Branch Workflow

### El ciclo de vida de una branch

```
1. CREAR    → git checkout main && git pull
               git checkout -b feat/mi-feature

2. TRABAJAR → git commit -S -s -m "feat(scope): descripción"
               (muchos commits internos está bien)

3. PREPARAR → git fetch origin main && git rebase origin/main
               (resolver conflictos localmente)

4. PUSH     → git push -u origin feat/mi-feature
               (abrir PR)

5. MERGE    → Squash and merge en GitHub
               (1 commit limpio en main)

6. BORRAR   → git branch -d feat/mi-feature
               git push origin --delete feat/mi-feature
               (NUNCA reusar esta branch)
```

### Naming conventions

```
feat/      → nueva funcionalidad
fix/       → bug fix
docs/      → documentación
chore/     → tareas de mantenimiento
refactor/  → reestructuración sin cambio de comportamiento
test/      → tests
perf/      → optimización de rendimiento
build/     → sistema de build
ci/        → CI/CD
style/     → formato de código
revert/    → revert de un commit
```

Los prefijos son los **mismos** que Conventional Commits — alineados con commitlint y PR Title Lint.

### Una branch = Un feature = Un PR = N commits

```
feat/ci-governance (branch)
├── commit 1: feat(ci): add PR Title Lint job
├── commit 2: fix(ci): fix YAML formatting
├── commit 3: feat(ci): add DCO job
├── commit 4: fix(ci): add missing permission
├── commit 5: docs(ci): add PR template
└── commit 6: fix(ci): reviewer catch - DCO perms

                        ↓ squash merge

main: 1 commit: "feat(ci): add PR Title Lint, DCO, PR Template"
```

Los commits internos (WIP, fixups) desaparecen. Solo queda 1 commit limpio.

---

## 🔀 Merge Strategy

### Los 3 tipos de merge en GitHub

| Tipo                 | Historia             | Commits en main      |   Firma preservada    |
| -------------------- | -------------------- | -------------------- | :-------------------: |
| **Squash and merge** | Lineal               | 1 commit nuevo       |          ✅           |
| **Merge commit**     | No lineal (burbujas) | Todos los originales |          ✅           |
| **Rebase and merge** | Lineal               | Todos, SHAs nuevos   | ❌ (GitHub reescribe) |

### ¿Por qué Squash Merge en enterprise?

| Razón                              | Explicación                                      |
| ---------------------------------- | ------------------------------------------------ |
| **Main limpio**                    | 1 commit = 1 feature. Sin WIP commits            |
| **Revert fácil**                   | Revertir 1 commit = revertir todo el feature     |
| **bisect funciona**                | `git bisect` apunta directamente al feature      |
| **Historia lineal**                | Sin merge bubbles → más fácil de leer            |
| **Commit messages estandarizados** | PR title = commit message (conventional commits) |
| **Trunk-based development**        | Main siempre deployable, commits atómicos        |

### Configuración de squash merge en GitHub

```yaml
# Repo Settings → General → Pull Requests
squash_merge_commit_title: PR_TITLE # PR title = commit subject
squash_merge_commit_message: COMMIT_MESSAGES # preserva Signed-off-by trailers
```

| Setting                       | Valores                                   | Nuestro                        |
| ----------------------------- | ----------------------------------------- | ------------------------------ |
| `squash_merge_commit_title`   | `PR_TITLE` \| `COMMIT_OR_PR_TITLE`        | `PR_TITLE` (Admin-1 pendiente) |
| `squash_merge_commit_message` | `PR_BODY` \| `COMMIT_MESSAGES` \| `BLANK` | `COMMIT_MESSAGES`              |

**Combos válidos**:

- `(PR_TITLE, COMMIT_MESSAGES)` ← nuestro target
- `(PR_TITLE, PR_BODY)`
- `(PR_TITLE, BLANK)`
- `(COMMIT_OR_PR_TITLE, COMMIT_MESSAGES)` ← nuestro actual

### El problema de reusar branches con squash merge

```
PR1: feat/ci-governance → squash merge a main
  └─ main tiene: A → B → C → S1 (squash, SHA nuevo)

PR2: reusas la misma branch
  └─ Git no sabe que x1, x2, x3 ya "existen" en main
  └─ El SHA es diferente (squash creó S1, no x1+x2+x3)
  └─ PR muestra commits viejos como "nuevos" ← TU PROBLEMA ACTUAL
```

**Causa raíz**: squash merge crea un SHA nuevo. Los originales nunca llegaron a main. Reintroducir la branch = reintroducir commits viejos.

**Solución**: `git rebase main` (omite patches ya existentes por patch-id) o delete + recreate.

---

## 🔗 Integración con Nuestro Stack

### Flujo completo: branch → merge

```
1. CREAR BRANCH
   git checkout main && git pull
   git checkout -b feat/nuevo-feature

2. COMMIT (con todas las firmas)
   git commit -S -s -m "feat(scope): descripción"
   ├── -S  → commit signing (SSH ED25519)
   ├── -s  → DCO sign-off (Signed-off-by trailer)
   └── -m  → Conventional Commits format

3. REBASE (antes de PR)
   git fetch origin main
   git rebase origin/main
   (resolver conflictos si existen)

4. PUSH + PR
   git push -u origin feat/nuevo-feature
   ├── PR Title Lint valida título del PR
   ├── DCO check valida Signed-off-by en commits
   ├── commitlint valida formato conventional
   ├── CODEOWNERS asigna reviewers
   └── ci-complete gate valida todos los checks

5. SQUASH MERGE
   GitHub crea 1 commit en main:
   ├── Subject: PR title (conventional commits)
   ├── Body: commit messages originales + trailers
   └── Signed-off-by: preservado (COMMIT_MESSAGES)

6. BORRAR BRANCH
   git branch -d feat/nuevo-feature
   git push origin --delete feat/nuevo-feature
```

### Cada herramienta y su rol

| Herramienta             | Qué valida                   | Cuándo             | En squash                            |
| ----------------------- | ---------------------------- | ------------------ | ------------------------------------ |
| **Commit signing (-S)** | Autenticidad criptográfica   | Cada commit        | GitHub crea commit firmado           |
| **DCO sign-off (-s)**   | Derecho a contribuir         | Cada commit        | Trailer preservado (COMMIT_MESSAGES) |
| **commitlint**          | Formato conventional commits | Cada commit (hook) | Squash commit title validado         |
| **PR Title Lint**       | Título PR = conventional     | PR creation/update | Squash subject = PR title            |
| **CODEOWNERS**          | Reviews por componente       | PR review          | N/A                                  |
| **ci-complete**         | Todos los checks pasan       | Pre-merge          | Gate de merge                        |
| **Ruleset 21227644**    | Required checks              | Pre-merge          | Bloquea merge si falla               |

### La cadena de validación

```
Commit local          PR                    Merge
─────────────────     ─────────────────     ─────────────────
-S (signing)     →    verify-signatures  →  GitHub firma squash
-s (DCO)         →    DCO check          →  trailer preservado
commitlint       →    PR Title Lint      →  squash title = PR title
                    CODEOWNERS review   →  review humana
                    ci-complete gate    →  todos los checks
                    ruleset 21227644    →  required checks
```

---

## ⚙️ CI/CD Implications

### CI pipeline y TBD

```
PR abierto → CI corre en pull_request trigger
  ├── CI_MINIMAL: lint + unit tests + build (rápido)
  ├── DCO check: Signed-off-by válido
  ├── PR Title Lint: título conventional
  ├── commitlint: formato de commits
  ├── verify-signatures: firma SSH
  └── ci-complete gate: todos los checks pasan

Merge blocked hasta: required checks + reviews pasen
```

### CI_MINIMAL pattern

Un subset rápido y required que da feedback rápido. Tests pesados (integration, e2e) corren en paralelo o post-merge. Esencial para TBD porque mantiene el lifetime de branches corto.

### Required checks como gate de merge

```
Merge permitido solo cuando:
  ✅ ci-complete = success
  ✅ PR Title Lint = success (o skip en merge_group)
  ✅ DCO = success (o skip en merge_group)
  ✅ verify-signatures = success
  ✅ commit-lint = success
  ✅ CODEOWNERS review approved
  ✅ ≥1 approval
```

### Rulesets como governance

GitHub Rulesets enforcement:

- `require_pull_request`: obliga PR antes de merge
- `required_status_checks`: obliga checks específicos
- `require_signed_commits`: obliga firma SSH/GPG
- `require_linear_history`: obliga squash (no merge commits)
- `block_force_push`: previene force push a main
- `bypass_actors: NONE`: nadie salta las reglas

---

## ⚠️ Errores Comunes

### 1. Reusar branch después de squash merge

**Problema**: commits viejos reaparecen en el PR.

```
PR1: feat/x → squash merge → main tiene SHA nuevo
PR2: reusas feat/x → commits viejos muestran como "nuevos"
```

**Solución**:

```bash
# Opción A: rebase
git fetch origin main
git rebase origin/main
git push --force-with-lease

# Opción B: delete + recreate (mejor)
git branch -D feat/x
git checkout main && git pull
git checkout -b feat/x
```

**Prevención**: SIEMPRE borrar branch después de squash merge. NUNCA reusar.

### 2. Branches de larga duración (>2 días)

**Problema**: merge debt, drift, conflict storms.

**Solución**: feature flags para trabajo incompleto. Branches cortas = menos conflictos.

### 3. No borrar branches después de merge

**Problema**: clutter, accidental reuse, confusing history.

**Solución**: GitHub auto-delete en merge settings. O `git branch -D` después.

### 4. No hacer rebase antes de PR

**Problema**: PR basado en main stale, conflictos evitables.

**Solución**:

```bash
git fetch origin main
git rebase origin/main
# resolver conflictos
git push --force-with-lease
```

### 5. Branchear desde main stale

**Problema**: integrar código viejo.

**Solución**: SIEMPRE `git pull` antes de branchear.

### 6. Committear directo a main

**Problema**: bypass review/CI.

**Solución**: branch protection rules. Solo admin bypass con audit.

### 7. Feature flag debt

**Problema**: flags nunca retirados = complejidad permanente.

**Solución**: política de cleanup (ej: delete release flags at 100% rollout).

---

## 🏢 Patrones Enterprise

### Feature Flags como alternativa a branches largas

```
Código en main    →  deploy continuo
Feature visible   →  controlado por flag

if (featureFlag.isEnabled('new-checkout')) {
  // nuevo checkout
} else {
  // checkout actual
}
```

**Tipos de flags**:

- **Release**: ocultar features incompletas
- **Experiment**: A/B testing
- **Ops/Kill-switch**: apagar features en producción
- **Permission**: control de acceso

**Herramientas**: LaunchDarkly, Unleash, Flagsmith, Statsig, GrowthBook

**OpenFeature**: spec vendor-neutral (recomendado para evitar lock-in)

### Release strategies

| Estrategia             | Cuándo     | Cómo                                                                  |
| ---------------------- | ---------- | --------------------------------------------------------------------- |
| **Release from trunk** | CD teams   | Tag main, fix-forward                                                 |
| **Branch for release** | Versionado | Cut release branch late, cherry-pick FROM trunk, delete after release |

**Branch for release** (cuando se necesita):

```bash
# Crear release branch tarde
git checkout -b release/v2.1 <SHA-elegido>
# Cherry-pick fixes SOLO desde main (nunca al revés)
git cherry-pick <sha>
# Release, tag, delete
git tag v2.1
git branch -d release/v2.1
```

### Monorepo TBD

- Un trunk para todos los servicios
- Atomic cross-module commits
- Lock-step dependency upgrades
- Build systems dirigidos (Bazel/Buck)
- **No intentar** sin estructura de directorios global

### Rollback con squash merge

```
Opción 1: Feature flag kill-switch (instantáneo)
Opción 2: git revert <sha> (1 commit limpio, porque squash = 1 commit)
Opción 3: Fix forward (nuevo commit a main)
```

### Branch protection completa

```yaml
Required reviews:
  - require_pull_request: true
  - required_approving_review_count: 1
  - dismiss_stale_reviews: true
  - require_code_owner_reviews: true

Required status checks:
  - ci-complete
  - PR Title Lint
  - DCO
  - verify-signatures
  - Commit Lint

Other:
  - require_signed_commits: true
  - require_linear_history: true (forzar squash)
  - block_force_push: true
  - restrict_deletions: true
  - bypass_actors: NONE
```

---

## 🛠️ Workflow Práctico Paso a Paso

### Flujo estándar

```bash
# 1. Sincronizar trunk
git checkout main && git pull --ff-only

# 2. Crear branch (desde main actualizado)
git checkout -b feat/mi-feature

# 3. Trabajar (commits frecuentes, firmados)
git add -A
git commit -S -s -m "feat(scope): descripción"
# ... más commits ...

# 4. Rebase antes de PR
git fetch origin main
git rebase origin/main
# resolver conflictos si existen

# 5. Push + PR
git push -u origin feat/mi-feature
# Abrir PR en GitHub

# 6. Squash merge (en GitHub UI)

# 7. Borrar branch
git branch -d feat/mi-feature
git push origin --delete feat/mi-feature
```

### Hotfixes

Mismo flujo pero acelerado:

```bash
git checkout main && git pull
git checkout -b fix/urgent-bug
# fix + commit -S -s
git push -u origin fix/urgent-bug
# PR rápido → squash merge → delete
```

### Recovering from mistakes

**Branch reused después de squash**:

```bash
git rebase --onto origin/main <common-ancestor> <branch>
git push --force-with-lease
# O mejor: delete + recreate
```

**Main roto**:

```bash
git revert <squash-sha>    # revert limpio (1 commit)
# O flip feature flag
# O fix forward via nuevo PR
```

**DCO lost en squash**:

- Verificar `squash_merge_commit_message=COMMIT_MESSAGES`
- Si no, amend PR body o re-commit con `-s`

---

## 📊 Resumen Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    TRUNK-BASED DEVELOPMENT                    │
│                                                               │
│  main ─────●────●────●────●────●────●────●────●────          │
│             ↑    ↑    ↑    ↑    ↑    ↑    ↑                  │
│            A    B    C    D    E    F    G                    │
│           (1d) (4h) (2d) (8h) (1d) (3h) (6h)                 │
│                                                               │
│  Reglas:                                                      │
│  ├── Branch lifetime: horas a ~2 días                         │
│  ├── Integración: ≥1 vez cada 24h                             │
│  ├── Main: siempre deployable                                 │
│  ├── Merge: squash and merge                                  │
│  ├── Delete: siempre después de merge                         │
│  ├── Reuse: NUNCA después de squash                           │
│  └── Feature flags: para trabajo incompleto                   │
│                                                               │
│  Stack integration:                                           │
│  ├── Commit signing (-S) → verify-signatures                 │
│  ├── DCO sign-off (-s) → DCO check                           │
│  ├── commitlint → PR Title Lint → squash title               │
│  ├── CODEOWNERS → review routing                             │
│  └── ci-complete gate → merge gate                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔮 Futuro

- **Feature flags**: considerar OpenFeature para decouple deploy/release
- **Merge queues**: para super-escala (Google/FB-style)
- **DORA metrics**: medir deploy frequency, lead time, change-failure rate, MTTR
- **Release branches**: solo cuando sea necesario (versionado/móvil)

---

## 📚 Referencias

| Recurso                      | URL                                                                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| trunkbaseddevelopment.com    | https://trunkbaseddevelopment.com/                                                                                                                       |
| Short-lived feature branches | https://trunkbaseddevelopment.com/short-lived-feature-branches/                                                                                          |
| Monorepos TBD                | https://trunkbaseddevelopment.com/monorepos/                                                                                                             |
| GitHub merge methods         | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/about-merge-methods-on-github |
| GitHub squash options (2022) | https://github.blog/changelog/2022-08-23-new-options-for-controlling-the-default-commit-message-when-merging-a-pull-request/                             |
| GitHub Rulesets              | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets                              |
| OpenFeature                  | https://openfeature.dev/                                                                                                                                 |
| Unleash TBD guide            | https://docs.getunleash.io/guides/trunk-based-development                                                                                                |
| DORA research                | https://cloud.google.com/blog/products/devops-sre/accelerate-state-of-devops-report                                                                      |

---

## ➡️ Siguiente

> **Has completado la guía de Trunk-Based Development** — el modelo de branching que mantiene main siempre deployable, con integración frecuente y merge strategy optimizada para enterprise.

> **Índice**: [README Avanzado](./avanzado-README.md) · **Anterior**: [17-changesets-release-yml.md](./17-changesets-release-yml.md)
