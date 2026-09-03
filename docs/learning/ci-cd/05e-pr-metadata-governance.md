# 05e — PR Metadata Checks: DCO, Título y Body Templates en Enterprise

> **Guía 05e — Research Brief + Implementation Guide** (después de 05d) | Anterior: [05d-ci-commit-lint-implementation.md](./05d-ci-commit-lint-implementation.md)
>
> Esta guía documenta la investigación completa sobre **PR Metadata Checks** (DCO sign-off, PR title validation, body templates) con foco en entornos enterprise. Cubre el landscape de herramientas, interacción con squash-merge, patrones de implementación enterprise, y la **implementación completa** del change `ci-pr-metadata-governance` para Project-one.
>
> **Estado**: Implementado en `feat/ci-governance` (commits `128a0e8` → `31d445f`). Admin actions pendientes (squash setting + ruleset registration).

---

## 🎯 Objetivo

Responder tres preguntas concretas:

1. **¿Qué son los PR Metadata Checks y por qué importan?**
2. **¿Cómo interactúan con squash-merge (nuestro flujo)?**
3. **¿Qué implementamos nosotros y en qué orden?**

---

## 📋 Resumen Ejecutivo

| Check             | Qué valida                                                  | Enterprise value                           | Effort | Priority |
| ----------------- | ----------------------------------------------------------- | ------------------------------------------ | ------ | -------- |
| **PR Title Lint** | Título del PR sigue Conventional Commits                    | Alto — cierra gap del squash message final | S      | **P1**   |
| **DCO Sign-off**  | Cada commit tiene `Signed-off-by` (trazabilidad de autoría) | Alto — audit trail compliance              | S      | **P1.5** |
| **PR Template**   | Body del PR tiene estructura consistente                    | Alto — reviews consistentes + compliance   | M      | **P2**   |

**Hallazgo estrella**: el lint de PR title **CIERRA** el gap documentado del squash-message (05d). Con `squash_merge_commit_title=PR_TITLE`, el título del PR se convierte en el mensaje del commit final en main — lintearlo = garantizar que main siempre tenga commits convencionales.

---

## 🏗️ ¿Qué son los PR Metadata Checks?

En un flujo PR-based, hay tres momentos donde se puede enforce governance:

```
1. ANTES del commit    → hook commit-msg (commitlint)       ← ya lo tenemos (05d)
2. AL crear el PR      → PR title + body + signed-off-by     ← ESTE DOC
3. AL hacer merge      → ruleset required checks             ← ya lo tenemos (ruleset 21227644)
```

Los PR Metadata Checks operan en el **momento 2** — cuando se crea o actualiza el PR. Son la capa que validla **intención y trazabilidad** del cambio, no solo el formato del código.

### Los tres componentes

| Componente        | Qué es                                                                        | Herramienta                              |
| ----------------- | ----------------------------------------------------------------------------- | ---------------------------------------- |
| **PR Title Lint** | Valida que el título del PR siga Conventional Commits (`feat:`, `fix:`, etc.) | `amannn/action-semantic-pull-request@v6` |
| **DCO Sign-off**  | Valida que cada commit del PR tenga `Signed-off-by: Name <email>`             | `KineticCafe/actions-dco@v3.2.0`         |
| **PR Template**   | Estructura predefinida del body del PR (summary, issue link, testing, etc.)   | `.github/PULL_REQUEST_TEMPLATE.md`       |

---

## 🔬 DCO Sign-off: Deep Dive

### ¿Qué es el DCO?

**Developer Certificate of Origin** — declaración legal estandarizada (Linux Foundation, DCO v1.1) que certifica: _"Tengo derecho a contribuir este código bajo la licencia del proyecto"_.

Se manifiesta como un trailer en el commit:

```
feat: add payment flow

Signed-off-by: DevJohan <johan@empresa.com>
```

Se añade con `git commit -s` (flag `-s`).

### DCO vs Firma SSH/GPG

|                           | Firma SSH/GPG                                  | DCO                                      |
| ------------------------- | ---------------------------------------------- | ---------------------------------------- |
| **Naturaleza**            | Criptográfica                                  | Legal/Contractual                        |
| **Prueba**                | Autenticidad (quién escribió, no fue alterado) | Derecho (certifico que puedo contribuir) |
| **No repudiable**         | Sí (firma matemática)                          | No (es una declaración honoraria)        |
| **Protege contra**        | Suplantación, tampering                        | Demandas por código sin derechos         |
| **Requiere**              | Clave SSH/GPG registrada                       | `git commit -s` + email correcto         |
| **¿Son complementarios?** | SÍ — cubren capas distintas                    | SÍ — identidad vs derecho                |

### ¿Cuándo importa el DCO?

```
¿Quién contribuye?

├── Solo employees internos
│   ├── Contrato laboral YA asigna IP → DCO es REDUNDANTE técnicamente
│   ├── PERO enterprise lo usa como AUDIT TRAIL (evidencia intencional)
│   └── SOC2/ISO27001: trazabilidad de cambios = control requerido
│
├── Employees + contractors
│   ├── Contractor agreement cubre IP assignment
│   ├── DCO = evidencia adicional (paper trail)
│   └── Enterprise verdict: DCO recomendado
│
└── Open-source (externos)
    ├── NO hay contrato que cubra IP
    ├── DCO = MÍNIMO OBLIGATORIO
    └── CLA = ideal pero más pesado
```

