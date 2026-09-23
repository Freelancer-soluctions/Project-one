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

> **🚨 REGLA #1 — BORRAR LA RAMA DESPUÉS DEL MERGE. Nunca reusarla.**
> Por qué: reusar = el PR se llena de commits viejos (nos pasó: 330 commits "resucitados").

| Concepto        | Regla                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| Branch lifetime | Horas a ~2 días, nunca semanas. Por qué: ramas cortas = menos conflictos                              |
| Integración     | Al menos 1 vez cada 24h. Por qué: main y tu rama no se separan mucho                                  |
| Main status     | Siempre deployable y releasable. Por qué: cualquiera puede desplegar en cualquier momento             |
| Merge method    | Squash (ÚNICO usable: merge commit bloqueado por required_linear_history; rebase-merge rompe firma)   |
| Branch deletion | OBLIGATORIA (hoy manual: botón GitHub + git branch -D; auto próximo). Por qué: evita reusar por error |
| Branch reuse    | **NUNCA** después de squash merge. Por qué: squash crea un commit nuevo y Git "olvida" los viejos     |

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
1. CREAR    → git checkout main && git pull --ff-only
                git checkout -b feat/mi-feature
                (por qué: partes siempre desde un main actualizado)

2. TRABAJAR → git commit -S -s -m "feat(scope): descripción"
                (muchos commits internos está bien)
                (por qué: -S firma, -s añade el trailer DCO)

3. PREPARAR → git checkout feat/mi-feature && git merge origin/main
                (resolver conflictos localmente)
                (por qué: merge hacia adelante permitido; rebase está prohibido)
                Si la rama ya fue squash-mergeada: NUNCA rebasear —
                borrarla y recrear desde main
                (git checkout main && git pull --ff-only && git checkout -b feat/mi-feature)

4. PUSH     → git push -u origin feat/mi-feature
                (abrir PR)
                (por qué: el PR dispara los 4 checks required)

5. MERGE    → Squash and merge en GitHub
                (1 commit limpio en main)
                (por qué: único método que pasa firma + historia lineal)

6. BORRAR   → botón "Delete branch" en GitHub +
                git branch -D feat/mi-feature && git fetch --prune
                (NUNCA reusar esta branch)
                (por qué: reusar resucita commits viejos)
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

| Tipo                 | Historia             | Commits en main      |   Firma preservada    | Nota en este repo                   |
| -------------------- | -------------------- | -------------------- | :-------------------: | ----------------------------------- |
| **Squash and merge** | Lineal               | 1 commit nuevo       |          ✅           | ÚNICO método para este repo ✅      |
| **Merge commit**     | No lineal (burbujas) | Todos los originales |          ✅           | Bloqueado (required_linear_history) |
| **Rebase and merge** | Lineal               | Todos, SHAs nuevos   | ❌ (GitHub reescribe) | Rompe verify-signatures (no usable) |

Por qué solo squash, en simple:

- Merge commit crea "burbujas" en la historia → la regla `required_linear_history` lo bloquea.
- Rebase-and-merge cambia los SHAs al reescribir → los commits quedan sin firmar y falla el check required.
- Squash deja 1 commit limpio y firmado → simple de leer y de revertir.

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

| Setting                       | Valores                                   | Nuestro                                     |
| ----------------------------- | ----------------------------------------- | ------------------------------------------- |
| `squash_merge_commit_title`   | `PR_TITLE` \| `COMMIT_OR_PR_TITLE`        | `PR_TITLE` (aplicado, no pendiente)         |
| `squash_merge_commit_message` | `PR_BODY` \| `COMMIT_MESSAGES` \| `BLANK` | `COMMIT_MESSAGES` (preserva el trailer DCO) |

**Combos válidos**:

- `(PR_TITLE, COMMIT_MESSAGES)` ← el nuestro (aplicado hoy)
- `(PR_TITLE, PR_BODY)`
- `(PR_TITLE, BLANK)`

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

