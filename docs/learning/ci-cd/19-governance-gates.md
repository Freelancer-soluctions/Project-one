# 19 — Governance Gates: Framework Enterprise de Control CI/CD

> **Guía 19 — Enterprise CI/CD** | Anterior: [18-trunk-based-development.md](./18-trunk-based-development.md)
>
> Governance gates son puntos de enforcement a través del ciclo de vida del software delivery. Esta guía define el framework completo: commit-level, PR-level, merge-level, post-merge, y audit/recovery gates.

---

## 🎯 Objetivo

1. **Qué son** governance gates y por qué existen
2. **Los 5 niveles** de gates en el ciclo de vida
3. **Cómo configurarlos** con GitHub Rulesets
4. **Compliance mapping** con SOC2/ISO27001
5. **Anti-patterns** y cómo evitarlos

---

## 📋 Resumen Ejecutivo

```
COMMIT → PR → MERGE → POST-MERGE → AUDIT
  │       │      │         │           │
  │       │      │         │           └─ Audit log, compliance evidence
  │       │      │         └──────────── Health checks, rollback, feature flags
  │       │      └────────────────────── Required checks, rulesets, linear history
  │       └───────────────────────────── PR lint, template, CODEOWNERS, reviews
  └───────────────────────────────────── Signing, DCO, commitlint, hooks
```

---

## 🏗️ Los 5 Niveles de Gates

### Nivel 1: COMMIT LEVEL

**Propósito**: Validar que cada commit cumple estándares antes de que exista en cualquier branch.

| Gate                    | Qué valida                   | Herramienta                             | Enforcement |
| ----------------------- | ---------------------------- | --------------------------------------- | :---------: |
| **Commit signing (-S)** | Autenticidad criptográfica   | SSH/GPG + Ruleset `required_signatures` | Server-side |
| **DCO sign-off (-s)**   | Derecho a contribuir         | KineticCafe/actions-dco                 |  CI check   |
| **commitlint**          | Formato conventional commits | Husky + @commitlint/cli                 | Client-side |
| **Pre-commit hooks**    | Lint, secrets, format        | Husky + lint-staged + gitleaks          | Client-side |

#### Commit signing

```
git commit -S -s -m "feat(scope): descripción"
│         │  │
│         │  └── DCO: Signed-off-by trailer
│         └───── Signing: SSH ED25519 verification
└─────────────── Conventional Commits format
```

**Enforcement server-side**: Ruleset `required_signatures` bloquea push de commits sin firmar a `main`.

**Verification states**:

- `Verified` — firma válida y clave registrada
- `Partially verified` — firma parcial
- `Unverified` — firma inválida
- `None` — sin firma

**Persistencia**: una vez verificado, el record se mantiene aunque la clave se rote/revogue.

#### DCO (Developer Certificate of Origin)

```
Signed-off-by: Developer Name <developer@email.com>
```

**DCO Bot**: KineticCafe/actions-dco crea un check que falla si falta Signed-off-by válido.

**Diferencia con commit signing**:

- Signing = autenticidad criptográfica (quién firmó)
- DCO = certificación de derecho (quién tiene derecho a contribuir)

**Compliance**: evidencia de control de cambio (SOC 2 CC8.1, ISO 27001 A.8.32)

#### commitlint / Conventional Commits

```
feat(scope): description
fix!: breaking change
docs(readme): update instructions
```

**Enforcement**: Husky `commit-msg` hook ejecuta commitlint. **Client-side** — bypassable con `--no-verify`.

**Recomendación**: client-side para feedback rápido, server-side (CI) para enforcement real.

#### Pre-commit hooks

```
Husky pre-commit
├── lint-staged → linters/formatters en staged files
├── gitleaks → detectar secrets antes de historial
└── semgrep → SAST en hook stage
```

**Insight clave**: hooks son client-side y bypassable. Par con Rulesets/CI para enforcement non-bypassable.

#### Cuando falla un commit gate

| Tipo                           | Resultado                  | Recuperación    |
| ------------------------------ | -------------------------- | --------------- |
| Client-side (husky/commitlint) | Commit abortado localmente | Fix + recommit  |
| Server-side (Ruleset/DCO)      | Push o merge rechazado     | Amend + re-push |

---

### Nivel 2: PR LEVEL

**Propósito**: Validar que el PR cumple formato, reviews, y checks antes de merge.

