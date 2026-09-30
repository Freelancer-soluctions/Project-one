# Design

## Context

Estado verificado 2026-09-26 (fuentes: `docs/learning/sca-dependency-lockfile-scan.md` §1/§4/§9, `docs/learning/iac-scanning.md` actualizado 2026-09-26 §1/§2/§5/§7, `docs/ci-cd-pipeline-empresarial.md` §23.3):

| Capa                                    | Herramienta                                                                                                                                                 | Estado                                                                                                                        |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Manifest PR (vuln + licencia)           | `actions/dependency-review-action@v5` en `ci.yml` (job `dependency-review`; `fail-on-severity: moderate`, clave `deny-licenses`)                            | ✅ blocking (change `dependency-review`) — **no se reemplaza**                                                                |
| Lockfile resuelto (`package-lock.json`) | `npm audit` solo en `ci-enterprise.yml` L117 (workflow `disabled_manually`); `scheduled-security.yml` sin lockfile audit; `security-digest.yml` usa OSV     | ❌ **gap**: CVE en versiones transitivas resueltas pueden vivir en `main`                                                     |
| Filesystem CVE                          | Trivy `security.yml` job `dependency-scan` (activo desde **2026-09-25**, API `state: active`, audit `continue-on-error: true`)                              | ✅ no se toca                                                                                                                 |
| Prevención                              | `.github/dependabot.yml` **existente** (npm + github-actions + docker, `weekly` lunes 03:00 UTC, `groups.dev-dependencies`, `open-pull-requests-limit: 10`) | ✅ solo ajustar (grupo `security-patches` + `cooldown`)                                                                       |
| Semanal                                 | `scheduled-security.yml` (cron `0 3 * * 1`) = `gitleaks-full-scan` + `scancode-license-audit` + `notify-failure`                                            | ❌ sin lockfile audit y **sin IaC** (este change)                                                                             |
| IaC (`.tf`, `Dockerfile`, `k8s`)        | Ningún job: sin `checkov` / `tfsec` / `kics` (gap completo, `iac-scanning.md` §2)                                                                           | ❌ **gap** — la casilla "IaC Scanning (Checkov/tfsec/KICS)" ya está prevista en §23.3 (`ci-cd-pipeline-empresarial.md` L2852) |
| Local pre-commit                        | `.husky/pre-commit` = lint-staged + SAST semgrep + secrets, todo bloqueante bajo `set -e`                                                                   | ❌ sin capa advisory de lockfile ni de IaC                                                                                    |

Docs con gaps: `quality-gates.md` §2/§4.4 sin fila `lockfile-audit*` ni `checkov-iac*`; `license-policy.md` §6 sin capa de CVE; `sca-dependency-lockfile-scan.md` §9 registra los 3 bloqueos (scancode fuera de PATH, `scan-list.txt` inexistente, `npm audit` sin SARIF).

Constraint: regla del repo — un change no mezcla stages (pre-merge vs scheduled/post-merge) y no toca código de aplicación; `security.yml` y `security-digest.yml` quedan fuera de alcance (ver `AGENTS.md` + `docs/pre-merge-gates-governance.md`).

## Goals / Non-Goals

**Goals:**

