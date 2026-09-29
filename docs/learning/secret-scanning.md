# Secret Scanning (Gitleaks) — Implementación Profesional / Enterprise

## 1. Contexto y estado actual

> **Estado (2026-09-25, change `secret-scanning`):** L1 usa `gitleaks git --pre-commit --staged`; el gate PR-time vive en `ci.yml` (job `secrets`, `name: Secret Detection`, substage 2C, Docker `v8.30.1`, wireado a `prebuild-security-complete.needs` — el gate vive en ci.yml, NO en security.yml); el scheduled full-history sigue advisory con pins `v8.30.1` y `notify-failure` arreglado (`steps.*.outcome`). Los 7 hallazgos de config de §4.2 están corregidos y el estado GitHub (enablement + ruleset) está verificado por API (ver §1.1).

El monorepo `project-one` tiene secret scanning implementado en 3 capas: **L1 local** (`.husky/pre-commit` → `npm run security:secrets` = `gitleaks git --pre-commit --staged`), **L3 CI PR-time** (`.github/workflows/ci.yml` job `secrets`, substage 2C, Docker `zricethezav/gitleaks:v8.30.1` + `gitleaks/gitleaks-action@v3` licenciado opcional) y **L3 audit semanal** (`.github/workflows/scheduled-security.yml`, full history + JSON/SARIF, `continue-on-error: true`). Config en `.gitleaks.toml` (`useDefault = true` + `disabledRules = ["generic-api-key"]` + 5 reglas custom con `keywords`/`entropy` + allowlists ancladas) y `.gitleaksignore` (baseline de hallazgos históricos — 5 FPs de locale + 12 fingerprints históricos documentados). **Estado GitHub:** ver §1.1 (enablement y ruleset).

Referencia: `docs/CONTEXT-CICD.md` (§3.4/§3.5 estados workflow, §5.6 secret `GIT_LEAKS`, §5.7 GHAS, §13.4 artefactos, §14 actions pin), `docs/learning/quality-gates.md` (taxonomía gate/advisory + semántica `continue-on-error`), `docs/learning/docs-changelog-validation.md`, `docs/learning/typescript-strict-check.md`, `docs/pre-merge-gates-governance.md` (L1/L2/L3), `.github/workflows/{ci,scheduled-security}.yml`, `package.json` (scripts `security:secrets*`).

### 1.1 Estado GitHub (verificado por API, 2026-09-25 — change `secret-scanning`)

| Pieza                                       | Estado                                                                                            | Verificación                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `security.yml`                              | ✅ `active` (`gh workflow enable`)                                                                | `gh api repos/.../actions/workflows --jq '.workflows[] \| {path,state}'` |
| `scheduled-security.yml`                    | ✅ `active` (`gh workflow enable`)                                                                | idem                                                                     |
| Gate PR-time                                | job `secrets` (`Secret Detection`) en `ci.yml` substage 2C, en `prebuild-security-complete.needs` | YAML + estructura del agregador                                          |
| Ruleset `main`                              | `Secret Detection` añadido a `required_status_checks` (strict) junto a los 4 governance           | API del ruleset tras ≥1 run del PR de prueba                             |
| `secret_scanning` + push protection nativos | follow-up documentado (§5.7 CONTEXT-CICD) — decisión de UI/API, fuera del repo                    | §5.7                                                                     |

## 2. Referencias oficiales