### Herramientas de DCO (Comparación)

| Herramienta                          | Tipo            | Mantenimiento         | Bot handling                                              | Veredicto          |
| ------------------------------------ | --------------- | --------------------- | --------------------------------------------------------- | ------------------ |
| `probot/dco` (DCO App clásica)       | GitHub App      | ❌ MUERTA (~2024)     | Exenta bots por defecto                                   | **No usar**        |
| `cncf/dco2` (App nueva CNCF)         | GitHub App      | ✅ Activa 2026 (Rust) | Categorías config                                         | Alternativa App    |
| **`KineticCafe/actions-dco@v3.2.0`** | GitHub Action   | ✅ Activa             | **RICHEST**: policy all/well-known/allowlist + categorías | **ELEGIDA**        |
| `tisonkun/actions-dco`               | GitHub Action   | Baja actividad        | Básico                                                    | Alternativa simple |
| `christophebedard/dco-check`         | Script multi-CI | Moderada              | Por plataforma                                            | Alternativa        |
| Custom script                        | Self-hosted     | Dependencia tuya      | Tú implementas                                            | Control total      |

### ¿Por qué KineticCafe?

- **Config TOML rica**: policy `well-known` con categorías predefinidas
  - `dependency-updaters`: dependabot[bot], renovate[bot], snyk-bot[bot]
  - `ci-cd`: github-actions[bot]
  - `release`: semantic-release[bot], release-please[bot]
- **Parsing inteligente**: maneja edge cases de dependabot (email `support@github.com` ≠ author email)
- **Action, no App**: no necesitas instalar GitHub App con permisos extendidos
- **Políticas granulares**: `all` (exenta todos), `well-known` (solo categorías conocidas), `allowlist` (explícitos), `none` (nadie exento)

```toml
# .github/dco-check.toml
[bot]
policy = "well-known"
categories = ["dependency-updaters"]
```

### Enforcement en 3 capas (shifting-left)

El DCO se valida en **3 capas** (de más temprana a más autoritativa):

1. **L1/L2 — hooks locales:** `commit-msg` (presence check de `Signed-off-by:` antes de commitlint; salta merge commits) y `pre-push` (re-check por commit pusheado, refs leídos de STDIN, fallback `origin/main..HEAD --no-merges` en primer push de rama). Feedback inmediato, antes de CI.
2. **`/commit-all` (git-manager prompt, regla 10):** los commits generados por el agente usan SIEMPRE `git commit -S -s` → trailer `Signed-off-by: Name <email>` garantizado incluso sin `git config commit.signoff true` (defense-in-depth).
3. **L3 — CI KineticCafe:** el check `DCO` del ruleset (no-bypassable) — parser autoritativo de trailers.

Recomendado: `git config --global commit.signoff true` para añadir el trailer automáticamente (**convención de trazabilidad**, `docs/CONTEXT-CICD.md` §10.5 — convive con la regla 10 de `/commit-all` §10.4 y los hooks §10.3). Detalle operativo de las capas: `docs/CONTEXT-CICD.md` §10-§11.

---

## 🔨 Squash-Merge × DCO: La Historia Real

### ¿Preserva GitHub los `Signed-off-by` en squash?

**SÍ, SI el setting es correcto.** GitHub squash NO descarta trailers automáticamente — depende de `squash_merge_commit_message`:

| Setting               | ¿Preserva Signed-off-by?                                                   |
| --------------------- | -------------------------------------------------------------------------- |
| `DEFAULT`             | Depende del formato del commit message original                            |
| `PR_TITLE`            | Solo preserva el título (body se pierde si COMMIT_MESSAGES no está activo) |
| **`COMMIT_MESSAGES`** | ✅ **SÍ** — concatena mensajes originales incluyendo trailers              |
| `PR_BODY`             | Preserva el body del PR                                                    |
| `BLANK`               | ❌ NO — descarta todo                                                      |

**Nuestro setting actual**: `COMMIT_MESSAGES` → **los trailers SÍ sobreviven al squash**. ✅

### Flujo completo con DCO + squash

```
PR con 3 commits:
  feat: A
  Signed-off-by: Juan <juan@empresa.com>
  fix: B
  Signed-off-by: María <maria@empresa.com>
  docs: C
  Signed-off-by: Juan <juan@empresa.com>

  └─► Squash-MERGE (COMMIT_MESSAGES setting)
      └► Commit en main:
          Subject: feat(auth): add payment flow  ← del PR title
          Body:
            feat: A                              ← de COMMIT_MESSAGES
            Signed-off-by: Juan                  ← PRESERVADO ✅
            fix: B
            Signed-off-by: María                 ← PRESERVADO ✅
            docs: C
            Signed-off-by: Juan                  ← PRESERVADO ✅
```