- **L1/L2/L3 de lockfile**: capa advisory local (`npm audit` en `.husky/pre-commit`), job `lockfile-audit` PR-time en `ci.yml` (artifact 14d) y job `lockfile-audit-weekly` en `scheduled-security.yml` (artifact 90d) — umbral `moderate`.
- **Capa IaC advisory**: job `checkov-iac` pre-build en `ci.yml` (paralelo a `dependency-review`) + `checkov-iac-weekly` en `scheduled-security.yml`, con política como código en `.checkov.yml` (patrón `iac-scanning.md` §5.1/§5.3).
- **Prevención**: ajuste del `dependabot.yml` existente (grupo `security-patches` con `applies-to: security-updates`, solo `patch` + `cooldown`/`default-days`) — no se crea archivo nuevo y no es gate de merge.
- **Taxonomía completa**: filas `lockfile-audit`, `lockfile-audit-weekly`, `checkov-iac`, `checkov-iac-weekly` en `quality-gates.md` §2/§4.4 y la capa CVE en `license-policy.md` §6.
- **Separación de capas documentada**: lockfile/CVE (este change) vs licencia por archivo + deny-list (`license-compliance`) vs manifest PR (`dependency-review`) vs IaC (`iac-scanning.md`) — complementarias, ninguna sustituye a otra.
- Docs de gobernanza sin enlaces rotos, sin filas duplicadas (no repetir `dependency-review` ni `scancode-license-audit`) y con los 3 bloqueos registrados.

**Non-Goals:**

- NO Snyk (requiere `SNYK_TOKEN` + org; documentado como alternativa en `sca-dependency-lockfile-scan.md` §3.2, no implementado).
- NO tocar `security.yml` ni `security-digest.yml` (Trivy filesystem activo 2026-09-25; digest con OSV — solo se documenta la separación de fuentes).
- NO `allow-licenses`/`deny-licenses` nuevos ni cambio de `fail-on-severity`: esta capa detecta **CVE**, no licencias (deny-list en la clave `deny-licenses` del job `dependency-review`, responsabilidad de `license-compliance`).
- NO reemplazar `dependency-review` (manifest PR blocking) ni los jobs `scancode-license-audit`/`scancode-license-pr-diff`.
- NO `tfsec` (archivado: `aquasecurity/tfsec` → "part of Trivy") ni KICS (capa secundaria futura si el repo crece con `k8s/`/`pulumi/`).
- NO hook de pre-commit bloqueante: las capas nuevas son advisory y la cadena `set -e` actual (lint-staged + SAST + secrets) no se extiende.
- NO crear `.github/dependabot.yml` (ya existe) ni automatizar `npm audit fix --force`.

## Pipeline — diagrama simplificado (ref: `docs/ci-cd-pipeline-empresarial.md` §23.3, L2834-2856)

```text
ci.yml (pull_request) — STAGE 2 PRE-BUILD / SECURITY (substage 2C)
repo-discovery (dorny/paths-filter) ──► DAG de jobs paralelos (0 dependencia de build)
  ├─ dependency-review  [blocking (PR)]     manifest: vuln >= moderate + deny-licenses
  ├─ lockfile-audit     [advisory FASE 1]   npm audit --moderate (lockfile directo) → artifact 14d
  ├─ checkov-iac        [advisory FASE 1]   checkov-action soft_fail → artifact 14d
  └─ secrets / SAST (early-abort) ...
  └─► prebuild-security-complete (needs: dependency-review, secrets, ...)
        FASE 2 gradual: + lockfile-audit / checkov-iac (2-4 semanas de runs limpios)

scheduled-security.yml (cron 0 3 * * 1 — lunes 03:00 UTC, workflow_dispatch)
  ├─ gitleaks-full-scan / scancode-license-audit   [ya existentes — no se tocan]
  ├─ lockfile-audit-weekly  [advisory]  npm audit JSON + npm sbom → 90d (sin Trivy: ya corre en security.yml)
  ├─ checkov-iac-weekly     [advisory]  checkov SARIF + upload-sarif@v4 → 90d
  └─► notify-failure (ya existente)
```

`checkov-iac` y `lockfile-audit` corren **en paralelo** a `dependency-review` (mismo stage pre-build, sin `needs` entre ellos); ninguno depende de `build`. En FASE 1 ninguno entra a `prebuild-security-complete.needs` de forma bloqueante.

### D1 — Alcance: documentación + config de CI, nunca código de aplicación

Artefactos: docs (`.md`), YAML de workflows, `.checkov.yml` (política como código) y pasos advisory en `.husky/pre-commit`. Ni la lógica de negocio ni `scripts/security/generate-security-digest.mjs` se tocan.