| Fuente                              | URL                                                                                              | Nota clave                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Gitleaks repo/README (config + CLI) | `https://github.com/gitleaks/gitleaks`                                                           | README = doc canónica de config; **WARNING: "feature complete"** (solo security patches; dev → `betterleaks/betterleaks`) |
| Config default (reglas base)        | `https://github.com/gitleaks/gitleaks/blob/master/config/gitleaks.toml`                          | base de `[extend] useDefault = true`                                                                                      |
| Traducción comandos deprecados      | `https://gist.github.com/zricethezav/b325bb93ebf41b9c0b0507acf12810d2`                           | `detect`/`protect` → `git`/`dir`/`stdin` (v8.19.0)                                                                        |
| Gitleaks Action                     | `https://github.com/gitleaks/gitleaks-action`                                                    | `@v3` = Node 24; `GITLEAKS_LICENSE` solo orgs (gratis en `gitleaks.io`)                                                   |
| GitHub Secret Scanning (intro)      | `https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning`    | **Gratis y automático en repos públicos**; historial completo + issues/PRs/wikis/gists                                    |
| Custom patterns / exclusions        | `https://docs.github.com/en/code-security/how-tos/secure-your-secrets/customize-leak-detection`  | regex propias, AI regex, `secret_scanning.yml` para excluir paths, validity checks                                        |
| Push protection (prevención)        | `https://docs.github.com/en/code-security/how-tos/secure-your-secrets/prevent-future-leaks`      | bloquea pushes con secretos reconocidos                                                                                   |
| Trabajo con push protection         | `https://docs.github.com/en/code-security/how-tos/secure-your-secrets/work-with-leak-prevention` | bypass requests, entornos                                                                                                 |
| Detección de leaks (how-tos)        | `https://docs.github.com/en/code-security/how-tos/secure-your-secrets/detect-secret-leaks`       | índice de detección                                                                                                       |

> ⚠️ **Docs GitHub reestructurados (2026)**: las rutas antiguas `/en/code-security/secret-scanning/creating-and-validating-custom-patterns` y `/.../secret-scanning-push-protection` devuelven **404**. Rutas válidas = `/en/code-security/how-tos/secure-your-secrets/*` (verificado 2026-09-25). Producto renombrado a **GitHub Secret Protection** (Team/Enterprise Cloud para repos privados de org).

## 3. Gitleaks v8 — comandos, versiones, flags

### 3.1 Versiones

- **Latest release: `v8.30.1`** (API GitHub, 2026-09-25). Repo fija **`v8.30.1`** (Docker image en `ci.yml` job `secrets` y en los 2 steps de `scheduled-security.yml`; bump desde `v8.22.1` por change `secret-scanning`). Local CLI: `gitleaks 8.30.0`. README del proyecto documenta features de `v8.25.0`/`v8.28.0` ahora disponibles en el pin.
- **Estado del proyecto**: `Gitleaks is feature complete. I'm not merging new features... Future releases will be security patches only` → autor migrando a **Betterleaks**. Enterprise: seguir con gitleaks OK (parches de seguridad), pero evaluar Betterleaks a largo plazo.

### 3.2 Comandos (v8.19.0 deprecó `detect`/`protect`)

| Viejo (hoy en `package.json`)         | Nuevo                                | Uso                               |
| ------------------------------------- | ------------------------------------ | --------------------------------- |
| `gitleaks detect --source .`          | `gitleaks git .`                     | historial completo                |
| `gitleaks protect --staged`           | `gitleaks git --pre-commit --staged` | solo staged (pre-commit)          |
| `gitleaks protect --source .`         | `gitleaks git --pre-commit`          | working tree vía git              |
| `gitleaks detect --no-git --source .` | `gitleaks dir .`                     | archivos sin git (incluye `.env`) |
| `gitleaks detect --no-git --pipe`     | `gitleaks stdin`                     | piping                            |

Los comandos viejos **siguen funcionando** (ocultos de `--help`), pero son deprecados → migrar scripts `security:secrets` / `security:secrets:full`.

### 3.3 Flags relevantes

`--config/-c` · `GITLEAKS_CONFIG` · `GITLEAKS_CONFIG_TOML` (orden de precedencia, luego `(target)/.gitleaks.toml`, luego default) · `--exit-code` (default **1** = falla el job si hay hallazgo) · `--redact[=100]` (nunca loguear el secret) · `--report-format json|csv|junit|sarif|template` + `--report-path` · `--baseline-path` (ignora hallazgos viejos → **rollout enterprise sin romper CI**) · `-i/--gitleaks-ignore-path` (`.gitleaksignore`) · `--max-decode-depth` (base64/hex/percent, default 0) · `--max-archive-depth` (zip/tar, default 0) · `--max-target-megabytes` · `--timeout` · `--no-banner`.

**Modo `git` escanea `git log -p` (solo adiciones de patches)** → archivos **untracked** (`.env` local, `*.pem` sin commit) **NO se detectan**. Para cubrir working tree: `gitleaks dir .` aparte (o en pre-commit junto al `--staged`).

