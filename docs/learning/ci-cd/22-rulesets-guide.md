# 22 — GitHub Rulesets: Guía Completa de Gobernanza

> **Guía 22 — Enterprise CI/CD** | Anterior: [21-code-review.md](./21-code-review.md)
>
> Los **rulesets** son la tecnología moderna de GitHub para proteger branches, tags y pushes. Reemplazan la branch protection clásica con un sistema de **múltiples reglas layering**, **visibilidad pública**, y **control granular**. Esta guía cubre TODO: conceptos, catálogo exhaustivo de reglas, bypass actors, binding con CI, configuraciones adyacentes, y el caso real de Project One.

---

## 🎯 Objetivo

1. **Qué es** un ruleset y por qué reemplaza branch protection clásica
2. **Tipos de rulesets**: branch, tag, push, merge queue
3. **Estados de enforcement**: active, disabled, evaluate
4. **Catálogo exhaustivo** de todas las reglas disponibles
5. **Bypass actors**: quién puede saltarse reglas y cómo
6. **Binding ruleset ↔ CI**: cómo se vinculan status checks
7. **Configuraciones adyacentes**: CODEOWNERS, merge settings, actions permissions
8. **Caso real**: ruleset 21227644 de Project One
9. **Cómo funciona cada regla en governance**: push-time vs merge-time, capa SAST
10. **Auditoría**: cómo verificar todo con `gh api`

---

## 📋 Resumen Ejecutivo

```
┌──────────────────────────────────────────────────────┐
│                   GITHUB RULESETS                     │
│                                                       │
│  QUÉ     → Lista nombrada de reglas (máx 75/repo)    │
│  TIPOS   → Branch / Tag / Push / Merge Queue          │
│  MODO    → Active / Disabled / Evaluate               │
│  LAYER   → Se agregan (más restrictiva gana)          │
│  BYPASS  → always / pull_request / exempt             │
│  BINDING → context=name exacto + integration_id       │
│  CONFIG  → CODEOWNERS + merge settings + permissions  │
│                                                       │
│  vs Branch Protection Clásica:                        │
│  ✓ Múltiples rulesets (no solo 1)                     │
│  ✓ Visibilidad pública                                │
│  ✓ Evaluate mode (testing sin impacto)                │
│  ✓ Metadata restrictions (author, email, message)     │
│  ✓ Push rulesets (file paths, size, extensions)       │
│  ✓ Scope: repo + org + enterprise                     │
└──────────────────────────────────────────────────────┘
```

---

## 1. Qué es un Ruleset

### 1.1 Definición

Un **ruleset** es una lista nombrada de reglas que aplica a un repository o múltiples repos en una organización. GitHub lo evalúa en **push time** y en **merge time** (PR merge). Si las reglas no se cumplen, el push o merge se bloquea.

### 1.2 Ruleset vs Branch Protection Clásica

| Dimensión              | Branch Protection Clásica        | Rulesets                                              |
| ---------------------- | -------------------------------- | ----------------------------------------------------- |
| **Simultaneidad**      | 1 regla por branch               | Múltiples rulesets por branch (se agregan)            |
| **Visibilidad**        | Solo admins pueden ver           | Anyone con read access puede ver                      |
| **Enforcement toggle** | Delete para desactivar           | Active / Disabled / Evaluate                          |
| **Scope**              | Solo repo-level                  | Repo + org-level (GHEC/Enterprise)                    |
| **Metadata control**   | No controla author/email/message | Sí — author name, email, message pattern, branch name |
| **Push restrictions**  | No existe                        | Push rulesets (file paths, extensions, size)          |
| **Layering**           | Solo 1 branch protection         | Se layering entre sí + con branch protection          |
| **Conversión**         | N/A                              | GitHub ofrece guía guiada para convertir              |

**Por qué GitHub recomienda rulesets:** "Rulesets offer more flexible ways to manage and understand protections." Razones: layering, visibilidad, evaluación sin enforcement, control de metadata, push rulesets, y soporte multi-repo a nivel org.

**Máximo permitido:** 75 rulesets por repository, 75 organization-wide rulesets.

### 1.3 Convivencia con Branch Protection

Ambos se aplican **simultáneamente**. Si branch protection dice 2 reviews y ruleset dice 3 reviews → se requieren 3 reviews (la más restrictiva gana). Las rulesets **layering sobre** branch protection.

---

## 2. Tipos de Rulesets

| Tipo                    | Target        | Descripción                                                                                                        |
| ----------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Branch ruleset**      | `branch`      | Controla interacción con branches: push, reviews, status checks, deletion, force push                              |
| **Tag ruleset**         | `tag`         | Controla interacción con tags: creation, update, deletion                                                          |
| **Push ruleset**        | `push`        | Bloquea pushes basado en file paths, extensions, size. Solo repos privados/internal. Aplica a toda la fork network |
| **Merge queue ruleset** | `merge_queue` | Merges deben ser via merge queue. Configuración: build concurrency, group size, wait time                          |