**Solución**: borrar la rama y recrearla desde main (nunca rebasear una rama ya mergeada). Por qué: los guardrails impiden reescribir historia; squash + recrear es más simple y seguro.

---

## 🔗 Integración con Nuestro Stack

### Flujo completo: branch → merge

```
1. CREAR BRANCH
    git checkout main && git pull --ff-only
    git checkout -b feat/nuevo-feature
    (por qué: partes desde un main actualizado)

2. COMMIT (con todas las firmas)
    git commit -S -s -m "feat(scope): descripción"
    ├── -S  → commit signing (SSH ED25519)
    ├── -s  → DCO sign-off (Signed-off-by trailer)
    └── -m  → Conventional Commits format
    (por qué: sin firma o sin DCO el merge se bloquea)

3. MANTENER AL DÍA (si main avanzó)
    git checkout feat/nuevo-feature && git merge origin/main
    (resolver conflictos si existen)
    (por qué: merge hacia adelante permitido; rebase/force-push prohibidos)
    Si la rama ya fue squash-mergeada: borrarla y recrearla desde main,
    nunca rebasear.

4. PUSH + PR
    git push -u origin feat/nuevo-feature
    ├── PR Title Lint valida título del PR (conventional, sin mayúscula inicial)
    ├── DCO check valida Signed-off-by en commits
    ├── Commit Lint valida formato conventional
    ├── CODEOWNERS asigna reviewers
    └── 4 checks required deben estar verdes para mergear
    (por qué: solo 4 checks bloquean; el resto solo avisa)

5. SQUASH MERGE
    GitHub crea 1 commit en main:
    ├── Subject: PR title (conventional commits)
    ├── Body: commit messages originales + trailers
    └── Signed-off-by: preservado (COMMIT_MESSAGES)
    (por qué: squash = 1 commit fácil de revertir)

6. BORRAR BRANCH (obligatorio, hoy manual)
    botón "Delete branch" en GitHub +
    git branch -D feat/nuevo-feature && git fetch --prune
    (por qué: reusar resucita commits viejos)
```

### Cada herramienta y su rol

| Herramienta               | Qué valida                                                                               | Cuándo             | En squash                                | Bloquea merge               |
| ------------------------- | ---------------------------------------------------------------------------------------- | ------------------ | ---------------------------------------- | --------------------------- |
| **Commit signing (-S)**   | Autenticidad criptográfica (solo commits nuevos del PR; previos a 2026-08-01 exonerados) | Cada commit        | GitHub crea commit firmado               | ✅ Sí (verify-signatures)   |
| **DCO sign-off (-s)**     | Derecho a contribuir                                                                     | Cada commit        | Trailer preservado (COMMIT_MESSAGES)     | ✅ Sí (DCO)                 |
| **Commit Lint**           | Formato conventional commits                                                             | Cada commit (hook) | Squash commit title validado             | ✅ Sí                       |
| **PR Title Lint**         | Título PR = conventional                                                                 | PR creation/update | Squash subject = PR title                | ✅ Sí                       |
| **CODEOWNERS**            | Reviews por componente                                                                   | PR review          | N/A                                      | ✅ Sí (1 approval + review) |
| **Ruleset 21227644**      | Required checks                                                                          | Pre-merge          | Bloquea merge si falla                   | ✅ Sí                       |
| **ci-complete**           | Agregador de checks                                                                      | Pre-merge          | NO vinculado (CI_MINIMAL=true → SKIPPED) | ❌ No                       |
| **dependency-review**     | Vulns en dependencias                                                                    | PR                 | Aviso                                    | ❌ No (advisory)            |
| **zombie-workflow-guard** | Workflows borrados que regresan                                                          | PR                 | Aviso                                    | ❌ No (advisory)            |
| **ActionLint**            | Sintaxis de workflows                                                                    | PR                 | Aviso                                    | ❌ No (advisory)            |
| **SAST (Semgrep)**        | Vulnerabilidades en código                                                               | PR                 | Aviso                                    | ❌ No (advisory)            |
| **opencode-review**       | Review IA informativa                                                                    | PR                 | Comentario en el PR, no bloquea          | ❌ No (advisory)            |