## 4. Config `.gitleaks.toml` — sintaxis y evaluación

### 4.1 Sintaxis oficial vigente

- `[extend]`: `useDefault = true` **XOR** `path = "..."` (no juntos); `disabledRules = ["id"]`; encadenable a profundidad 2; allowlists se **appenden**.
- `[[rules]]`: `id`, `description`, `regex` (**RE2/Go — sin lookaheads**), `secretGroup` (grupo para entropy), `entropy` (umbral Shannon), `path` (regex de path), `keywords` (prefiltro pre-regex, v8.6.0 → **gran ganancia de perf**), `tags`.
- Allowlists: **v8.21.0** `[rules.allowlist]` → `[[rules.allowlists]]`; **v8.25.0** `[allowlist]` global → `[[allowlists]]`. Campos: `commits`, `paths`, `regexes`, `stopwords`, `condition = "OR"|"AND"`, `regexTarget = "secret"|"match"|"line"`, `targetRules = ["id"]` (v8.25.0, allowlist compartida por reglas). **Global > rule-specific**.
- `gitleaks:allow` (comentario inline) · `.gitleaksignore` (fingerprint `commit:file:ruleId:line`, desde v8.10.0).
- **v8.28.0 `[[rules.required]]` (composite/proximity rules)** — `withinLines`/`withinColumns`; **experimental** (autor: "don't build a B2B SaaS on it").

### 4.2 Estado del `.gitleaks.toml` — hallazgos RESUELTOS (change `secret-scanning`, 2026-09-25)

> Los 7 hallazgos de la auditoría están corregidos; la tabla se conserva como registro histórico.

| #   | Hallazgo                                                                                                                                                                         | Impacto                                                                                                                                                                                | Acción                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 1   | `[[rules]] id = "generic-api-key"` **colisiona** con la regla default                                                                                                            | al hacer `[extend]`, la config custom **overridea** la regla default completa (default incluye `keywords` + entropy + allowlists propias) → se debilita una de las reglas más valiosas | renombrar a `custom-api-key` o eliminar y dejar la default                                                                        |
| 2   | Sin `keywords` en 5 reglas custom                                                                                                                                                | regex corre sobre todo el contenido → más lento en full-history scan                                                                                                                   | añadir `keywords = ["api_key","jwt","password","secret"]` etc.                                                                    |
| 3   | Reglas sin `entropy`/`secretGroup` y `.{10,}` no acotado                                                                                                                         | FPs (ya visible: 6 fingerprints en `.gitleaksignore` de `locale/`, y allowlists `locale`/socket/PM2)                                                                                   | añadir entropy + `stopwords` + `condition="AND"` con path                                                                         |
| 4   | `database-url` matchea URLs de base de datos (postgres, mysql, mongo)                                                                                                            | FP en docs, `.env.example`, `prisma`                                                                                                                                                   | allowlist `regexTarget="match"` para `example                                                                                     | placeholder`  |
| 5   | Exclusiones de path: `node_modules`, `dist`, `build`, `coverage`, `.next`, `.turbo`, `.cache`, locks, `.agents`, `.opencode`, `openspec`, `locale`, `tests`, `fixtures`, `mocks` | OK para `git` (no los ve igualmente). **Falta** `.vscode/`, `.git/` (irrelevante en modo git), `.env*`                                                                                 | añadir `.vscode/`; `.env` **NO excluir** en modo git (es exactamente donde vive un leak) — excluir solo si se añade escaneo `dir` |
| 6   | Allowlist paths `'''tests'''`/`'''__tests__'''` (substring)                                                                                                                      | excluye cualquier path que contenga "tests" → un secreto real en fixture pasa invisible                                                                                                | estrechar a regex anclada `'''(^                                                                                                  | /)tests?/'''` |
| 7   | `ecosystem.config.js` y 3 files socket allowlisteados por `REDIS_URL` placeholder                                                                                                | correcto (documentado en `CONTEXT-CICD` §13.4)                                                                                                                                         | mantener; preferir `stopwords` sobre path-exclusion total                                                                         |

### 4.3 Patrón enterprise mínimo recomendado (delta)