**Notas:**

- Push rulesets NO requieren branch targeting (aplican a todo push)
- Bypass en root repo se hereda por forks (push rulesets)
- Merge queue rulesets: disponibles a nivel repo (NO a nivel org)
- Branch y Tag rulesets usan **fnmatch syntax** para targeting

---

## 3. Estados de Enforcement

| Estado       | Comportamiento                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| **Active**   | Se aplica inmediatamente. Bloquea merges/pushes que no cumplan                                         |
| **Disabled** | No se aplica. Útil para testing o reglas temporalmente desactivadas                                    |
| **Evaluate** | Evalúa las reglas pero **NO bloquea**. Genera métricas en Rule Insights. Disponible en GHEC/Enterprise |

### 3.1 Condiciones de Targeting (fnmatch syntax)

- **Include patterns:** qué branches/tags proteger
- **Exclude patterns:** qué branches/tags excluir
- Múltiples criterios de targeting por ruleset

**fnmatch syntax:**
| Patron | Significado |
|---|---|
| `*` | Matchea cualquier string (NO matchea `/`) |
| `**` | Matchea recursivamente (incluye `/`) |
| `?` | Matchea un solo carácter |
| `[abc]` | Matchea caracteres en el set |
| `main` | Solo la branch main |
| `feature/**` | Todas las branches bajo feature/ |
| `qa/**/*` | Todos los branches bajo qa/ con cualquier profundidad |
| `releases/**/*` | Branches que empiezan con releases/ |

**Limitaciones fnmatch:**

- NO soporta backslash como quoting
- NO soporta complemento de charset con `^`
- NO soporta `FNM_EXTGLOB`

---

## 4. Catálogo Exhaustivo de Reglas

### 4.1 Branch/Tag Rules

| Regla                                       | Descripción                                                            |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| **Restrict creations**                      | Solo bypass users pueden crear branches/tags que matcheen el patrón    |
| **Restrict updates**                        | Solo bypass users pueden push a branches/tags que matcheen             |
| **Restrict deletions**                      | Solo bypass users pueden delete branches/tags (selected by default)    |
| **Require linear history**                  | Previene merge commits; solo squash/rebase merge                       |
| **Require deployments to succeed**          | Changes deben ser deployados a environments específicos antes de merge |
| **Require signed commits**                  | Solo commits firmados y verificados pueden push                        |
| **Require a pull request before merging**   | Todos los cambios deben ser via PR (ver sub-reglas 4.2)                |
| **Require status checks to pass**           | CI tests deben pasar antes de merge (ver sub-reglas 4.3)               |
| **Block force pushes**                      | Previene force push (enabled by default)                               |
| **Require code scanning results**           | Bloquea PR si hay alertas de severidad configurada                     |
| **Require code quality results**            | Bloquea PR si GitHub Code Quality encuentra results                    |
| **Restrict code coverage**                  | Bloquea PR si coverage < threshold o drop > threshold (preview)        |
| **Require merge queue**                     | Merges deben ser via merge queue (repo-level only)                     |
| **Require secret scanning alerts resolved** | Bloquea PR si hay secret scanning alerts abiertos (preview)            |

### 4.2 Sub-reglas de Require a Pull Request Before Merging

| Sub-regla                                          | Descripción                                             |
| -------------------------------------------------- | ------------------------------------------------------- |
| `required_approving_review_count`                  | Número de aprobaciones requeridas (0-10)                |
| `dismiss_stale_reviews_on_push`                    | Push invalida reviews previas (el diff cambió)          |
| `require_code_owner_review`                        | Owner del archivo según CODEOWNERS debe aprobar         |
| `require_last_push_approval`                       | Alguien distinto al último pusher debe aprobar          |
| `required_review_thread_resolution`                | Todos los comments deben ser resueltos                  |
| `required_extra_approval_for_unattributed_changes` | PRs de Copilot/bots sin persona requieren +1 (preview)  |
| `allowed_merge_methods`                            | Restrict merge methods: merge, squash, rebase           |
| `require_review_from_code_teams`                   | Requerir review de equipos específicos (hasta 15 teams) |
| `restrict_dismissal`                               | Quién puede dismiss reviews                             |

### 4.3 Sub-reglas de Require Status Checks to Pass

| Configuración                   | Descripción                                                      |
| ------------------------------- | ---------------------------------------------------------------- |
| `required_check.context`        | Nombre exacto del status check (coincide con job name)           |
| `required_check.integration_id` | ID de la GitHub App (15368 para GitHub Actions)                  |
| `strict`                        | Require branches to be up to date before merging (default: true) |
| `do_not_enforce_on_create`      | Permite crear branches/PRs sin que el check exista aún           |