- _Alternativa descartada_: transformador propio JSON→SARIF de `npm audit` → innecesario en FASE 1: el JSON crudo se conserva como artifact y el CVE de filesystem semanal ya corre en `security.yml` (job `dependency-scan`, mismo cron, SARIF `category: trivy`) — añadir otro Trivy fs en `scheduled-security.yml` duplicaría hallazgos idénticos en el Security tab (bloqueo 3, `iac-scanning.md` §6 / `sca-dependency-lockfile-scan.md` §9).

### D2 — Pipeline de 3 capas (L1 local, L2 PR, L3 audit) + capa IaC

- **L1 pre-commit (advisory)**: `npm audit --audit-level=moderate || true` y `checkov -d . --soft-fail`, ambos **fuera** de la cadena `set -e` — solo informan; lint-staged + SAST + secrets siguen siendo los únicos bloqueantes locales.
- **L2 PR-time (FASE 1 advisory)**: `lockfile-audit` (`npm audit --audit-level=moderate --json` sobre el lockfile commiteado, sin `npm ci` — el audit lo lee directamente y la instalación añadiría 1-3 min por PR sin valor, `if: github.event_name == 'pull_request'`, `needs: repo-discovery`, `timeout-minutes` acotado, artifact `lockfile-audit-pr` con `retention-days: 14`, `continue-on-error: true`) y `checkov-iac` (`bridgecrewio/checkov-action` con `soft_fail: true`, SARIF/JSON → artifact `checkov-report-pr` 14d) — paralelos a `dependency-review`, sin entrada bloqueante en `prebuild-security-complete` en FASE 1.
- **L3 semanal (advisory)**: `lockfile-audit-weekly` y `checkov-iac-weekly` en `scheduled-security.yml`, siguiendo el patrón audit-mode de `gitleaks-full-scan`/`scancode-license-audit` (`continue-on-error: true` + `upload-artifact` con `retention-days: 90` + `upload-sarif@v4` con `category` propio).
- **Prevención (no gate)**: `dependabot.yml` actualizado reduce la llegada de CVE pero nunca bloquea un merge por un CVE existente — taxonomía propia, distinta de `blocking (PR)` y de `advisory`.
- _Alternativa descartada_: un solo job monolítico (lockfile + IaC) → acopla ciclos distintos (npm vs checkov), impide promover fases por separado y duplicaría responsabilidades con `dependency-review`.

### D3 — Taxonomía `blocking`/`advisory` y `quality-gates.md` como registro único

- `dependency-review` (L2 existente) → `blocking (PR)` (fila existente: se referencia, no se duplica).
- `lockfile-audit` (L2 nuevo) → `advisory (PR, fase 1)` → `blocking (PR)` en FASE 2; `checkov-iac` (L2 nuevo) → `advisory (PR, fase 1)` → `blocking (PR)` en FASE 2.
- `lockfile-audit-weekly` y `checkov-iac-weekly` (L3) → `advisory (scheduled)`: `continue-on-error: true`, sin `needs` de agregadores ni ruleset; su fallo alimenta `notify-failure`, no bloquea merge ni release.
- `dependabot.yml` → taxonomía de **prevención** (no es `blocking`, no es `advisory`).
- Regla: toda capa nueva declarada en `quality-gates.md` §2 **antes** de considerarse activa; los checks L2 solo entran a `required_status_checks` cuando pasan a FASE 2 (GitHub solo permite checks que corren en PR — los L3 jamás).

### D4 — Complementariedad: ninguna capa sustituye a otra