| Gate                  | Qué valida                 | Herramienta                         |   Enforcement    |
| --------------------- | -------------------------- | ----------------------------------- | :--------------: |
| **PR Title Lint**     | Título conventional        | amannn/action-semantic-pull-request |  Required check  |
| **PR Template**       | Body estructurado          | .github/PULL_REQUEST_TEMPLATE.md    | Culture + review |
| **CODEOWNERS**        | Review del equipo correcto | .github/CODEOWNERS                  | Required review  |
| **Required reviews**  | Review humana              | Branch protection                   |   ≥1 approval    |
| **CI checks**         | Tests, build, lint         | GitHub Actions                      | Required checks  |
| **Dependency review** | Vulnerabilidades en deps   | actions/dependency-review-action    |  Required check  |

#### PR Title Lint

```yaml
# .github/workflows/ci.yml
pr-title-lint:
  runs-on: ubuntu-latest
  steps:
    - uses: amannn/action-semantic-pull-request@v6
      with:
        types: |
          feat
          fix
          docs
          chore
          refactor
          test
          perf
          build
          ci
          style
          revert
```

**Por qué importa**: squash merge usa PR title como commit message. PR title = conventional commits = changelog automático.

#### PR Template como compliance control

```markdown
## Summary

[Qué hace este cambio]

## Motivation

[Por qué es necesario]

## Changes

[Lista de cambios]

## Testing

[Cómo se probó]

## Security Impact

[Impacto de seguridad]

## Rollback Plan

[Cómo revertir]
```

**SOC 2 CC8.1**: PR template crea evidencia consistente de intento y riesgo para cada cambio.

#### CODEOWNERS

```
# .github/CODEOWNERS
apps/server/    @freelancer-soluctions/backend
apps/client/    @freelancer-soluctions/frontend
.github/        @freelancer-soluctions/devops
docs/           @freelancer-soluctions/docs
```

**Enforcement**: Ruleset `require code owner reviews` bloquea merge hasta que un owner apruebe.

**Monorepo pattern**: CODEOWNERS por package/directory para ownership granular.

#### Required reviews

```yaml
# Branch protection / Ruleset
required_approving_review_count: 1
dismiss_stale_reviews: true # Reviews reset en nuevos commits
require_last_push_approval: true # Último pusher no puede self-approve
require_code_owner_reviews: true # CODEOWNERS must approve
```

---

### Nivel 3: MERGE LEVEL

**Propósito**: Validar que todo pase antes de que el código entre a main.

| Gate                       | Qué valida               | Herramienta                       |      Enforcement      |
| -------------------------- | ------------------------ | --------------------------------- | :-------------------: |
| **Required status checks** | Todos los checks pasan   | GitHub Ruleset                    |     Merge blocked     |
| **Linear history**         | Solo squash/rebase merge | Ruleset `required_linear_history` |     Merge blocked     |
| **No force push**          | Main intacto             | Ruleset `block_force_pushes`      |     Push blocked      |
| **ci-complete gate**       | Aggregate status check   | ci-complete workflow              | Single required check |
| **Rulesets**               | Policy enforcement       | GitHub Rulesets                   |     Org/repo-wide     |

#### Rulesets: el enforcement layer

```
Ruleset "main-protection"
├── enforce: active
├── target: branch (main)
├── rules:
│   ├── required_pull_request (≥1 review, dismiss stale, CODEOWNERS)
│   ├── required_status_checks (ci-complete)
│   ├── required_signatures (SSH/GPG)
│   ├── required_linear_history (squash only)
│   └── block_force_pushes
└── bypass_actors: NONE
```

**Layering**: múltiples rulesets se agregan. Si la misma regla difiere, aplica la **más restrictiva**.

**Enforcement modes**:

- `active` — enforced, bloquea
- `evaluate` — dry-run, log violations sin bloquear
- `disabled` — no enforced

**Bypass actors**:

```yaml
bypass_actors:
  - actor_type: OrganizationAdmin
    bypass_mode: pull_request # bypass review pero aún usa PR
  - actor_type: Integration
    actor_id: 123456
    bypass_mode: always # CI bot, bypass total
```