### CNCF/LF avala este patrón

LF oficial recomienda: _"When merging... include Signed-off-by lines from every contributor, and add one for you as the person merging."_ → nuestro setting `COMMIT_MESSAGES` hace esto automáticamente.

### El workaround enterprise (4 opciones)

| Opción                   | Descripción                                     | Fricción | Nuestro caso        |
| ------------------------ | ----------------------------------------------- | -------- | ------------------- |
| (a) PR como audit record | DCO check en PR + GitHub audit log = suficiente | Baja     | ✅ Nuestro approach |
| (b) Maintainer re-signa  | Humano pega trailers en squash dialog           | Alta     | ❌ No práctico      |
| (c) Push ruleset regex   | Requiere Team/Enterprise plan                   | Media    | ⚠️ Futuro opcional  |
| (d) Ignore post-squash   | Solo audit log                                  | Muy baja | ⚠️ Débil solo       |

**Nuestro approach: (a) + setting COMMIT_MESSAGES** → los trailers sobreviven al squash sin intervención manual.

---

## 📝 PR Title Lint: Deep Dive

### ¿Por qué importa en squash-merge?

Con `squash_merge_commit_title=PR_TITLE`:

- El título del PR = el mensaje del commit final en main
- PR Title Lint valida ese título ANTES del merge
- **Resultado**: main siempre recibe commits convencionales ✅

Con `COMMIT_OR_PR_TITLE` (nuestro setting actual):

- Single commit PR → squash usa commit message (ya validado por commit-lint)
- Multi-commit PR → squash usa PR title (validado por PR Title Lint)
- **Resultado**: ambos cubiertos ✅ (pero inconsistente — PR_TITLE es más simple)

### Herramienta: amannn/action-semantic-pull-request@v6

```yaml
pr-title-lint:
  name: PR Title Lint
  runs-on: ubuntu-latest
  permissions:
    pull-requests: read
  if: github.event_name == 'pull_request'
  steps:
    - uses: amannn/action-semantic-pull-request@v6
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        types: |
          feat
          fix
          docs
          style
          refactor
          perf
          test
          build
          ci
          chore
          revert
        requireScope: false
        ignoreLabels: |
          bot
          ignore-semantic-pull-request
```

**Types** — alineados con `@commitlint/config-conventional` (nuestra config actual de commitlint).

---

## 📋 PR Template: Deep Dive

### ¿Por qué es un control de compliance?

En enterprise, el PR template no es "comodidad" — es **evidencia de gobierno del cambio**:

| Sección del template | Control de compliance             | SOC2/ISO reference        |
| -------------------- | --------------------------------- | ------------------------- |
| Summary              | Qué cambió y por qué              | CC8.1 (Change Management) |
| Type/Scope           | Clasificación del cambio          | CC6.1 (Logical Access)    |
| Related Issue        | Traceabilidad requirements→code   | CC8.1, ISO A.8.1          |
| Testing              | Evidencia de validación           | CC7.1 (System Operations) |
| Screenshots          | Evidencia visual                  | CC8.1                     |
| Checklist            | Auto-verification del contributor | CC8.1                     |

### Template recomendado para Project-one

```markdown
## Summary

<!-- ¿Qué hace este cambio y por qué? -->

## Type / Scope

<!-- Marca uno: -->

- [ ] Client (React/Vite)
- [ ] Server (Express/Prisma)
- [ ] E2E (Playwright)
- [ ] Shared/Config
- [ ] CI/CD

## Related Issue

<!-- Link al ticket/story — required para trazabilidad -->

Closes #

## How Has This Been Tested?

<!-- Evidencia de testing — SOC2 CC8.1 -->

- [ ] Unit tests (vitest)
- [ ] Integration tests
- [ ] E2E tests (playwright)
- [ ] Manual testing
- [ ] N/A (docs/config only)

## Screenshots (if applicable)

<!-- Evidencia visual para cambios UI -->

## Pre-merge Checklist

- [ ] Signed-off-by present in all commits (`git commit -s`)
- [ ] Tests pass locally
- [ ] Documentation updated (if needed)
- [ ] No breaking changes (or documented in Summary)
```

### Enforcement real: ¿se puede forzar el body?

**GitHub NO puede nativamente** — solo sugiere el template. Opciones de enforcement:

| Opción                          | Effort     | Realidad                                   |
| ------------------------------- | ---------- | ------------------------------------------ |
| Template visual (solo)          | Bajo       | El más común — funciona por cultura        |
| Action que valide body no-empty | Medio      | Reduce PRs vacíos pero no valida contenido |
| Danger.js script                | Medio-Alto | Valida checklist completada pero维护成本高 |
| Review guideline + CODEOWNERS   | Medio      | La review humana como gate                 |

**Para enterprise, el approach estándar es: template + review culture + CODEOWNERS**. La automatización total del body es más fricción que valor.

---

## 📊 Decisiones de Diseño (Research-Backed)

### D1: DCO como job paralelo separado (no unificar con commitlint)