- `dependency-review` evalúa el **manifiesto del diff** (vuln + licencia, blocking); `lockfile-audit` audita el **lockfile resuelto completo** (transitivos, advisory) — fuentes distintas, umbral coincidente (`moderate`), ninguna reemplaza a la otra.
- Trivy `security.yml` cubre **filesystem/OS** (activo 2026-09-25) y `security-digest.yml` usa **OSV**: solo se documenta la separación de fuentes, no se reconfigura.
- `checkov-iac` cubre **configuración de infraestructura** (IaC/Dockerfile/k8s) — el único gap de la casilla §23.3; no solapa con SAST (código) ni con SCA (dependencias).
- La deny-list (clave `deny-licenses` del job `dependency-review`) y `fail-on-severity` quedan intactas: este change aporta CVE, no licencias (responsabilidad de `license-compliance`).
- _Alternativa descartada_: fusionar el lockfile audit en `dependency-review` → imposible: `dependency-review-action` solo lee manifiestos del diff y no ejecuta `npm audit`.

### D5 — Arranque advisory y bloqueo gradual (FASE 1 → FASE 2)

- FASE 1: `continue-on-error: true` (steps/jobs de lockfile) y `soft_fail: true` (`checkov-iac`); hallazgos visibles (log + artifact 14d/90d) sin bloquear; medir tasa de falsos positivos 2-4 semanas.
- FASE 2: remoción gradual — un check por PR a la vez (quitar `continue-on-error`/`soft_fail`, añadir `lockfile-audit` y/o `checkov-iac` a `needs` del agregador `prebuild-security-complete` en `ci.yml`, anclado por nombre de job) + `checkov --baseline .checkov.baseline` (`fail-on-new`) para no penalizar deuda histórica; actualizar `quality-gates.md` y `license-policy.md` al cambiar de fase.
- Precedente interno: early-abort SAST, `dependency-review` y `scancode-license-pr-diff` arrancaron non-blocking → blocking tras evidencia (§23.3, L2819/L2850).

### D6 — Validación local obligatoria antes de merge

- `npm audit --audit-level=moderate` sobre el lockfile commiteado debe pasar sin hallazgos `>= moderate` (en un checkout de trabajo el árbol ya está instalado; `npm ci` solo si se quiere validar desde un estado limpio); ante fallo se corrige `package-lock.json` (remediación o actualización), **nunca** `npm audit fix --force` sin revisión humana (`npm audit fix --dry-run` como preview).
- `checkov -d . --soft-fail --check CKV_AWS_1,CKV_AWS_2` con `.checkov.yml` como política versionada; en FASE 2 se quita `--soft-fail` solo tras baseline limpio y ventana sin falsos positivos.
- Comandos documentados en `sca-dependency-lockfile-scan.md` §5/§7 y `iac-scanning.md` §5.4/§7 (D6), enlazados desde `license-policy.md` §7 (patrón de la capa L1 de ScanCode).

## Risks / Trade-offs

- [`scancode` NO está en PATH (`scancode: command not found`) y `scan-list.txt` NO existe (0 matches)] → no bloquea el diseño: la validación de la capa de licencias usa la imagen Docker pinnada `aboutcode/scancode-toolkit:32.5.0` (requiere `docker pull`) y la lista PR-diff es `git diff --name-only --diff-filter=ACMR` generada en runtime (bloques 1-2, `iac-scanning.md` §6; este change no crea `scan-list.txt`).
- [`npm audit` NO emite SARIF nativo] → el JSON de `npm audit` se conserva como artifact; el SARIF de CVE filesystem ya existe vía el Trivy semanal de `security.yml` (`category: trivy`) y NO se duplica en este change; si se necesitara SARIF propio sería un transformador JSON→SARIF (no implementado) (bloqueo 3).
- [`tfsec` archivado / deprecado ("part of Trivy")] → se elige `checkov` como capa IaC principal (reglas AWS, `soft-fail` nativo, baseline `fail-on-new`); KICS queda como secundaria futura. Riesgo mitigado: no introducir una herramienta sin mantenimiento (`iac-scanning.md` §3/§7 D1).
- [`checkov` sin `soft-fail` bloquea todo PR con deuda histórica] → `soft_fail: true` + `.checkov.yml` con `skip-check`/`compact`; baseline creado tras el primer scan limpio antes de FASE 2.
- [Audit advisory se ignora silenciosamente] → artifacts 14d/90d + `notify-failure` existente en `scheduled-security.yml`; filas de taxonomía con condición explícita de FASE 2.
- [Almacenamiento: 2 artifacts 90d nuevos (`audit-weekly.json`+SBOM, `checkov-weekly`)] → <100MB cada uno, nombres diferenciados de los de `license-compliance` (precedente `iac-scanning.md` §6).
- [Tiempo de CI: 3 gates nuevos por PR] → pre-build paralelo vía `repo-discovery` DAG, sin dependencia de `build`, `timeout-minutes` acotado (10 min en `checkov-iac`).
- [Drift entre docs (`quality-gates.md`, `license-policy.md`, `sca-dependency-lockfile-scan.md`, `iac-scanning.md`)] → task final de greps de coherencia + `openspec validate --strict`; las filas nuevas no duplican `dependency-review` ni `scancode-*`.