> `ci-complete` está SKIPPED mientras `CI_MINIMAL=true` — no es check del ruleset, no bloquea el merge.

### La cadena de validación

```
Commit local          PR                    Merge
─────────────────     ─────────────────     ─────────────────
-S (signing)     →    Verify Commit Signatures →  GitHub firma squash (required ✅)
-s (DCO)         →    DCO check          →  trailer preservado (required ✅)
commitlint       →    Commit Lint + PR Title Lint →  squash title = PR title (required ✅)
                     CODEOWNERS review   →  review humana + 1 approval (required ✅)
                     dependency-review / ActionLint / SAST / opencode-review →  solo avisan (advisory ❌)
                     ci-complete         →  SKIPPED (CI_MINIMAL=true, no es gate)
                     ruleset 21227644    →  required checks
```

---

## ⚙️ CI/CD Implications

### CI pipeline y TBD

```
PR abierto → CI corre en pull_request trigger
  ├── CI_MINIMAL=true: SOLO governance (4 checks) + advisory (dependency-review, SAST, zombie-guard) + lints path-scoped si el path cambió
  ├── unit tests y build NO corren (jobs `if: false`, diseño incremental intencional, no bugs)
  ├── DCO check: Signed-off-by válido
  ├── PR Title Lint: título conventional
  ├── Commit Lint: formato de commits
  ├── verify-signatures: firma SSH (solo commits nuevos del PR)
  └── advisory (no bloquean): dependency-review, ActionLint, SAST, opencode-review

Merge blocked hasta: required checks + reviews pasen
(por qué: con CI_MINIMAL=true no pagamos build/tests; los tests pesados se activarían solo con CI_MINIMAL=false vía change de gobernanza)
```

### CI_MINIMAL pattern

Un subset rápido y required que da feedback rápido. Por qué: hoy CI_MINIMAL=true desactiva los tests pesados a propósito (incremental); el día que se justifique el costo se activan con CI_MINIMAL=false. Esencial para TBD porque mantiene el lifetime de branches corto.

### Required checks como gate de merge

> ⚠️ Los 4 nombres son EXACTOS — renombrar un job en ci.yml rompe el vínculo con el ruleset (lo aprendimos: los checks se vinculan por nombre).

```
Merge permitido solo cuando (4 checks required + reviews):
  ✅ Verify Commit Signatures = success
  ✅ Commit Lint (Conventional Commits) = success
  ✅ PR Title Lint = success
  ✅ DCO = success
  ✅ CODEOWNERS review approved
  ✅ ≥1 approval
  (por qué: el ruleset 21227644 solo exige estos 4 + reviews)
```

Advisory (avisan, no bloquean): dependency-review, zombie-workflow-guard,
ActionLint, SAST, opencode-review (comentario IA informativo).
`ci-complete` NO es gate: SKIPPED mientras `CI_MINIMAL=true`.

### Rulesets como governance

Ruleset 21227644 "Pre-Merge Governance Gate" (enforcement sobre ~main):

- `deletion` → nadie puede borrar la rama `main`. Por qué: main siempre existe.
- `non_fast_forward` → bloquea el force-push a main. Por qué: nadie reescribe historia.
- `required_signatures` → commits firmados y verificados (no basta firmar, GitHub debe verificarlo). Por qué: prueba quién hizo cada commit.
- `required_status_checks` → solo los 4 checks EXACTOS (ver lista arriba); renombrar un job rompe el vínculo. Por qué: el ruleset ata por nombre.
- `pull_request` → revisión obligatoria: ≥1 aprobación + CODEOWNERS + last-push approval + threads resueltos. Por qué: ningún cambio entra sin ojos.
- `required_linear_history` → historia lineal; en la práctica squash (merge commit bloqueado, rebase-merge rompe firma). Por qué: historia simple de leer.