| Razón                          | Detalle                                                                |
| ------------------------------ | ---------------------------------------------------------------------- |
| Separación de concerns         | commitlint = formato; DCO = trazabilidad legal                         |
| Required checks independientes | Si uno falla, el otro sigue valido para debugging                      |
| Rollout independiente          | Se puede activar antes/después                                         |
| Patrón consistente             | Mismo patrón que commit-lint: job paralelo, no needs, ci-complete gate |

### D2: Squash setting unchanged vs changed

| Setting actual     | `COMMIT_OR_PR_TITLE` + `COMMIT_MESSAGES`                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Pros               | Single-commit: commit msg (commit-lint); multi: PR title (PR Title Lint)                                                  |
| Contras            | Inconsistente: a veces linteamos título, a veces commit message                                                           |
| Cambio propuesto   | `PR_TITLE` + `COMMIT_MESSAGES`                                                                                            |
| Pros del cambio    | Consistente: siempre PR title = squash subject = lo que PR Title Lint valida                                              |
| Contras del cambio | Single-commit PRs cuyo commit message es good pero PR title no → PR Title Lint falla (eso es BUENO — fuerza consistencia) |

**Decisión**: cambiar a `PR_TITLE` para consistencia.

### D3: Body validation — template visual + review culture (no automation)

Razón: la automatización del body es fragile (templates cambian, bots whitelist, false positives). En enterprise, la review humana + CODEOWNERS es el gate real para el body.

---

## 🗺️ Implementación

> **OpenSpec change**: `ci-pr-metadata-governance` | **Commits**: `128a0e8` → `31d445f`
> **Branch**: `feat/ci-governance` | **Schema**: spec-driven

### Resumen de Cambios

| #   | Commit    | Descripción                                                      |
| --- | --------- | ---------------------------------------------------------------- |
| 1   | `128a0e8` | Research brief (este doc)                                        |
| 2   | `577a443` | OpenSpec change artifacts (proposal, spec, design, tasks)        |
| 3   | `d8fdd6f` | Fix 5 planner issues in spec/design/tasks                        |
| 4   | `c3cc1c7` | **PR Title Lint + DCO jobs** in ci.yml + ci-complete gate update |
| 5   | `cc400b4` | Fix malformed `ignoreLabels` YAML in pr-title-lint               |
| 6   | `a5fb76b` | Mark Tasks 1-7 acceptance criteria complete                      |
| 7   | `d92f89b` | **Fix**: add `pull-requests: read` to DCO permissions            |
| 8   | `31d445f` | **PR Template + CODEOWNERS + CONTRIBUTING.md**                   |

---

### P1: PR Title Lint — `amannn/action-semantic-pull-request@v6`

**Ubicación**: `.github/workflows/ci.yml:331-365`

#### Por qué esta herramienta

- **13k+ stars**, activamente mantenida (v6, 2025)
- Configurable: `types`, `requireScope`, `subjectPattern`, `ignoreLabels`
- Soporte nativo para `merge_group` events (requerido para merge queue)
- No necesita GitHub App — es un Action simple

#### Job implementado

```yaml
pr-title-lint:
  name: PR Title Lint # ← CRITICAL: nombre exacto para ruleset
  runs-on: ubuntu-latest
  permissions:
    pull-requests: read # ← Necesario para leer PR title
  steps:
    # PR events: valida título contra Conventional Commits
    - name: Lint PR title
      if: github.event_name == 'pull_request'
      uses: amannn/action-semantic-pull-request@v6
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        types: | # ← Mismos types que commitlint config-conventional
          feat
          fix
          docs
          style
          refactor
          perf
          test
          build
          ci
          chore
          revert
        requireScope: false
        ignoreLabels: | # ← Bots pueden saltar con este label
          bot
          ignore-semantic-pull-request
    # Merge queue: squash commit title ya validado por commitlint --last
    - name: Skip on merge_group (covered by commitlint)
      if: github.event_name == 'merge_group'
      run: echo "✅ Merge queue — squash commit title validated by commitlint"
  # Phase 1: non-blocking. Remove after team adjusts (1 sprint).
  continue-on-error: true
```

#### Decisiones clave

1. **Sin `needs`**: job corre en paralelo — no bloquea ni es bloqueado
2. **`permissions: pull-requests: read`**: necesario para leer el título del PR vía API
3. **`merge_group` step**: emite success neutral — required check satisfacible en merge queue
4. **`continue-on-error: true`**: Phase 1 rollout — equipo se ajusta sin bloquear merges
5. **`name: PR Title Lint`**: string exacto que debe coincidir con el ruleset (D5)
6. **Sin `subjectPattern`**: decidimos NO aplicar la regla "no capital-first" — commitlint ya valida commits; PR title es más flexible

#### Flujo de validación

```
PR abierto → PR Title Lint corre
  ├── Título válido (feat: ..., fix: ...) → ✅ pass
  ├── Título inválido (feature: ..., add ...) → ❌ fail
  ├── PR con label "bot" → skip (ignoreLabels)
  └── merge_group event → emite success (commitlint cubre esto)
```

---

### P1.5: DCO Sign-off — `KineticCafe/actions-dco@v3.2.0`