### 4.4 Push Rules (solo repos privados/internal)

| Regla                         | Descripción                                                             |
| ----------------------------- | ----------------------------------------------------------------------- |
| **Restrict file paths**       | Bloquea pushes con cambios en paths específicos. 200 entries max        |
| **Restrict file path length** | Bloquea pushes con paths que excedan character limit                    |
| **Restrict file extensions**  | Bloquea pushes con archivos de extensiones específicas. 200 entries max |
| **Restrict file size**        | Bloquea pushes con archivos que excedan size limit                      |

### 4.5 Metadata Restrictions (Enterprise/GHEC)

| Restricción             | Configuración                             |
| ----------------------- | ----------------------------------------- |
| **Commit author name**  | Must match / must not match regex pattern |
| **Commit author email** | Must match / must not match regex pattern |
| **Commit message**      | Must match / must not match regex pattern |
| **Branch name**         | Must match / must not match regex pattern |

---

## 5. Bypass Actors

### 5.1 Qué son

**Bypass actors** son entidades que pueden saltarse las reglas de un ruleset. Son definidos por el administrador del ruleset.

### 5.2 Actores elegibles

- Repository admins, organization owners, enterprise owners
- Roles: maintain, write, o custom roles basadas en write
- Teams (excluyendo secret teams)
- GitHub Apps
- Dependabot

### 5.3 Modos de Bypass

| Modo             | Comportamiento                                                                |
| ---------------- | ----------------------------------------------------------------------------- |
| **always**       | Actor siempre puede saltar las reglas (por defecto)                           |
| **pull_request** | Actor solo puede saltar en PRs (fuerza audit trail). No aplicable a DeployKey |
| **exempt**       | Las reglas NO se ejecutan para ese actor. NO se crea bypass audit entry       |

### 5.4 Campos de Solo Lectura

- `current_user_can_bypass`: always / pull_requests_only / never / exempt
- No se puede setear; depende de la configuración del repo y del role del usuario

### 5.5 El Modo `pull_request` en Profundidad

El modo `pull_request` es el más interesante para gobernanza:

- **Fuerza** al actor a abrir un PR (audit trail completo)
- **Permite** bypass de branch protections dentro de ese PR
- **Útil** para: bots que necesitan merge directo, admins de emergencia, Dependabot
- **No aplicable** a DeployKey (DeployKey no puede abrir PRs)

---

## 6. Binding Ruleset ↔ CI (Status Checks)

### 6.1 Mecanismo de Binding

Un status check se vincula a un ruleset por:

1. **`context`**: nombre exacto del check (coincide con el `name:` del job en el workflow YAML)
2. **`integration_id`** (opcional pero recomendado): ID numérico de la GitHub App que reporta el check

```
Workflow YAML:
  jobs:
    verify-signatures:
      name: "Verify Commit Signatures"  ← Este es el 'context'

Ruleset:
  required_status_checks:
    - context: "Verify Commit Signatures"  ← Debe coincidir EXACTO
      integration_id: 15368  ← Opcional pero recomendado
```

### 6.2 Integración ID para GitHub Actions

GitHub Actions tiene `integration_id = 15368`. Este ID es el mismo para todos los jobs de un workflow. Permite que solo GitHub Actions pueda reportar ese status check.

### 6.3 Qué Pasa Si Se Renombra el Job

**El binding se rompe silenciosamente.** Si el `name:` del job en el workflow YAML cambia:

- El status check anterior desaparece del merge box
- El ruleset no puede encontrar el check → puede fallar merge o quedar sin enforcement
- **NUNCA renombrar un job que es required status check sin actualizar el ruleset simultáneamente**

### 6.4 Modos de Required Status Checks

| Modo       | Setting                           | Comportamiento                                             |
| ---------- | --------------------------------- | ---------------------------------------------------------- |
| **Strict** | Require branches to be up to date | Topic branch debe estar up-to-date con base antes de merge |
| **Loose**  | No require up-to-date             | Branch NO necesita estar up-to-date (menos builds)         |

### 6.5 Regla de Oro: Nombres Exactos

Los `name:` de los jobs en `.github/workflows/` DEBEN coincidir exactamente con los `context` en el ruleset. Renombrar un job rompe el binding en silencio. Esta es una de las razones por las que el binding de status checks es sensible a cambios aparentemente inocentes.

---

## 7. Configuraciones Adyacentes

### 7.1 CODEOWNERS

**Ubicación:** `.github/CODEOWNERS`, `docs/CODEOWNERS`, o root `CODEOWNERS`.

**Syntax:**