| `bypass_mode`  | Comportamiento                        | Audit trail |
| -------------- | ------------------------------------- | :---------: |
| `always`       | Rules no aplican                      |     ✅      |
| `pull_request` | Bypass review/status pero requiere PR |     ✅      |
| `exempt`       | Rules no aplican, sin audit entry     |     ❌      |

**Recomendación**: usar `pull_request` para trusted actors (preserva audit trail).

#### ci-complete: Fan-in Gate Pattern

```
Problema: listar cada required check en branch protection
         → Settings edits cada vez que se agrega workflow
         → path-filtered workflows bloquean PRs

Solución: ci-complete gate workflow
         → polls Checks API
         → reporta UN solo status: "ci-complete"
         → branch protection requiere SOLO "ci-complete"
```

```yaml
# .github/workflows/ci-complete.yml
name: ci-complete
on:
  pull_request:
  merge_group:
  push:
    branches: [main]

jobs:
  gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/github-script@v7
        with:
          script: |
            # Poll checks API for REQUIRED_CHECKS list
            # Report single status: success/failure/pending
```

**Benefits**:

- Un solo required check
- Workflow list vive en code
- Graceful con path filters
- Self-healing en re-runs

---

### Nivel 4: POST-MERGE LEVEL

**Propósito**: Validar que main siga deployable después del merge.

| Gate                    | Qué valida              | Herramienta          |    Enforcement     |
| ----------------------- | ----------------------- | -------------------- | :----------------: |
| **Deploy verification** | Deploy exitoso          | GitHub Environments  | Required reviewers |
| **Smoke tests**         | Health check básico     | Playwright/HTTP      |  Post-deploy job   |
| **Health window**       | Estabilidad post-deploy | Monitoring           |  Threshold alerts  |
| **Feature flags**       | Deploy vs release       | LaunchDarkly/Unleash |    Kill-switch     |
| **Rollback strategy**   | Revert automático       | Automated rollback   |     Rule-based     |

#### GitHub Environments

```yaml
# .github/workflows/deploy.yml
jobs:
  deploy:
    environment:
      name: production
      url: https://app.example.com
    steps:
      - run: echo "Deploying..."
```

**Environment settings**:

- `required_reviewers`: up to 6 users/teams
- `wait_timer`: delay before deploy
- `deployment_branches`: restrict which branches can deploy

#### Post-deploy smoke tests

```yaml
smoke-test:
  needs: deploy
  runs-on: ubuntu-latest
  steps:
    - run: curl -f https://app.example.com/health
    - run: npx playwright test smoke/
```

#### Feature flags como post-merge gate

```
Deploy → código en main → feature flag OFF → users no ven nada
                          → feature flag ON → users ven feature
                          → kill-switch → instant revert sin deploy
```

**Tipos de flags**:

- **Release**: ocultar features incompletas
- **Experiment**: A/B testing
- **Ops/Kill-switch**: apagar features en producción
- **Permission**: control de acceso

---

### Nivel 5: AUDIT & RECOVERY LEVEL

**Propósito**: Proveer evidencia de compliance y capacidad de recuperación.

| Gate               | Qué valida           | Herramienta                | Enforcement |
| ------------------ | -------------------- | -------------------------- | :---------: |
| **Audit log**      | Quién hizo qué       | GitHub Audit Log           |  Org-level  |
| **Signed commits** | Cadena de custodia   | Verification records       | Persistent  |
| **DCO trailers**   | Derecho a contribuir | Signed-off-by              | Persistent  |
| **Rollback**       | Recover from failure | git revert / feature flags |  Strategy   |
| **Fix-forward**    | Recover from failure | New commit to main         |  Strategy   |

#### Audit log

```bash
# REST API
GET /orgs/{org}/audit-log
# Git events: 7-day retention on GHEC
# Stream to: S3, Splunk, Datadog, Azure Blob
```

**Campos clave**: action, actor, repo, token_id, operation_type, created_at.

**Ruleset bypass events**: audited (except `exempt` mode, que no crea audit entry).

#### Compliance mapping

| Gate                  | SOC 2 | ISO 27001 | Evidence source         |
| --------------------- | ----- | --------- | ----------------------- |
| Required PR + reviews | CC8.1 | A.8.32    | Ruleset + audit log     |
| Signed commits        | CC8.1 | A.8.9     | Verification record     |
| DCO                   | CC8.1 | A.8.32    | DCO check + trailers    |
| Secret scanning       | CC7.1 | A.8.28    | Security center         |
| Dependency review     | CC7.1 | A.8.28    | dependency-review check |
| ci-complete           | CC8.1 | A.8.29    | Gate workflow           |
| Deploy protection     | CC8.1 | A.8.32    | Environment + audit log |
| Audit-log streaming   | CC7.2 | A.8.9     | External log store      |