**Ubicación**: `.github/workflows/ci.yml:367-389`

#### Por qué KineticCafe

- **Policy `well-known`**: whitelist automática de dependabot[bot], renovate[bot], snyk-bot[bot]
- **Edge case dependabot**: author email = `+dependabot[bot]@users.noreply.github.com`, sign-off = `support@github.com` — KineticCafe maneja esto; scripts custom fallan
- **TOML config**: versionable en el repo, no hardcoded
- **Action, no App**: no necesita instalación de GitHub App con permisos extendidos

#### Job implementado

```yaml
dco:
  name: DCO # ← CRITICAL: nombre exacto para ruleset
  runs-on: ubuntu-latest
  permissions:
    contents: read # ← Para leer archivos del repo
    pull-requests: read # ← Para enumerar commits del PR (pulls.listCommits)
  steps:
    # PR events: valida Signed-off-by en todos los commits
    - name: DCO sign-off check
      if: github.event_name == 'pull_request'
      uses: KineticCafe/actions-dco@v3.2.0
      with:
        config: |
          [bot]
          policy = "well-known"
          categories = ["dependency-updaters"]
    # Merge queue: DCO es check de PR-level; squash commit no lleva trailers individuales
    - name: Skip on merge_group (PR-level check)
      if: github.event_name == 'merge_group'
      run: echo "✅ Merge queue — DCO validated at PR level"
  # Phase 1: non-blocking. Remove after team adjusts (1 sprint).
  continue-on-error: true
```

#### Bug encontrado por reviewer: DCO permissions

**Problema**: el job solo tenía `contents: read`. `KineticCafe/actions-dco` necesita `pull-requests: read` para enumerar commits del PR vía `pulls.listCommits`. Sin esto → HTTP 403 en runtime.

**Actualmente enmascarado** por `continue-on-error: true` en Phase 1. En Phase 2 (sin continue-on-error) → **bloquearía TODOS los merges**.

**Fix** (`d92f89b`):

```yaml
permissions:
  contents: read
  pull-requests: read # ← AGREGADO
```

**Lección**: siempre verificar si un Action necesita acceso a la API de PRs, no solo a contents.

#### Config TOML: `well-known` policy

```toml
[bot]
policy = "well-known"
categories = ["dependency-updaters"]
```

| Policy           | Comportamiento                                                                                                                                        |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `all`            | Exenta a TODOS los bots (débil)                                                                                                                       |
| **`well-known`** | Solo categorías conocidas: `dependency-updaters` (dependabot, renovate, snyk), `ci-cd` (github-actions), `release` (semantic-release, release-please) |
| `allowlist`      | Solo bots explícitos                                                                                                                                  |
| `none`           | Nadie exento — todos firman                                                                                                                           |

#### Flujo de dependabot

```
dependabot abre PR → DCO job corre
  ├── Bot detectado → SKIPPED (well-known policy)
  ├── GitHub ve: DCO = success (skipped = success)
  ├── PR Title Lint corre normalmente (dependabot titles follow convention)
  └── Todos los checks pasan → merge permitido ✅
```

---

### P2: ci-complete Gate Update

**Ubicación**: `.github/workflows/ci.yml:730-778`

#### Patron ADD-only

Regla estricta: **NUNCA eliminar o modificar** jobs existentes en `ci-complete.needs`. Solo agregar.

```yaml
ci-complete:
  if: ${{ vars.CI_MINIMAL != 'true' && always() }} # ← PRESERVE exactamente
  name: CI Complete
  runs-on: ubuntu-latest
  needs:
    - repo-discovery # existing
    - actionlint # existing
    - commit-lint # existing
    - pr-title-lint # ← ADD (P1)
    - dco # ← ADD (P1.5)
    - client-lint # existing (if: false)
    - client-format-check # existing (if: false)
    - client-typecheck # existing (if: false)
    - client-complexity # existing (if: false)
    - client-dead-code # existing (if: false)
    - client-import-bounds # existing (if: false)
    - server-lint # existing (if: false)
    - server-format-check # existing (if: false)
    - server-typecheck # existing (if: false)
    - server-complexity # existing (if: false)
    - server-dead-code # existing (if: false)
    - server-import-bounds # existing (if: false)
    - client-build # existing
    - server-build # existing
    - client-sonarqube # existing
    - server-sonarqube # existing
    - client-coverage # existing
    - server-coverage # existing
    - client-depcheck # existing
    - server-depcheck # existing
    - test-unit-client # existing
    - test-unit-server # existing
    - test-integration # existing
    - test-smoke # existing
    - e2e # existing
    - verify-signatures # existing
    - zombie-workflow-guard # existing
  steps:
    - name: Check for failures
      run: |
        if [[ "${{ contains(needs.*.result, 'failure') }}" == "true" ]]; then
          echo "❌ One or more upstream jobs failed"
          exit 1
        fi
        if [[ "${{ contains(needs.*.result, 'cancelled') }}" == "true" ]]; then
          echo "⚠️ One or more upstream jobs were cancelled — skipping ci-complete"
          exit 0
        fi
        echo "✅ All upstream jobs succeeded or were skipped"
```