`bypass_actors` vacío + `current_user_can_bypass: never` → nadie se salta las reglas, ni admins. Por qué: las reglas son para todos.

---

## ⚠️ Errores Comunes

### 1. Reusar branch después de squash merge

**Problema**: commits viejos reaparecen en el PR. Por qué: squash crea un SHA nuevo; los originales nunca llegaron a main.

```
PR1: feat/x → squash merge → main tiene SHA nuevo
PR2: reusas feat/x → commits viejos muestran como "nuevos"
```

**Nos pasó en serio**: reusamos la rama `ci/prebuild-stages` después de su squash merge y el PR mostró 330 commits viejos como "nuevos" (divergencia total). Fix real: borramos la rama muerta, creamos una rama nueva `ci/post-merge-fixes` desde main y re-aplicamos los fixes como commits frescos.

**Solución** (única segura en este repo):

```bash
# Borrar + recrear desde main (no rebasear, no force-push)
git checkout main && git pull --ff-only
git branch -D feat/x
git push origin --delete feat/x
git checkout -b feat/x
# re-aplicar los cambios como commits frescos
```

**Prevención**: SIEMPRE borrar la branch después de squash merge. NUNCA reusar.

### 2. Olvidar borrar la rama tras el merge

**Síntoma**: la rama sigue viva en GitHub y en local; semanas después alguien la reusa y el PR se llena de commits viejos. Por qué: `delete_branch_on_merge=false` hoy, el borrado es manual.

**Fix** (borrar ya):

```bash
# En GitHub: botón "Delete branch" del PR ya mergeado
git branch -D <rama>
git push origin --delete <rama>
git fetch --prune
```

**Prevención**: borrar justo después de cada merge (paso 8 del workflow). Auto-delete en settings viene próximo.

### 3. Branches de larga duración (>2 días)

**Problema**: merge debt, drift, conflict storms. Por qué: cuanto más vive la rama, más se separa de main.

**Solución**: feature flags para trabajo incompleto. Branches cortas = menos conflictos.

### 4. No borrar branches después de merge

**Problema**: clutter, accidental reuse, confusing history. Por qué: ramas muertas invitan a reusarlas por error.

**Solución**: botón "Delete branch" en GitHub + `git branch -D` en local después de cada merge. Auto-delete próximo.

### 5. Rama desactualizada (main avanzó)

**Problema**: PR basado en main viejo, conflictos evitables. Por qué: main se mueve rápido.

**Solución** (sin rebase, sin force-push):

```bash
git checkout <rama> && git merge origin/main
# resolver conflictos si existen
# si la rama ya fue mergeada: no actualizarla — borrarla y recrearla desde main
```

Por qué así: los guardrails prohíben reescribir historia; el merge hacia adelante es simple y seguro.

### 6. Branchear desde main viejo

**Problema**: integras código viejo. Por qué: partes de una base desactualizada.

**Solución**: SIEMPRE `git checkout main && git pull --ff-only` antes de branchear.

### 7. Committear directo a main

**Problema**: saltas review y CI. Por qué: main solo acepta cambios vía PR (ruleset lo bloquea).

**Solución**: trabaja siempre en rama + PR. Sin excepciones.

### 8. Feature flag debt

**Problema**: flags nunca retirados = complejidad permanente. Por qué: cada flag viejo es código que nadie se atreve a tocar.

**Solución**: política simple — borrar el flag cuando llegue al 100%.

---

## 🏢 Cuando el equipo crezca

Somos monorepo (`apps/client`, `apps/server`) con 1 dev hoy — estos patrones aplican cuando seamos más. Por qué cada uno en 1 línea:

- **Feature flags**: esconden trabajo incompleto en main sin ramas largas. Por qué: deploy y release van separados.
- **DORA metrics**: medir frecuencia de deploy, lead time, tasa de fallos y MTTR. Por qué: lo que se mide, mejora.
- **Merge queues futuras**: cola automática que mergea PRs en orden cuando haya muchos al día. Por qué: evita colisiones sin esfuerzo manual.

Rollback con squash (simple): kill-switch del flag (instantáneo), o `git revert <sha>` (limpio porque squash = 1 commit), o fix-forward con un PR nuevo.

Nuestra protección real (ruleset 21227644): 4 checks required (`Verify Commit Signatures`, `Commit Lint`, `PR Title Lint`, `DCO`) + 1 approval + CODEOWNERS review + historia lineal + sin force-push a main.

---

## 🛠️ Workflow Práctico Paso a Paso

### Flujo estándar (nunca commits directos a main)

```bash
# 1. Sincronizar main (por qué: partes de lo último)
git checkout main && git pull --ff-only

# 2. Crear rama (por qué: todo cambio va en rama + PR)
git checkout -b fix/nombre-corto
# (usa fix|feat|ci/ + nombre corto; ej: feat/login, ci/lint)

# 3. Commits firmados (varios OK) (por qué: sin -S/-s el merge se bloquea)
git add -A
git commit -S -s -m "fix(scope): descripción corta"
# ... más commits si hace falta ...

# 4. Si main avanzó, ponerse al día (por qué: evita conflictos grandes)
git checkout fix/nombre-corto && git merge origin/main
# resolver conflictos si existen — nunca rebase ni force-push

# 5. Push + abrir PR (por qué: el PR dispara los checks)
git push -u origin fix/nombre-corto
# Título del PR en conventional, sin mayúscula inicial (ej: "fix(ci): ...")

# 6. Esperar 4 checks verdes (por qué: bloquean el merge)
# Revisar comentarios advisory sin miedo: ActionLint / SAST / opencode-review solo avisan

# 7. Squash and merge en GitHub UI (por qué: único método válido en este repo)

# 8. BORRAR la rama (por qué: reusar resucita commits viejos)
# En GitHub: botón "Delete branch" +
git branch -D fix/nombre-corto && git fetch --prune
```

### Hotfixes

Mismo flujo pero acelerado (por qué: un hotfix también pasa por PR y checks):

```bash
git checkout main && git pull --ff-only
git checkout -b fix/urgent-bug
# fix + commit -S -s
git push -u origin fix/urgent-bug
# PR rápido → 4 checks → squash merge → borrar rama
```

### Recovering from mistakes

**Rama reusada después de squash** (síntoma: el PR muestra commits viejos como nuevos):

```bash
# Borrar + recrear desde main, re-aplicar cambios frescos
git checkout main && git pull --ff-only
git branch -D <rama>
git push origin --delete <rama>
git checkout -b <rama>
# (por qué: squash creó un SHA nuevo; la rama vieja ya no sirve)
```

**Main roto** (por qué revert es limpio: squash = 1 commit por feature):

```bash
git revert <sha>    # revierte el feature completo en 1 commit
# O fix-forward: rama nueva + PR nuevo con el fix
# O flip del feature flag si existe
```

**DCO perdido en squash**:

- Verificar `squash_merge_commit_message=COMMIT_MESSAGES` (es nuestro setting aplicado).
- Si falta el trailer, re-hacer commits con `git commit -S -s`.

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
│  ├── Commit signing (-S) → Verify Commit Signatures (required)│
│  ├── DCO sign-off (-s) → DCO check (required)                │
│  ├── commitlint → PR Title Lint → squash title (required)    │
│  ├── CODEOWNERS → review routing (required)                  │
│  └── advisory (no bloquean): dependency-review, SAST, opencode-review │
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