```
# Default owners
*                           @org/core-team

# Client
apps/client/                @org/frontend-team

# Server
apps/server/                @org/backend-team

# CI/CD
.github/                    @org/devops-team
.github/workflows/          @org/devops-team
```

**Reglas importantes:**

- La ÚLTIMA línea que matchea gana (last matching pattern)
- Owners deben tener write access explícito
- Teams deben ser visibles y tener write access
- CODEOWNERS es case-sensitive
- Debe estar en la base branch del PR para trigger reviews

**Integración con rulesets:** `require_code_owner_review` en el ruleset exige que el owner del archivo apruebe antes de merge.

### 7.2 Merge Settings

| Setting                         | Opciones                           | Impacto                  |
| ------------------------------- | ---------------------------------- | ------------------------ |
| **Squash merge commit title**   | PR_TITLE / COMMIT_MESSAGES         | Título del commit squash |
| **Squash merge commit message** | COMMIT_MESSAGES / PR_BODY / BLANK  | Body del commit squash   |
| **Merge commit title**          | PR_TITLE / MERGE_MESSAGE           | Título del merge commit  |
| **Merge commit message**        | PR_TITLE / COMMIT_MESSAGES / BLANK | Body del merge commit    |
| **Allow squash/merge/rebase**   | true/false                         | Habilita cada método     |
| **Allow auto merge**            | true/false                         | Permite auto-merge       |
| **Delete branch on merge**      | true/false                         | Borra rama tras merge    |

**GOTCHA squash + DCO:** Si PR tiene múltiples commits, `COMMIT_MESSAGES` en squash puede omitir bodies individuales (solo usa subjects). Los trailers DCO pueden perderse.

### 7.3 Actions Permissions

| Setting                  | Valor recomendado     | Descripción                           |
| ------------------------ | --------------------- | ------------------------------------- |
| **default permissions**  | read                  | GITHUB_TOKEN es read-only por defecto |
| **allowed_actions**      | allow-list o specific | Evitar `all` (supply chain risk)      |
| **sha_pinning_required** | true                  | Forzar SHA pinning de actions         |

### 7.4 Branch Protection Clásica (Legacy)

La branch protection clásica sigue existiendo pero es **vestigial** en repos que usan rulesets. Características:

- Solo 1 regla por branch
- Visibilidad solo para admins
- No tiene Evaluate mode
- No tiene push rulesets
- No tiene metadata restrictions

**Convivencia:** Ambos se aplican simultáneamente. Las rulesets layering sobre branch protection.

### 7.5 Verified Commits / Commit Signing

- `required_signatures` en ruleset exige commits firmados y verificados
- Verificación: `.commit.verification.verified == true`
- Rulesets solo verifica commits no accesibles desde otros branches

### 7.6 Security Hardening (SOC2/DORA)

| Feature                                | Evidencia                                 |
| -------------------------------------- | ----------------------------------------- |
| Required signed commits                | Integridad de código                      |
| Required status checks                 | CI pasa antes de merge                    |
| CODEOWNERS + require_code_owner_review | Review humano                             |
| Dismiss stale reviews                  | Previene aprobaciones de código obsoleto  |
| Block force pushes                     | Previene reescritura de historia          |
| Require linear history                 | Facilita rollback y auditoría             |
| Dependency review                      | Previene vulnerabilidades en dependencias |

---

## 8. Caso Real: Project One (Ruleset 21227644)

### 8.1 Configuración Actual (verificada por API)

| Campo                       | Valor                                         |
| --------------------------- | --------------------------------------------- |
| **ID**                      | 21227644                                      |
| **Nombre API**              | `Require signed commits`                      |
| **Nombre documentado**      | `Pre-Merge Governance Gate` (CONTEXT-CICD.md) |
| **Target**                  | `branch`                                      |
| **Enforcement**             | `active`                                      |
| **Condición**               | `~DEFAULT_BRANCH` (main)                      |
| **Creado**                  | 2026-08-23                                    |
| **Actualizado**             | 2026-09-02                                    |
| **current_user_can_bypass** | `pull_requests_only`                          |
| **bypass_actors**           | RepositoryRole id=5, bypass_mode=pull_request |

> **⚠️ Discrepancia documental:** La API reporta `name: "Require signed commits"` mientras que CONTEXT-CICD.md §5.1 dice "Pre-Merge Governance Gate". Verificar si el rename está pendiente en GitHub.

### 8.2 Las 6 Reglas del Ruleset

| #   | Regla                     | Configuración                              |
| --- | ------------------------- | ------------------------------------------ |
| 1   | `deletion`                | Bloquea eliminación de branches            |
| 2   | `non_fast_forward`        | Bloquea force push                         |
| 3   | `required_signatures`     | Exige commits firmados y verificados       |
| 4   | `required_status_checks`  | strict=true, 4 checks requeridos           |
| 5   | `pull_request`            | Reviews + CODEOWNERS + last push + threads |
| 6   | `required_linear_history` | Solo squash/rebase merge                   |