#### Rollback strategies

| Estrategia                   | Cuándo              | Cómo                                 |
| ---------------------------- | ------------------- | ------------------------------------ |
| **Feature flag kill-switch** | Feature rota        | Toggle flag OFF instantáneo          |
| **git revert**               | Commit problemático | `git revert <sha>` (1 commit limpio) |
| **Fix forward**              | Bug menor           | Nuevo commit a main                  |
| **Release rollback**         | Deploy roto         | Redeploy previous version            |

---

## 🔧 Configuración

### Branch Protection vs Rulesets

| Capability               | Branch Protection |    Rulesets    |
| ------------------------ | :---------------: | :------------: |
| Applies to branches      |        ✅         |       ✅       |
| Applies to tags          |        ❌         |       ✅       |
| Org-level enforcement    |        ❌         |       ✅       |
| Named bypass actors      |        ❌         |       ✅       |
| Admin bypass by default  |        ✅         |  Configurable  |
| Multiple sets per branch |        ❌         | ✅ (aggregate) |
| Exportable as JSON       |        ❌         |       ✅       |
| Evaluate/dry-run mode    |        ❌         |       ✅       |
| Commit metadata rules    |        ❌         |       ✅       |

**Recomendación**: migrar a Rulesets como primary enforcement layer.

### Ruleset JSON (Governance as Code)

```json
{
  "name": "main-protection",
  "enforcement": "active",
  "target": "branch",
  "conditions": {
    "ref_name": {
      "include": ["~DEFAULT_BRANCH"]
    }
  },
  "rules": [
    {
      "type": "required_pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews": true,
        "require_code_owner_reviews": true,
        "require_last_push_approval": true
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "required_status_checks": [{ "context": "ci-complete" }],
        "strict_required_status_checks_policy": true
      }
    },
    {
      "type": "required_signatures"
    },
    {
      "type": "required_linear_history"
    },
    {
      "type": "block_force_pushes"
    }
  ],
  "bypass_actors": []
}
```

### Rulesets REST API (GET → PUT, no PATCH)

```bash
# List
GET /repos/{owner}/{repo}/rulesets

# Read one
GET /repos/{owner}/{repo}/rulesets/{ruleset_id}

# Update (FULL replace, no PATCH)
PUT /repos/{owner}/{repo}/rulesets/{ruleset_id}

# Org-level
GET /orgs/{org}/rulesets
```

### Governance as Code

```
.github/
├── rulesets/
│   └── main.json          ← Ruleset JSON version-controlled
├── CODEOWNERS             ← Path-based ownership
├── PULL_REQUEST_TEMPLATE.md ← Structured compliance
└── workflows/
    ├── ci.yml             ← CI checks
    └── ci-complete.yml    ← Fan-in gate
```

**Beneficios**: policy reviewable, auditable, reproducible across forks.

---

## ⚠️ Anti-Patterns

### 1. Too many gates → developer friction

```
❌  20 required checks → PRs tardan 30 min en merge
✅  ci-complete gate → 1 required check, checks en code
```

**Mitigación**: progressive rollout, fan-in gate pattern.

### 2. Bypass culture → gates meaningless

```
❌  exempt bypass para admins → sin audit trail
✅  pull_request bypass → bypass pero aún usa PR
```

**Mitigación**: `bypass_mode: pull_request`, audit bypass events.

### 3. Manual enforcement → inconsistency

```
❌  Wiki doc dice "always use PR" → gente olvida
✅  Ruleset enforce required_pull_request → siempre PR
```

**Mitigación**: encode in Rulesets/CI, not wiki docs.

### 4. No audit trail → compliance gaps

```
❌  exempt bypass → sin audit entry
✅  pull_request bypass → audit trail completo
```

**Mitigación**: audit-log streaming, avoid `exempt`.

### 5. Gate duplication → confusion

```
❌  Branch protection + Ruleset enforcing same thing
✅  Migrate fully to Rulesets, remove legacy
```

**Mitigación**: remove classic branch protection once Rulesets cover it.