**Total**: 32 jobs (30 existentes + 2 nuevos). Guard `CI_MINIMAL` preservado exactamente.

---

### P2: dependabot.yml Fix

**Ubicación**: `.github/dependabot.yml:14-15`

**Problema**: dependabot genera PRs con título `Bump X from Y to Z`. PR Title Lint rechaza `Bump` (no es un type válido).

**Fix**: agregar `commit-message: prefix: "fix"` al ecosystem npm:

```yaml
- package-ecosystem: 'npm'
  directory: '/'
  schedule:
    interval: 'weekly'
    day: 'monday'
    time: '03:00'
    timezone: 'UTC'
  open-pull-requests-limit: 10
  labels:
    - 'dependencies'
    - 'automated'
  commit-message:
    prefix: 'fix' # ← AGREGADO: "fix(deps): Bump X from Y to Z"
  groups:
    dev-dependencies:
      patterns: [...]
```

**Resultado**: dependabot PR titles → `fix(deps): Bump X from Y to Z` → PR Title Lint pasa ✅

---

### P2: PR Template

**Ubicación**: `.github/PULL_REQUEST_TEMPLATE.md`

**6 secciones** — cada una es un control de compliance enterprise:

```markdown
## Summary

<!-- What does this PR do and why? Link to context if needed. -->

## Type / Scope

<!-- Check all that apply: -->

- [ ] Client (React/Vite)
- [ ] Server (Express/Prisma)
- [ ] E2E (Playwright)
- [ ] Shared/Config
- [ ] CI/CD

## Related Issue

<!-- Required for traceability. Use "Closes #<number>" to auto-close on merge. -->

Closes #

## How Has This Been Tested?

<!-- Describe the tests you ran. Provide reproducibility steps if manual. -->

- [ ] Unit tests (vitest)
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] Manual testing
- [ ] N/A (docs/config only)

## Screenshots (if applicable)

<!-- Add screenshots or screen recordings for UI changes. -->

## Pre-merge Checklist

- [ ] `Signed-off-by` present in all commits (`git commit -s`)
- [ ] Tests pass locally (`npm run test`)
- [ ] Documentation updated (if applicable)
- [ ] No breaking changes (or documented in Summary)
- [ ] PR title follows Conventional Commits format
```

**Por qué no automatizar el body**: GitHub NO puede nativamente forzar contenido. Enterprise standard = template + review culture + CODEOWNERS. La automatización del body es fragile y de alto mantenimiento.

---

### P2: CODEOWNERS

**Ubicación**: `.github/CODEOWNERS`

```markdown
# Default: @Freelancer-soluctions/core-team

-                           @Freelancer-soluctions/core-team

# Client

apps/client/ @Freelancer-soluctions/frontend-team

# Server

apps/server/ @Freelancer-soluctions/backend-team

# CI/CD

.github/ @Freelancer-soluctions/devops-team
.github/workflows/ @Freelancer-soluctions/devops-team

# E2E

apps/e2e/ @Freelancer-soluctions/qa-team

# OpenSpec

openspec/ @Freelancer-soluctions/architects

# Learning docs

docs/learning/ @Freelancer-soluctions/core-team
```

**Función**: asegura que cada componente tenga reviewers especializados. Complementa la automatización de CI con review humana.

---

### P2: CONTRIBUTING.md

**Ubicación**: `CONTRIBUTING.md` (raíz del repo)

**Secciones clave**:

- **Commit Guidelines**: formato Conventional Commits, types, ejemplos
- **DCO Sign-off**: `git commit -s` obligatorio, exemption para bots
- **PR Title Format**: type(scope): description, types, scope examples
- **PR Template**: uso del template, secciones explicadas
- **Review Process**: CODEOWNERS, required checks, signed commits
- **Code Standards**: Frontend (React/Vite/Tailwind), Backend (Express/Prisma), Testing (Vitest/RTL/Playwright)

---

### Design Decisions — Estado Final

| Decision                               | Implementada | Notas                                      |
| -------------------------------------- | :----------: | ------------------------------------------ |
| D1: PR Title Lint tool                 |      ✅      | amannn/action-semantic-pull-request@v6     |
| D2: DCO tool                           |      ✅      | KineticCafe/actions-dco@v3.2.0             |
| D3: Squash setting PR_TITLE            |      ⏳      | Admin action pendiente                     |
| D4: CI pattern parallel/ADD-only       |      ✅      | 32 jobs, CI_MINIMAL guard preservado       |
| D5: Ruleset required checks            |      ⏳      | Admin action pendiente                     |
| D6: Body enforcement template+culture  |      ✅      | PR Template + CODEOWNERS + CONTRIBUTING.md |
| D7: Rollout continue-on-error → Active |      ✅      | Phase 1 activo                             |
| D8: Merge queue neutral success        |      ✅      | Ambos jobs emiten success en merge_group   |

---

### Admin Actions Pendientes

#### Admin-1: Squash Setting

**Cambiar** `squash_merge_commit_title` de `COMMIT_OR_PR_TITLE` → `PR_TITLE`.