### 8.3 Los 4 Status Checks Requeridos

| Check                                | Job en ci.yml     | integration_id |
| ------------------------------------ | ----------------- | -------------- |
| `Verify Commit Signatures`           | verify-signatures | 15368          |
| `Commit Lint (Conventional Commits)` | commit-lint       | 15368          |
| `PR Title Lint`                      | pr-title-lint     | 15368          |
| `DCO`                                | dco               | 15368          |

### 8.4 Configuración de Reviews (pull_request)

| Flag                                               | Valor                 | Efecto                                |
| -------------------------------------------------- | --------------------- | ------------------------------------- |
| `required_approving_review_count`                  | 1                     | Mínimo 1 aprobación                   |
| `dismiss_stale_reviews_on_push`                    | true                  | Push invalida reviews previas         |
| `require_code_owner_review`                        | true                  | CODEOWNERS debe aprobar               |
| `require_last_push_approval`                       | true                  | Push final debe ser aprobado por otro |
| `required_review_thread_resolution`                | true                  | Hilos deben resolverse                |
| `required_extra_approval_for_unattributed_changes` | true                  | Commits sin autor requieren +1        |
| `allowed_merge_methods`                            | merge, squash, rebase | Los 3 métodos permitidos              |

### 8.5 Bypass Configuration

```
bypass_actors:
  - actor_id: 5           # RepositoryRole (admins)
    actor_type: RepositoryRole
    bypass_mode: pull_request  # Solo pueden bypass vía PR (audit trail)

current_user_can_bypass: pull_requests_only
```

**Interpretación:** Los repository admins pueden bypass las branch protections PERO solo abriendo un PR (no merge directo). Esto preserva el audit trail mientras permite flexibilidad operativa.

### 8.6 Branch Protection Clásica (Vestigial)

La branch protection clásica en main coexiste pero con:

- `required_status_checks`: checks vacíos
- `required_approving_review_count`: 0
- `required_signatures`: false
- `enforce_admins`: false

**El ruleset 21227644 es el enforcer real.** La branch protection clásica es overlap heredado → deuda.

---

## 9. Cómo Funciona Cada Regla en las Validaciones de Governance

Las 6 reglas del ruleset son **todas de gobernanza**, pero se agrupan por su **momento de enforcement**: push-time (bloquean el push mismo) y merge-time (bloquean el merge del PR).

```
┌─────────────────────────────────────────────────────────────────┐
│  RULESET 21227644 (enforcement: active, target: ~DEFAULT_BRANCH) │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  PUSH-TIME (bloquea el push mismo)                               │
│  ├─ 1. required_signatures   ── commits firmados+verificados     │
│  ├─ 2. non_fast_forward      ── bloquea force-push               │
│  └─ 3. deletion              ── bloquea borrar la branch         │
│                                                                  │
│  MERGE-TIME (bloquea el merge del PR)                            │
│  ├─ 4. required_status_checks ── 4 checks CI verdes (strict)     │
│  ├─ 5. pull_request          ── reviews + CODEOWNERS + threads   │
│  └─ 6. required_linear_history ── solo squash/rebase             │
│                                                                  │
│  ADYACENTE (NO en el ruleset)                                    │
│  └─ SAST Semgrep ── capa governance-adyacente (ver §9.7)         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 9.1 `required_signatures` — integridad en la raíz (push-time)

**Cómo funciona:** GitHub rechaza el push **antes de que llegue al remoto** si algún commit nuevo no tiene `.commit.verification.verified == true`. Es la validación más temprana de la cadena: nada entra a `main` sin firma.

**Capa CI complementaria (job `verify-signatures`):** el ruleset valida la firma nativamente, pero desde 2026-08-01 `ci.yml` añadió una **verificación programática adicional** vía REST API con `compare/base...head`, que re-verifica solo los commits nuevos del PR y aplica **grandfathering** (commits anteriores al rollout NO fallan). Esto es defense-in-depth: firma nativa del ruleset + verificación explícita del job.

**Si falla:** push rechazado en firma nativa; en PR, el check `Verify Commit Signatures` queda rojo y el ruleset bloquea el merge.

### 9.2 `non_fast_forward` — protección del historial (push-time)

**Cómo funciona:** rechaza cualquier push que no sea fast-forward a la branch protegida. Impide reescribir historia (force-push con `-f`, `git push --force`, amend + pull conflictivo, rebase forzado).

**Relación con CI:** no necesita job asociado — es enforcement nativo del ruleset, siempre activo. Protege la integralidad de lo que ya pasó el gate de firma y CI.

### 9.3 `deletion` — ciclo de vida de la branch (push-time)

**Cómo funciona:** bloquea la eliminación de la branch protegida (tanto `git push origin :main` como la UI de GitHub). Junto con `non_fast_forward`, garantiza que `main` sea **inmutable**: no se borra, no se reescribe.

**Por qué es governance:** si la branch pudiera borrarse, todo el enforcement anterior (firma + CI) sería trivialmente evadible — se borra y se recrea sin historial. `deletion` cierra esta vía.

### 9.4 `required_status_checks` — el gate de CI (merge-time) ⭐

**Cómo funciona:** en el momento del merge, GitHub exige que los 4 checks estén **verdes**. El binding es por dos campos:

```
required_status_checks:
  strict: true                     # la branch debe estar up-to-date con base
  required_status_checks:
    - context: "Verify Commit Signatures"           # job verify-signatures
      integration_id: 15368                         # GitHub Actions
    - context: "Commit Lint (Conventional Commits)" # job commit-lint
      integration_id: 15368
    - context: "PR Title Lint"                       # job pr-title-lint
      integration_id: 15368
    - context: "DCO"                                 # job dco
      integration_id: 15368
