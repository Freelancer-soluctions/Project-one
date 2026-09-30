# Design

## Context

Secret scanning existe en 3 capas (L1 hook local, L3 PR-time `security.yml`, L3 audit semanal `scheduled-security.yml`) pero las 2 capas CI están `disabled_manually` en GitHub y la config tiene deuda. Datos clave (fuente: `docs/learning/secret-scanning.md`, verificado 2026-09-25):

- `.gitleaks.toml` (139 líneas): `useDefault = true` + 5 reglas custom + 4 allowlists; **7 hallazgos** (§4.2) — el más grave: `[[rules]] id = "generic-api-key"` **overridea** la regla default completa al hacer `[extend]` (keywords + entropy + allowlists propias se pierden).
- `package.json` L56-57: `gitleaks detect --source .` y `gitleaks protect --staged` → deprecados desde **`v8.19.0`** (aún funcionan, ocultos de `--help`).
- `security.yml` job `secrets` (`name: Secret Detection`): scan diff-scoped `git --log-opts="base..head"`, `GITHUB_TOKEN` obligatorio (403 sin él), acción licenciada condicionada a `env.GIT_LEAKS` (§5.6) → `secrets.*` no disponible en `steps.if`.
- `scheduled-security.yml`: 2 steps full-history con `continue-on-error: true` (modo audit, cumple R2) → el job **nunca** pasa a `failure`, así que `notify-failure` con `if: failure()` es código muerto.
- Wiring: el job `secrets` no está en `needs` de `ci-complete`; el ruleset `main` solo exige 4 checks governance (§3.5/§5.2).

Ver proposal.md - Why.

## Goals / Non-Goals

**Goals:**

- Gate PR-time de secretos **real y bloqueante**: workflow habilitado + check requerido por ruleset.
- `.gitleaks.toml` sin colisiones de reglas y con allowlists estrechas (no ocultan secrets reales).
- Scripts con comandos vigentes de gitleaks (`git`/`dir`/`stdin`).
- `notify-failure` operativo (detecta hallazgos-fallo vía `steps.*.outcome`).
- Taxonomía `blocking`/`advisory` explícita y documentada.

**Non-Goals:**

- Habilitar GHAS / `secret_scanning` / push protection desde el repo (toggle de GitHub UI/API, `CONTEXT-CICD` §5.7 — se documenta, no se automatiza aquí).
- Reescribir el historial git ni rotar secrets (política de remediación aparte; `replacements.txt` ya allowlistado).
- Bump de gitleaks a `betterleaks` (sucesor; gitleaks = feature complete, solo parches de seguridad).
- Cambiar los scan steps audit de `scheduled-security.yml` a modo bloqueante.

## Decisions

### D1: Taxonomía `blocking`/`advisory` para el gate `secrets` PR-time

Clasificación única y explícita, consistente con `docs/learning/quality-gates.md`:

| Check                                        | Workflow / job                                  | Modo                                            | Nivel                           |
| -------------------------------------------- | ----------------------------------------------- | ----------------------------------------------- | ------------------------------- |
| `Secret Detection` (check `secret-scanning`) | `security.yml` → job `secrets`                  | exit 1 default, **sin** `continue-on-error`     | **blocking** (PR gate)          |
| `Gitleaks Full History Scan`                 | `scheduled-security.yml` → `gitleaks-full-scan` | `continue-on-error: true` + artifact JSON/SARIF | **advisory/audit**              |
| Licensed step                                | `security.yml` step condicional `env.GIT_LEAKS` | `::warning::` si no hay licencia                | advisory (nunca requisito — R3) |

Regla de oro: **`continue-on-error` jamás en el gate PR**; un secret nuevo debe bloquear. El scheduled full-history es advisory porque un hallazgo histórico exige **rotación + issue**, no bloquear merges (R2: "NO fallar por reportar hallazgo"). Añadir la fila que falta en la tabla de taxonomía de `quality-gates.md`.

Alternativa descartada: ambos bloqueantes → un FP histórico de `.gitleaksignore`/baseline bloquearía toda la rama principal semanalmente. Alternativa descartada: ambos advisory → ningún gate PR-time (estado actual, que es precisamente el problema).

### D2: CI fixes — comandos `gitleaks git`, `.gitleaks.toml` y `notify-failure` por `outcome`

1. **Comandos** (`package.json`):
   - `"security:secrets": "gitleaks git --pre-commit --staged --verbose --redact --config .gitleaks.toml"`
   - `"security:secrets:full": "gitleaks git --verbose --config .gitleaks.toml"`
   - Traducción oficial (`v8.19.0`): `detect --source .` → `git .`; `protect --staged` → `git --pre-commit --staged`; `detect --no-git --source .` → `dir .`. Nota: modo `git` escanea adiciones de patches → untracked (`.env`, `*.pem`) no se detecta; si se añade escaneo `dir`, excluir `.env*` en allowlist (hoy NO excluir).