**Por qué**: consistencia — PR title = squash subject en TODOS los casos. Con `COMMIT_OR_PR_TITLE`, single-commit PRs usan el commit message (commitlint), multi-commit usan PR title (PR Title Lint). Con `PR_TITLE`, siempre PR title.

**Cómo**:

1. GitHub → Settings → General → Pull Requests
2. Cambiar "Allow squash merging" → Default commit message → "Pull request title"
3. Verificar que `squash_merge_commit_message` sigue siendo `COMMIT_MESSAGES`

**Impacto**: single-commit PRs cuyo commit message es convencional pero PR title no → PR Title Lint falla. Esto es DESIRED — fuerza consistencia.

#### Admin-2: Ruleset Required Checks

**Registrar** `PR Title Lint` y `DCO` como required checks en ruleset 21227644.

**CRITICAL**: usar **GET → modify → PUT**, NO PATCH. PATCH borra todos los checks existentes.

```bash
# 1. GET current ruleset
gh api repos/{owner}/{repo}/rulesets/21227644

# 2. Modify: agregar PR Title Lint y DCO a required_checks
# (mantener Verify Commit Signatures y Commit Lint)

# 3. PUT full ruleset back
gh api repos/{owner}/{repo}/rulesets/21227644 -X PUT -d @ruleset.json
```

**Ruleset resultante**:

```
Required status checks:
  ├── Verify Commit Signatures       ← existing
  ├── Commit Lint (Conventional Commits) ← existing
  ├── PR Title Lint                  ← NEW
  ├── DCO                            ← NEW
  └── ci-complete                    ← existing (gate)

Bypass actors: NONE
```

---

### Rollout Phases

```
Phase 1 (Week 1-2): AHORA
  ├── continue-on-error: true en ambos jobs
  ├── Jobs corren, reportan pass/fail, NO bloquean merge
  ├── Equipo ve failures, ajusta workflow
  └── Admin-1 + Admin-2 pendientes

Phase 2 (Week 3): ACTIVACIÓN
  ├── Remover continue-on-error de pr-title-lint y dco
  ├── Admin-1: squash = PR_TITLE
  ├── Admin-2: registers checks in ruleset
  └── Required checks → blocking

Phase 3 (Ongoing): MANTENIMIENTO
  ├── Monitorear false positives
  ├── Ajustar ignoreLabels si necesario
  └── Evolucionar CONTRIBUTING.md según feedback
```

---

### Verification Report

| Dimension    | Estado                                            |
| ------------ | ------------------------------------------------- |
| Completeness | 7/7 tasks implementadas                           |
| Correctness  | Todos los acceptance criteria verificados         |
| Coherence    | Design decisions D1-D8 seguidas (2 pending admin) |

**Issues encontrados durante verification**:

| #   | Severidad | Issue                                                            | Fix                                      |
| --- | --------- | ---------------------------------------------------------------- | ---------------------------------------- |
| 1   | **HIGH**  | DCO job permissions: solo `contents: read` → HTTP 403 en Phase 2 | `d92f89b`: agregar `pull-requests: read` |
| 2   | MEDIUM    | design.md D1: `subjectPattern` stale en config block             | `d92f89b`: remover de design.md          |
| 3   | LOW       | design.md D4: count 30→32 desactualizado                         | `d92f89b`: actualizar a 32               |
| 4   | LOW       | CODEOWNERS: team slugs no verificables desde repo                | Verificar en GitHub org antes de confiar |

---

### Commits Totales (feat/ci-governance)

```
31d445f docs(ci): add PR template, CODEOWNERS, and CONTRIBUTING.md
d92f89b fix(ci): add pull-requests: read to DCO job permissions
a5fb76b docs(openspec): mark Tasks 1-7 acceptance criteria complete
cc400b4 fix(ci): fix malformed ignoreLabels YAML in pr-title-lint job
c3cc1c7 feat(ci): add PR Title Lint and DCO jobs with merge_group support
d8fdd6f fix(openspec): fix 5 critical planner issues in ci-pr-metadata-governance artifacts
577a443 docs(openspec): add ci-pr-metadata-governance change artifacts
128a0e8 docs(learning): add 05e PR metadata checks research brief
```

---

## ⚠️ Gotchas Enterprise