```

**Las 4 validaciones que exige (todas BLOCKING desde 2026-08-31):**

| Check                                | Job en ci.yml     | Qué valida                                                                                 | Bloqueo                               |
| ------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------ | ------------------------------------- |
| `Verify Commit Signatures`           | verify-signatures | Firma SSH verificada de commits NUEVOS del PR (con grandfathering)                         | exit 1 si falla                       |
| `Commit Lint (Conventional Commits)` | commit-lint       | Mensajes del PR cumplen `type(scope): description` vía commitlint                          | exit 1                                |
| `PR Title Lint`                      | pr-title-lint     | Título del PR sigue Conventional Commits (patrón `^(?![A-Z]).+$`, tipos incluyen `ops`)    | BLOCKING (continue-on-error removido) |
| `DCO`                                | dco               | Cada commit del PR tiene `Signed-off-by:` (KineticCafe/actions-dco, bot policy well-known) | BLOCKING (continue-on-error removido) |

**Nuance clave de `strict=true`:** además de checks verdes, la topic branch debe estar **up-to-date con la base**. Si `main` avanzó tras el último CI run, el merge se bloquea hasta re-correr CI sobre la base nueva — evita que el gate se salte con builds obsoletos.

### 9.5 `pull_request` — el gate humano (merge-time)

**Cómo funciona:** configura las condiciones de review que deben cumplirse antes del merge.

| Flag                                              | Valor                 | Validación que impone                                                          |
| ------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------ |
| `dismiss_stale_reviews_on_push`                   | true                  | Un push nuevo invalida aprobaciones previas (el diff cambió → se re-aprueba)   |
| `require_code_owner_review`                       | true                  | El CODEOWNERS del path modificado debe aprobar                                 |
| `require_last_push_approval`                      | true                  | Nadie puede mergear su propio último push — alguien distinto tiene que aprobar |
| `required_review_thread_resolution`               | true                  | Ningún hilo de comentarios puede quedar abierto                                |
| `required_approving_review_count`                 | 1                     | Mínimo una aprobación                                                          |
| `require_extra_approval_for_unattributed_changes` | true                  | Commits sin autor atribuible (bots/Copilot) exigen aprobación extra            |
| `allowed_merge_methods`                           | merge, squash, rebase | Restringe los botones de merge disponibles                                     |

**Secuencia de validación humana:** aprobación mínimo 1 → CODEOWNERS aprueba si toca su path → el último pusher no puede aprobar su propio push → todos los hilos resueltos → si hay commits de bot, aprobación extra.

### 9.6 `required_linear_history` — historial lineal (merge-time)

**Cómo funciona:** bloquea la creación de **merge commits** en la branch protegida. Solo se permite squash o rebase merge. Combinado con `squash_merge_commit_title=PR_TITLE` + `squash_merge_commit_message=COMMIT_MESSAGES` (merge settings, §7.2), el historial de `main` queda plano: 1 commit por PR con el título del PR.

**Por qué es governance:** garantiza que la **trazabilidad PR→commit** se conserve (el squash hereda el título del PR) y facilita auditoría/rollback. Gotcha conocido: el squashing multi-commit puede omitir trailers DCO individuales — por eso `release.yml` re-verifica la firma del tip post-merge (validación adicional fuera del ruleset).

### 9.7 La Capa SAST — governance adyacente (NO ligada al ruleset hoy)

> ⚠️ **Discrepancia documental ya registrada:** CONTEXT-CICD.md §9.3.9 describe un job `SAST (Semgrep)` como existente en `ci.yml`. Al verificar el código real (grep en `.github/workflows/ci.yml`), **el job NO existe**. La doc describe el **plan** (change `ci-sast-governance`), no el estado implementado. `pre-merge-gates-governance.md` L473 ya la registró.

**Estado REAL hoy:**

| Capa                                       | Dónde                                                                                                                | Estado                                               |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **L1 — Semgrep local (staged)**            | `.husky/pre-commit` → `npm run sast:semgrep` → `scripts/security/semgrep-staged.ps1` (Docker)                        | ✅ Activo en dev                                     |
| **L3 — `security.yml:sast` (CodeQL)**      | Job `sast` → `name: "SAST - CodeQL"`, `github/codeql-action/init@v4` + `analyze@v4`, `languages: javascript,actions` | ⛔ Workflow `disabled_manually` (NO corre en GitHub) |
| **L3 — `ci.yml:sast` (Semgrep, planeado)** | Capability del change `ci-sast-governance` (activo en `openspec/changes/`)                                           | 📋 NO implementado (F1 pendiente)                    |

**Por qué SAST es governance pero NO está en el ruleset:**

- El ruleset solo liga los 4 checks de §9.4. SAST (como `dependency-review`, §7.6) es capa de **seguridad governance** — no status check requerido (§7 regla 6 de CONTEXT-CICD: dependency-review/SAST son SECURITY, no GOVERNANCE).
- Regla doble: un job que NO está en `ci-complete.needs` ni en el ruleset puede ser standalone sin romper el agregador (precedente `dependency-review` — ver CONTEXT-CICD §9.3.5).

**Plan F1 → F2 (change `ci-sast-governance`):**

1. **F1 (non-blocking):** nuevo job `SAST (Semgrep)` en `ci.yml` — imagen `semgrep/semgrep:1.176.1` (pin), 9 packs inline (`p/owasp-top-ten`, `p/security-audit`, `p/secrets`, `p/nodejs`, `p/expressjs`, `p/sql-injection`, `p/command-injection`, `p/react`, `p/xss`) + `--config .semgrep/rules` custom (cargadas antes que los packs), `--baseline-commit` diff-scoped contra `base.sha`, `--severity ERROR --fail-on error`, `continue-on-error: true`, **NO gated por `CI_MINIMAL`**, fuera de `ci-complete.needs`, clasificado visualmente en substage 2A Governance (header YAML, no en aggregator).
2. **F2 (blocking):** tras ≥1 run exitoso, **PATCH manual al ruleset 21227644** añadiendo `"SAST (Semgrep)"` como 5º required status check (spec `ruleset-expansion` del change). El `name:` del job DEBE coincidir EXACTO con el `context` del ruleset (regla de oro §6.5).

**Si SAST Semgrep llegara F2 (binding futuro):** el check `SAST (Semgrep)` pasaría a exigirse como los otros 4 — con `continue-on-error: true` en F1, el job reporta warning sin bloquear; en F2 se elimina el continue-on-error y se liga al ruleset como 5º check REQUIRED-BLOCKING, replicando el recorrido de `pr-title-lint` y `dco` (primero informativos, luego bloqueantes).

### 9.8 Flujo Completo: Cómo se Encadena la Validación

```
DEV → push (commits firmados)
        │
        ▼
  PUSH-TIME (ruleset, eventos nativos)
  ├─ required_signatures ── sin firma verificada → RECHAZADO
  ├─ non_fast_forward    ── force-push → RECHAZADO
  └─ deletion            ── delete branch → RECHAZADO
        │
        ▼
  PR → main (jobs CI corren)
  ├─ Verify Commit Signatures ── re-verifica commits nuevos (grandfathering)
  ├─ Commit Lint ── Conventional Commits
  ├─ PR Title Lint ── título Convencional
  ├─ DCO ── Signed-off-by en cada commit
  └─ ⏳ SAST Semgrep (F1 planeado, no-bloqueante; F2 futuro)
        │
        ▼
  MERGE-TIME (ruleset)
  ├─ required_status_checks ── los 4 verdes + branch up-to-date (strict)
  ├─ pull_request ── 1 aprobación + CODEOWNERS + last-push + threads + extra-attribution
  └─ required_linear_history ── solo squash/rebase
        │
        ▼
  Merge OK → squash PR_TITLE + COMMIT_MESSAGES → main (lineal)