2. **`.gitleaks.toml`** (7 hallazgos §4.2):
   - `[extend] disabledRules = ["generic-api-key"]` + renombrar la regla custom a `custom-api-key` (evita el override silencioso de la regla default).
   - `keywords` en las 5 reglas custom (prefiltro pre-regex → perf en full-history) y `entropy`/`secretGroup` en `generic-secret-variable`/`password-assignment`/`database-url` (menos FPs).
   - Allowlist de tests anclada `'''(^|/)tests?/'''` en vez del substring `'''tests'''` (hoy un secret en fixture pasa invisible).
   - Añadir `\.vscode/` y `\.gitleaks\.toml` a allowlist global; `database-url` con allowlist `regexTarget = "match"` para `example|placeholder`.
   - Mantener allowlists de `ecosystem.config.js` + 3 files socket (correctas, documentadas en `CONTEXT-CICD` §13.4) — preferir `stopwords` sobre exclusión total de path.
3. **`notify-failure`** (`scheduled-security.yml`): los steps con `continue-on-error: true` dejan el job en `success` → `if: failure()` es dead path. Fix:
   ```yaml
   notify-failure:
     if: always()
     # condición por step outcome, no por resultado del job
     # steps.<scan-json>.outcome == 'failure' || steps.<scan-sarif>.outcome == 'failure'
   ```
   (`needs.*.result` sigue siendo `success`; solo `steps.*.outcome` refleja el fallo del step con `continue-on-error` — semántica oficial documentada en `quality-gates.md` §3, `actions/toolkit#581`.)
4. **Pin**: `zricethezav/gitleaks:v8.22.1` → última release (v8.30.1) en `security.yml` y `scheduled-security.yml`.

Alternativa descartada para `notify-failure`: quitar `continue-on-error` → el run fallaría por hallazgos históricos, violando R2 (modo audit).

### D3: Habilitar `security.yml` y `scheduled-security.yml` + `secret-scanning` en `required_status_checks`

1. **Enable** (sin tocar YAML): `gh workflow enable .github/workflows/security.yml` y `gh workflow enable .github/workflows/scheduled-security.yml`; verificar con `gh api repos/.../actions/workflows` que `state = active` (los 2 están `disabled_manually`, §3.4/§5.9).
2. **Orden obligatorio** (reglas 7/8 de `CONTEXT-CICD`): primero ≥1 run exitoso del workflow para conocer el **nombre exacto** del status check, **después** añadirlo al ruleset. El nombre es el `name:` del job: `Secret Detection` (job `secrets` de `ci.yml`, substage 2C) — referenciado como check `secret-scanning` en esta change. Renombrar el job rompe el binding (strict=true).
3. **Ruleset `main`**: añadir `Secret Detection` al `required_status_checks` (hoy solo los 4 checks governance, strict). Rationale: R1 vale a nivel check pero **no** a nivel ruleset — sin esto el gate es opcional (cualquiera puede mergear en verde). No wirear a `ci-complete.needs` (evita acoplar el agregador de gobernanza); wireado al substage `prebuild-security-complete.needs` (ci.yml) para que el Pre-Build falle si gitleaks falla.

Alternativa descartada: mantener `secrets` en `security.yml` sin wire a prebuild-security-complete — el ruleset bloquea merge pero §23.5 (Pre-Build / CI) queda desincronizada; el usuario explícito exige gitleaks en ci.yml.

## Risks / Trade-offs

- [Habilitar `security.yml` puede fallar el primer PR por FPs de config] → fixes de `.gitleaks.toml` + baseline (`.gitleaksignore` con fingerprints `commit:file:ruleId:line`) **antes** de añadir el check al ruleset; el check se agrega en 2 pasos (run exitoso → ruleset).
- [Regla renombrada/default recuperada reintroduce hallazgos latentes en historial] → PR-time es diff-scoped (`base..head`), no barre historial; el full-history sigue advisory con artifact.
- [`GIT_LEAKS` sin provisionar (§5.6)] → solo desactiva el step licenciado (R3: licencia nunca requisito); el OSS gate sigue bloqueando.
- [`notify-failure` mal condicionado crea issues en cada run limpio] → condición `steps.*.outcome` verificable con un run de `workflow_dispatch` de prueba.
- [Bump v8.22.1 → v8.30.1 cambia reglas default] → revisar diff de hallazgos en el primer run; rollback = pin anterior.
- [Docs quedan desincronizadas del estado GitHub] → grupo de documentación con verificación grep-eable (`CONTEXT-CICD` §13.4/§5.6/§5.7).

## Migration Plan

1. Fix `.gitleaks.toml` + scripts (`git` no-deprecado) y validar localmente con `gitleaks git --redact --no-banner`.
2. Fix `notify-failure` (outcome) + bump de pin Docker en ambos workflows.
3. `gh workflow enable` de `security.yml` y `scheduled-security.yml`; 1 PR de prueba → verificar que el check `Secret Detection` aparece y falla/pasa correctamente.
4. Añadir `Secret Detection` (check `secret-scanning`) al `required_status_checks` del ruleset `main`.
5. Actualizar docs + `openspec validate --strict`.

Rollback: `gh workflow disable <file>` revierte el enablement sin tocar código; el ruleset puede quitarse el check con un solo `gh api` (el YAML queda intacto); cada fix de config/scripts es revertible por commit.

## Open Questions

- Habilitar `secret_scanning` + `secret_scanning_push_protection` de GitHub (gratis, repo público, `CONTEXT-CICD` §5.7): decisión de GitHub UI/API fuera del repo → se deja documentada como follow-up, no cambia specs ni tasks.