```toml
title = "Project One Secret Detection Policy"

[extend]
useDefault = true
disabledRules = ["generic-api-key"]   # ← evita override silencioso de la regla default

[[rules]]
id = "custom-api-key"
description = "Generic API key assignment"
regex = '''(?i)api[_-]?key['"]?\s*[:=]\s*['"][A-Za-z0-9_\-]{16,}['"]'''
keywords = ["api_key", "api-key", "apikey"]
entropy = 3.0
tags = ["api", "key"]

[[allowlists]]
description = "Editor/CI noise"
paths = ['''\.vscode/''', '''\.gitleaks\.toml''', '''(^|/)tests?/''', '''fixtures/''']

[[allowlists]]
description = "Known-good placeholders (AND: path + regex)"
condition = "AND"
regexTarget = "match"
paths = ['''apps/server/ecosystem\.config\.js''']
regexes = ['''redis://localhost''']
```

Rollout histórico sin romper CI: `gitleaks git --report-path base.json` → `gitleaks git --baseline-path base.json` (solo reporta hallazgos **nuevos**); complementar con `.gitleaksignore` por fingerprint.

**Baseline aplicado (change `secret-scanning`):** `.gitleaksignore` contiene hoy 5 fingerprints históricos de `locale/` + 12 fingerprints históricos generados tras el fix de config (regla renombrada `custom-api-key` + `keywords`/`entropy` re-introducen hallazgos latentes en commits viejos: placeholders de tutorial en `docs/omniroute-install-tutorial.md`, JWT/docstrings en paths muertos `server/docs`, `server/src/components` y la credencial de Cloudinary ya rotada/eliminada del código — hoy dotenv). PR-time es diff-scoped (`base..head`) y NO barre historial, así que el baseline no afecta al gate; el full-history semanal reporta solo hallazgos NUEVOS.

## 5. Patrones CI/CD

### 5.1 Pre-commit (L1, dev local) — actual

`.husky/pre-commit`: `lint-staged` → en paralelo `sast:semgrep` + `security:secrets` (`gitleaks git --pre-commit --staged --verbose --redact --config .gitleaks.toml`) → `exit 1` bloquea commit. Correcto según patrón oficial (fast-only; regresión en `pre-push` + CI). Alternativa oficial: hook `pre-commit` framework (`repos: gitleaks rev: v8.24.2, id: gitleaks`; `SKIP=gitleaks git commit` para saltarlo) — innecesario aquí, Husky ya orquesta.

**Deuda RESUELTA (change `secret-scanning`)**: scripts migrados a comandos vigentes:
`"security:secrets": "gitleaks git --pre-commit --staged --verbose --redact --config .gitleaks.toml"` ·
`"security:secrets:full": "gitleaks git --verbose --config .gitleaks.toml"`.
Verificado: ambos en verde sobre el repo limpio (con `.gitleaksignore` como baseline) y exit 1 con un secret plantado en staged.

### 5.2 Workflow PR-time (job `secrets` en `ci.yml`) — gate R1

> **Cambio (change `secret-scanning`):** el job migró de `security.yml` a `ci.yml` (substage 2C, inline junto a `dependency-review`) y está wireado al agregador `prebuild-security-complete.needs` — el Pre-Build falla si gitleaks detecta un secreto. El `name: Secret Detection` se mantiene EXACTO (renombrar rompe el binding del ruleset).

- `if: github.event_name == 'pull_request'`; `fetch-depth: 0`; scan **scoped al diff**: `git --log-opts="base.sha..head.sha" --redact --verbose` → cumple spec R1/R3 (historial viejo no rompe el PR).
- `GITHUB_TOKEN` en env = **obligatorio**: Gitleaks consulta la API de GitHub (lookup de config org/repo) y sin token devuelve **403** (nota ya documentada en YAML).
- Segundo step `gitleaks/gitleaks-action@v3` **solo si** `env.GIT_LEAKS != ''` (licencia), si no `::warning::`. Proyección `secrets → env` correcta (contexto `secrets` no disponible en `steps.if`).
- `gitleaks-action@v3` = Node 24; **`@v2` deja de funcionar tras 2026-09-16** (Node 20 removido de runners) → pin `@v3` ya correcto; `GITLEAKS_LICENSE` solo obligatorio para repos de **organización** (gratis en `gitleaks.io`; personal account = sin licencia).
- Caveat oficial del action: **no recomendado como integración de code-scanning** → alerta se marca resolved al borrar el secret del código aunque siga en el historial; remediación = **rotar** (+ opcional rewrite de historial).