---

## 📊 Framework Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                 GOVERNANCE GATES FRAMEWORK                       │
│                                                                  │
│  LEVEL 1: COMMIT                                                │
│  ┌─────────┬─────────┬──────────┬──────────┐                    │
│  │ Signing │   DCO   │commitlint│  Hooks   │                    │
│  │  (-S)   │  (-s)   │          │ (Husky)  │                    │
│  └────┬────┴────┬────┴────┬─────┴────┬─────┘                    │
│       │         │         │          │                           │
│  LEVEL 2: PR                                                     │
│  ┌──────────┬──────────┬──────────┬──────────┐                  │
│  │PR Title  │PR Template│CODEOWNERS│Required │                  │
│  │  Lint    │          │          │ Reviews  │                  │
│  └────┬─────┴────┬─────┴────┬─────┴────┬─────┘                  │
│       │          │          │          │                         │
│  LEVEL 3: MERGE                                                  │
│  ┌──────────┬──────────┬──────────┬──────────┐                  │
│  │Required  │  Linear  │No Force  │ci-complete│                  │
│  │ Checks   │ History  │  Push    │   Gate   │                  │
│  └────┬─────┴────┬─────┴────┬─────┴────┬─────┘                  │
│       │          │          │          │                         │
│  LEVEL 4: POST-MERGE                                             │
│  ┌──────────┬──────────┬──────────┬──────────┐                  │
│  │ Deploy   │  Smoke   │ Feature  │ Rollback │                  │
│  │  Gate    │  Tests   │  Flags   │ Strategy │                  │
│  └────┬─────┴────┬─────┴────┬─────┴────┬─────┘                  │
│       │          │          │          │                         │
│  LEVEL 5: AUDIT & RECOVERY                                       │
│  ┌──────────┬──────────┬──────────┬──────────┐                  │
│  │Audit Log │  Signed  │   DCO    │ Fix-     │                  │
│  │ Stream   │ Commits  │ Evidence │ Forward  │                  │
│  └──────────┴──────────┴──────────┴──────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ Implementation Checklist

### Fase 1: Foundation (ya hecho en Project-one)

- [x] Commit signing (-S) con SSH ED25519
- [x] DCO sign-off (-s) con KineticCafe/actions-dco
- [x] commitlint con Husky + Conventional Commits
- [x] PR Title Lint con amannn/action-semantic-pull-request
- [x] CODEOWNERS con team assignments
- [x] PR Template con 6 secciones
- [x] ci-complete gate (32 jobs)

### Fase 2: Enforcement (pendiente)

- [ ] Ruleset 21227644: add PR Title Lint + DCO (Admin-2)
- [ ] Ruleset: `required_linear_history` (squash only)
- [ ] Ruleset: `block_force_pushes`
- [ ] Ruleset: `require_code_owner_reviews`
- [ ] Branch protection: `dismiss_stale_reviews`
- [ ] Branch protection: `require_last_push_approval`

### Fase 3: Governance as Code (futuro)

- [ ] Export Ruleset JSON to `.github/rulesets/main.json`
- [ ] Version-controlled governance policy
- [ ] Org-level baseline Ruleset
- [ ] Audit-log streaming to external store

### Fase 4: Post-Merge (futuro)

- [ ] GitHub Environments with required reviewers
- [ ] Post-deploy smoke tests
- [ ] Feature flags integration (OpenFeature)
- [ ] Rollback automation

---

## 📚 Referencias

| Recurso                      | URL                                                                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub Rulesets              | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets                              |
| Available Rules              | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets                |
| Branch Protection            | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule |
| Commit Signing               | https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification                                     |
| Rulesets REST API            | https://docs.github.com/en/rest/repos/rules                                                                                                              |
| action-semantic-pull-request | https://github.com/amannn/action-semantic-pull-request                                                                                                   |
| dependency-review-action     | https://github.com/marketplace/actions/dependency-review                                                                                                 |
| DCO Bot                      | https://github.com/probot/dco/                                                                                                                           |

---

## ➡️ Siguiente

> **Has completado el framework de Governance Gates** — 5 niveles de enforcement que mantienen main seguro, compliant, y recoverable.

> **Índice**: [README Avanzado](./avanzado-README.md) · **Anterior**: [18-trunk-based-development.md](./18-trunk-based-development.md)