```

**Resumen:** el ruleset pone **3 candados en el push** (integridad + historial) y **3 candados en el merge** (CI + humano + linealidad). Los 4 checks que reporta `ci.yml` son la implementación CI de las reglas `required_status_checks` y `pull_request`; las reglas `required_signatures`, `non_fast_forward`, `deletion` y `required_linear_history` son enforcement nativo de GitHub sin job asociado. SAST Semgrep es la capa de seguridad governance **planeada** para sumarse como 5º check en F2 — hoy solo vive como hook local (L1) y en un workflow deshabilitado (CodeQL).

---

## 10. Auditoría y Verificación con `gh api`

### 10.1 Verificar Rulesets Activos

```bash
gh api repos/{owner}/{repo}/rulesets \
  --jq '.rulesets[] | {id, name, target, enforcement}'
```

### 10.2 Detalle de un Ruleset Específico

```bash
gh api repos/{owner}/{repo}/rulesets/{id} \
  --jq '{name, enforcement, target, conditions, rules, bypass_actors, current_user_can_bypass}'
```

### 10.3 Branch Protection Clásica

```bash
gh api repos/{owner}/{repo}/branches/main/protection \
  --jq '{required_status_checks, required_approving_review_count, required_signatures, enforce_admins}'
```

### 10.4 Merge Settings

```bash
gh api repos/{owner}/{repo} \
  --jq '{allow_squash_merge, allow_merge_commit, allow_rebase_merge, allow_auto_merge, delete_branch_on_merge, squash_merge_commit_title, squash_merge_commit_message}'