### 5.3 `continue-on-error` vs `fail` (aplicado a secret scanning)

Semántica oficial ya documentada en `docs/learning/quality-gates.md` §3 (`needs.*.result`, `actions/toolkit#581`):

| Workflow / step                                 | Modo actual                                                                                   | ¿Correcto?                                                                                                                                                                                                       | Recomendación                                                      |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `security.yml` → step OSS gitleaks              | **fail** (exit 1 default)                                                                     | ✅ correcto para PR gate (R1: "SHALL fail the check")                                                                                                                                                            | **Nunca** `continue-on-error` aquí — un secret nuevo debe bloquear |
| `security.yml` → step licenciado                | condicional por secret                                                                        | ✅ cumple R3 (licencia nunca requisito)                                                                                                                                                                          | mantener warning `::warning::`                                     |
| `scheduled-security.yml` → 2 steps full-history | `continue-on-error: true` (audit mode)                                                        | ✅ cumple R2 ("NO fallar por reportar hallazgo")                                                                                                                                                                 | mantener; hallazgo histórico → issue/rotación, no bloqueo          |
| `scheduled-security.yml` → job `notify-failure` | `if: always()` + condición sobre `needs.gitleaks-full-scan.outputs.<id>-outcome == 'failure'` | ✅ RESUELTO (change `secret-scanning`): los outcomes de los scan steps se capturan como **outputs del job** (`steps.<id>.outcome` solo es legible intra-job) y el Issue se crea exactamente cuando un scan falló | mantener; verificar con un run `workflow_dispatch`                 |
| Wiring gate                                     | job `secrets` en `ci.yml` substage 2C, **wireado a `prebuild-security-complete.needs`**       | ✅ RESUELTO (change `secret-scanning`): el Pre-Build falla si gitleaks falla; `Secret Detection` añadido al ruleset `required_status_checks`                                                                     | mantener `name: Secret Detection` exacto                           |

Regla de oro (consistente con `quality-gates.md`): PR-time secret scan = **gate bloqueante**; scheduled full-history = **advisory/audit**; `continue-on-error` jamás en el gate PR. Fila de taxonomía añadida a `docs/learning/quality-gates.md` (change `secret-scanning`).

### 5.4 Capas complementarias activas hoy

- Semgrep `p/secrets` + `--severity ERROR --error` en `ci.yml` (job SAST, activo) → red de seguridad mientras `security.yml` esté disabled.
- Hook L1 local + DCO en `pre-push`.
- GitHub native secret scanning (**gratis en repo público**) = capa primaria recomendada (partner program notifica al proveedor para revocación; custom patterns; validity checks; exclusión de paths vía `secret_scanning.yml`). Hoy `secret_scanning` + `secret_scanning_push_protection` = **disabled** (`CONTEXT-CICD` §5.7/§7) → habilitar en Settings → Code security.

## 6. Comparación con `docs/CONTEXT-CICD.md` (§13.4 + gates)

| Punto                                                                                                                              | CONTEXT-CICD §13.4 / §5    | Evaluación con docs oficiales                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------- |
| Artefacto `.gitleaks.toml` referenciado por `apps/server/ecosystem.config.js` (allowlist)                                          | ✅ correcto                | confirmado en config actual L134-139                                                              |
| `GIT_LEAKS` = secret de licencia (§5.6, 5 secrets)                                                                                 | ✅                         | `GITLEAKS_LICENSE` solo requerido para orgs; si el repo es personal → ni hace falta provisionarlo |
| `security.yml` / `scheduled-security.yml` = ✅ `active` (API 2026-09-25, change `secret-scanning`); `security-digest.yml` sigue ⛔ | ✅ verificado por API      | R1 + R2 **operativos**                                                                            |
| GHAS / `secret_scanning` / push protection = DISABLED (§5.7, §7)                                                                   | ⚠️ follow-up documentado   | repo público → gratis; decisión de UI/API fuera del repo                                          |
| Pin de action `gitleaks/gitleaks-action` @v3                                                                                       | ✅ correcto                | obligatorio tras 2026-09-16 (Node 24)                                                             |
| Docker `zricethezav/gitleaks:v8.30.1`                                                                                              | ✅ bumped desde v8.22.1    | change `secret-scanning` (8 releases de retraso resueltos)                                        |
| `security:secrets` = `gitleaks git --pre-commit --staged`                                                                          | ✅ migrado desde `protect` | deprecado desde v8.19.0                                                                           |
| Tabla taxonomía gates (`quality-gates.md` §2)                                                                                      | ✅ fila añadida            | `secrets` = gate bloqueante (PR) / `gitleaks-full-scan` = advisory                                |