## Migration Plan

1. **Crear `.checkov.yml`** en la raíz (`soft-fail: true`, `compact`, `quiet`, `framework: dockerfile terraform kubernetes`, `skip-check` documentado) — política como código versionada; no afecta pipelines existentes. La CLI de checkov **auto-lee** `.checkov.yml` del working directory; los jobs lo pasan además explícito vía el input `config_file` de `checkov-action` (ancla estable, independiente del cwd).
2. **Crear el job `checkov-iac` en `ci.yml`** (substage 2C, paralelo a `dependency-review`, FASE 1: `soft_fail: true`/`continue-on-error: true`, artifact `checkov-report-pr` 14d, `timeout-minutes: 10`) + job `lockfile-audit` (`needs: repo-discovery`, artifact 14d) — validados en un PR de prueba; rollback = borrar los jobs.
3. **Extender `.github/workflows/scheduled-security.yml`** con `lockfile-audit-weekly` y `checkov-iac-weekly` (patrón audit-mode, `continue-on-error: true`, artifacts 90d + SARIF) — validar con `workflow_dispatch` (trigger ya presente) antes del primer cron; rollback = borrar los jobs.
4. **Pre-commit hook advisory**: añadir a `.husky/pre-commit` los pasos `npm audit ... || true` y `checkov -d . --soft-fail` **fuera** de la cadena `set -e` (no bloqueantes).
5. **Ajustar `.github/dependabot.yml`** (grupo `security-patches` + `cooldown`) — prevención, sin tocar `schedule` ni `groups.dev-dependencies`.
6. **Validar local**: `npm audit --audit-level=moderate` (sobre el lockfile commiteado); `checkov -d . --soft-fail --check CKV_AWS_1,CKV_AWS_2`; `docker pull aboutcode/scancode-toolkit:32.5.0` (desbloqueo del bloqueo 1); parse `js-yaml` de los 2 workflows + greps.
7. **Docs y cierre**: filas en `quality-gates.md` §2/§4.4, capa en `license-policy.md` §6, estado en `sca-dependency-lockfile-scan.md` §9 e `iac-scanning.md` §9; `openspec validate sca-lockfile-compliance --strict`.
8. **Ventana de medición 2-4 semanas → FASE 2** (D5): quitar flags de un check por vez, añadir a `prebuild-security-complete.needs`, crear `.checkov.baseline`, actualizar filas de taxonomía.

## Open Questions

- ¿`fail-on-scopes: development` en `dependency-review`? — fuera de alcance aquí (pertenece a `license-compliance`/`dependency-review`), queda documentado como pendiente.
- ¿Incluir el resumen de hallazgos del lockfile en `security-digest.yml` semanal? — deferrable; no cambia specs ni task breakdown (seguimiento opcional tras FASE 1).
- ¿PR comment con findings de `checkov`? — `checkov-action` no emite comment nativo (requiere transformación); opcional tras FASE 1.