```

### 10.5 Actions Permissions

```bash
gh api repos/{owner}/{repo}/actions/permissions \
  --jq '{enabled, allowed_actions}'
```

### 10.6 Verificar Nombres de Jobs (Binding)

```bash
# Encontrar todos los name: de jobs en ci.yml
grep -E '^\s+name:' .github/workflows/ci.yml
```

---

## 11. Anti-Patterns

| Anti-Pattern                              | Problema                              | Solución                                                          |
| ----------------------------------------- | ------------------------------------- | ----------------------------------------------------------------- |
| **Renombrar job sin actualizar ruleset**  | Binding se rompe silenciosamente      | Siempre actualizar `context` en ruleset al renombrar              |
| **Usar `allowed_actions: all`**           | Supply chain risk                     | Usar allow-list + SHA pinning                                     |
| **Sin `integration_id` en status checks** | Cualquier App puede reportar el check | Siempre incluir `integration_id: 15368`                           |
| **Branch protection + ruleset duplicado** | Confusión sobre quién enforce         | Mantener ruleset como source of truth, marcar classic como legacy |
| **Sin `dismiss_stale_reviews_on_push`**   | Reviews de código obsoleto pasan      | Siempre habilitar en gobernanza                                   |
| **Sin `require_last_push_approval`**      | Último push puede auto-aprobarse      | Habilitar para audit trail completo                               |

---

## 12. Reglas de Oro para Project One

1. **Leer CONTEXT-CICD.md §7** antes de crear cualquier change de CI/CD
2. **NO renombrar** jobs que son required status checks sin actualizar el ruleset
3. **NO activar** CI_MINIMAL o jobs `if: false` sin change OpenSpec que justifique
4. **Clasificar** todo change en UN solo dominio: GOVERNANCE / SECURITY / DEPLOY / AUDIT
5. **Commits SIEMPRE firmados** (`git commit -S`, ED25519 dedicada)
6. **Verificar con `gh api`** antes de asumir estado — no confiar en docs viejas

---

## 13. Fuentes Oficiales

| Tema                          | URL                                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| About rulesets                | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets                            |
| Available rules               | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets              |
| Creating rulesets             | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository        |
| Managing rulesets             | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/managing-rulesets-for-a-repository        |
| Converting branch protections | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/converting-branch-protections-to-rulesets |
| Rules API (repos)             | https://docs.github.com/en/rest/repos/rules                                                                                                            |
| CODEOWNERS                    | https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners                  |
| Merge queue                   | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue      |
| Ruleset recipes               | https://github.com/github/ruleset-recipes                                                                                                              |

---

## 14. Glosario

| Término            | Definición                                                                |
| ------------------ | ------------------------------------------------------------------------- |
| **Ruleset**        | Lista nombrada de reglas que protegen branches/tags/pushes                |
| **Layering**       | Comportamiento donde múltiples rulesets se agregan (más restrictiva gana) |
| **Enforcement**    | Estado de aplicación: active, disabled, evaluate                          |
| **Bypass actor**   | Entidad que puede saltarse las reglas de un ruleset                       |
| **Binding**        | Vinculación entre status check de CI y required_status_checks del ruleset |
| **Context**        | Nombre exacto del status check en el ruleset (coincide con job name)      |
| **Integration ID** | ID numérico de la GitHub App que reporta el check (15368 para Actions)    |
| **fnmatch**        | Syntax de patrones para targeting de branches/tags                        |
| **Push ruleset**   | Ruleset que restringe pushes basado en file paths, extensions, size       |
| **Evaluate mode**  | Estado que evalúa reglas sin bloquear (testing sin impacto)               |