## 7. Plan de acción (ordenado por ROI)

> Estado tras el change `secret-scanning` (2026-09-25): items 1, 3-6 ejecutados; 2 sigue como follow-up documentado; 7-8 son política permanente.

1. ~~**Enable workflows**~~ ✅ `gh workflow enable` de `security.yml` + `scheduled-security.yml` (API: `active`) + `Secret Detection` añadido a required checks del ruleset `main` tras PR de prueba.
2. **Habilitar GitHub secret scanning + push protection** (gratis, repo público) → capa primaria; **FOLLOW-UP** documentado en `CONTEXT-CICD.md` §5.7.
3. ~~**Bump pin**~~ ✅ `v8.22.1` → `v8.30.1` en `ci.yml` + `scheduled-security.yml`.
4. ~~**Migrar scripts**~~ ✅ `protect`/`detect` → `git --pre-commit --staged` / `git` (§5.1).
5. ~~**Arreglar `.gitleaks.toml`**~~ ✅ `disabledRules = ["generic-api-key"]` + regla renombrada `custom-api-key`, `keywords`/`entropy`/`secretGroup`, allowlist `tests` anclada, `.vscode/`, placeholders `database-url`.
6. ~~**Fix `notify-failure`**~~ ✅ outcomes de scan steps capturados como outputs del job; `if: always()` + condición sobre `needs.*.outputs.*-outcome == 'failure'`.
7. **Baseline** del historial ✅ (12 fingerprints en `.gitleaksignore`) + política de rotación (secret detectado → rotar; rewrite histórico solo si el valor sigue vivo; `replacements.txt` ya allowlistado para `git-filter-repo`).
8. Vigilar **Betterleaks** como sucesor (gitleaks = feature complete, solo parches de seguridad).

## 8. Fuentes

- `https://github.com/gitleaks/gitleaks` (README: instalación, comandos, config, flags, `.gitleaksignore`, baselines, composites)
- `https://github.com/gitleaks/gitleaks/blob/master/config/gitleaks.toml`
- `https://github.com/gitleaks/gitleaks/releases` (latest `v8.30.1`)
- `https://gist.github.com/zricethezav/b325bb93ebf41b9c0b0507acf12810d2` (traducción `detect`/`protect` → `git`/`dir`/`stdin`)
- `https://github.com/gitleaks/gitleaks-action` (v3/Node24, `GITLEAKS_LICENSE`, env vars, caveats code-scanning)
- `https://gitleaks.io` (licencia gratis)
- `https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning`
- `https://docs.github.com/en/code-security/how-tos/secure-your-secrets/detect-secret-leaks`
- `https://docs.github.com/en/code-security/how-tos/secure-your-secrets/customize-leak-detection`
- `https://docs.github.com/en/code-security/how-tos/secure-your-secrets/prevent-future-leaks`
- `https://docs.github.com/en/code-security/how-tos/secure-your-secrets/work-with-leak-prevention`
- `https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security`
- Repo: `.gitleaks.toml`, `.gitleaksignore`, `.husky/pre-commit`, `.github/workflows/{security,scheduled-security,security-digest,ci}.yml`, `package.json`, `docs/CONTEXT-CICD.md`, `docs/learning/quality-gates.md`, `openspec/specs/ci-secret-scanning/spec.md`

> Verificado 2026-09-25 (versiones, URLs GitHub Docs con 301/404, estado de workflows y config locales).