1. **Exact-name case-sensitive**: el `name:` del job debe coincidir EXACTAMENTE con el string registrado en el ruleset. Mismatch → deadlock de "Expected — waiting".
2. **Dependabot email mismatch**: author email es `+dependabot[bot]@users.noreply.github.com` pero sign-off es `support@github.com`. KineticCafe lo maneja; scripts custom necesitan whitelist explícita.
3. **Squash trailer loss**: si `squash_merge_commit_message` no es `COMMIT_MESSAGES`, los Signed-off-by se pierden. Verificar setting ANTES de activar DCO check.
4. **probot/dco está muerto**: no instalar la DCO App clásica. Usar `cncf/dco2` (App) o `KineticCafe/actions-dco` (Action).
5. **Zero-bypass ruleset**: dependabot, release-please, y otros bots generarán PRs que deben pasar los checks — whitelist OBLIGATORIO en las configs de los Actions.
6. **PR body enforcement**: GitHub NO puede nativamente forzar contenido del body. No intentar automatizar lo que la review humana hace mejor.
7. **DCO permissions**: `KineticCafe/actions-dco` necesita `pull-requests: read` para enumerar commits. Solo `contents: read` → HTTP 403 silencioso (enmascarado por `continue-on-error`).
8. **Ruleset PATCH destructivo**: `PATCH` en GitHub API rulesets BORRA todos los required checks. Siempre usar GET → modify → PUT.
9. **subjectPattern debate**: inicialmente incluimos `subjectPattern: ^(?![A-Z]).+$` para rechazar mayúsculas iniciales. Lo removimos porque: (a) commitlint ya valida commits, (b) PR titles en inglés frecuentemente empiezan con mayúscula ("Fix: ..."), (c) más fricción que valor.

---

## ⚠️ Gotchas Enterprise

1. **Exact-name case-sensitive**: el `name:` del job debe coincidir EXACTAMENTE con el string registrado en el ruleset. Mismatch → deadlock de "Expected — waiting".
2. **Dependabot email mismatch**: author email es `+dependabot[bot]@users.noreply.github.com` pero sign-off es `support@github.com`. KineticCafe lo maneja; scripts custom necesitan whitelist explícita.
3. **Squash trailer loss**: si `squash_merge_commit_message` no es `COMMIT_MESSAGES`, los Signed-off-by se pierden. Verificar setting ANTES de activar DCO check.
4. **probot/dco está muerto**: no instalar la DCO App clásica. Usar `cncf/dco2` (App) o `KineticCafe/actions-dco` (Action).
5. **Zero-bypass ruleset**: dependabot, release-please, y otros bots generarán PRs que deben pasar los checks — whitelist OBLIGATORIO en las configs de los Actions.
6. **PR body enforcement**: GitHub NO puede nativamente forzar contenido del body. No intentar automatizar lo que la review humana hace mejor.

---

## 📚 Referencias

| Recurso                             | URL                                                                                                                                                               |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KineticCafe/actions-dco             | https://github.com/KineticCafe/actions-dco                                                                                                                        |
| amannn/action-semantic-pull-request | https://github.com/amannn/action-semantic-pull-request                                                                                                            |
| CNCF dco2 App                       | https://github.com/cncf/dco2                                                                                                                                      |
| LF DCO Best Practices               | https://bestpractices.linuxfoundation.org/ip/contribution-mechanisms-dco.html                                                                                     |
| GitHub squash options (2022)        | https://github.blog/changelog/2022-08-23-new-options-for-controlling-the-default-commit-message-when-merging-a-pull-request/                                      |
| OpenSpec change                     | `openspec/changes/ci-pr-metadata-governance/`                                                                                                                     |
| CI/CD learning docs                 | [05a](./05a-ci-cd-pipeline-design.md) · [05b](./05b-github-actions-setup.md) · [05c](./05c-ssh-commit-signing.md) · [05d](./05d-ci-commit-lint-implementation.md) |

---

## 🔮 Futuro: Enterprise Implementation Patterns (Para Profundizar)

> **Nota**: la implementación core está completa. Los siguientes temas merecen un deep-dive dedicado:
>
> - **CLA (Contributor License Agreement)**: cuándo DCO no es suficiente y se necesita CLA bilateral (patent grants, relicensing rights, copyright assignment). Comparación DCO vs CLA en escenarios de auditoría SOC2/ISO27001 real.
> - **Push rulesets para Signed-off-by**: regex en el commit message como defense-in-depth contra el squash-time stripping (requiere plan Team/Enterprise). Cómo configurar y rollout.
> - **CODEOWNERS patterns**: design patterns para ownership boundaries en monorepos (client/server/e2e). Integración con required reviewers.
> - **Automated compliance dashboards**: cómo exportar evidencia de DCO/title-lint/template-compliance para auditorías (GitHub API, audit log exports, SIEM integration).
> - **Multi-repo governance**: cómo escalar PR metadata checks a nivel organization (org-wide rulesets, shared Actions, reusable workflows).
> - **Patrones de Mantycore/MorganStanley/Netflix**: cómo empresas fintech/enterprise reales implementan DCO + CLA + CODEOWNERS como stack de compliance.
> - **Danger.js body validation**: si el equipo quiere reforzar el template, agregar un script Danger que valide body no-empty y checklist completada (maintenance cost trade-off).

---

## ➡️ Siguiente

> **Has completado el research brief + implementación de PR Metadata Checks** — junto con 05c (signing) y 05d (commit-lint), cubre las tres capas de gobernanza de commits: quién firma, cómo se escribe, y qué metadatos acompaña cada PR.
>
> **Estado actual**: implementación completa en `feat/ci-governance`. Pendiente: Admin-1 (squash setting) + Admin-2 (ruleset registration) + push.

> **Índice**: [README Avanzado](./avanzado-README.md) · **Anterior**: [05d-ci-commit-lint-implementation.md](./05d-ci-commit-lint-implementation.md)
