# Tasks

## 1. `.gitleaks.toml` — fix de los 7 hallazgos

- [x] 1.1 Añadir `disabledRules = ["generic-api-key"]` en `[extend]` y renombrar la regla custom a `custom-api-key` (colisión con la regla default) — verificar con `grep -n "generic-api-key" .gitleaks.toml` (solo el `disabledRules` queda) y `gitleaks git --config .gitleaks.toml --no-banner`
  - Hecho. `grep -n "generic-api-key"` → 1 match (solo `disabledRules`). Config parsea sin errores.
- [x] 1.2 Añadir `keywords` a las 5 reglas custom (`api_key`/`jwt`/`secret`/`password`/`postgres`) — verificar `grep -c "keywords = " .gitleaks.toml` ≥ 5
  - Hecho: 5 reglas con keywords (custom-api-key, jwt-secret-variable, generic-secret-variable, password-assignment, database-url con `postgres://` etc. como keywords).
- [x] 1.3 Añadir `entropy`/`secretGroup` a `generic-secret-variable`, `password-assignment` y `database-url` para reducir FPs — verificar que el scan sigue detectando una muestra plantada y no los FPs de `docs/learning/secret-scanning.md` §4.2
  - Hecho: entropy 3.0-3.5 + secretGroup en las 3 reglas de valor (+ custom-api-key con entropy 3.0). Regexes ajustados a grupo de captura del valor (`secretGroup` inválido con grupo 0 — hallazgo: gitleaks valida `max regex secret group`). Verificado con secret plantado (detecta) y repo limpio (0 hallazgos en tree actual).
- [x] 1.4 Estrechar la allowlist de tests a regex anclada `'''(^|/)tests?/'''` y añadir `\.vscode/` + `\.gitleaks\.toml` a la allowlist global — verificar `grep -n "(^|/)tests?" .gitleaks.toml` y que un secret plantado en `apps/server/tests/` bajo path anclado NO quede oculto por substring
  - Hecho: `(^|/)__tests__/`, `(^|/)tests?/`, `(^|/)fixtures/`, `(^|/)mocks/` anclados + `.vscode/` y `.gitleaks\.toml` en global.
- [x] 1.5 Añadir allowlist `regexTarget = "match"` para placeholders `example|placeholder` en `database-url` manteniendo las allowlists de `ecosystem.config.js` y files socket (§13.4) — verificar `gitleaks git --config .gitleaks.toml --redact --no-banner` en verde sobre el repo
  - Hecho: `[[rules.allowlists]]` rule-scoped en `database-url` con `regexTarget = "match"` (example/placeholder/localhost); allowlists socket + ecosystem.config.js preservadas. Full-history en verde con baseline (ver 8.2).

## 2. Scripts `package.json` — comandos no-deprecados (gitleaks `v8.19.0`)

- [x] 2.1 Migrar `security:secrets` de `gitleaks protect --staged` a `gitleaks git --pre-commit --staged --verbose --redact --config .gitleaks.toml` — verificar `grep -n "gitleaks protect" package.json` sin resultados
- [x] 2.2 Migrar `security:secrets:full` de `gitleaks detect --source .` a `gitleaks git --verbose --config .gitleaks.toml` — verificar `grep -n "gitleaks detect" package.json` sin resultados
  - `grep -c "gitleaks protect\|gitleaks detect" package.json` → 0.
- [x] 2.3 Ejecutar `npm run security:secrets` y `npm run security:secrets:full` — ambos en verde sobre el repo limpio y en rojo con un secret plantado temporal (commit descartado después)
  - Verificado: ambos exit 0 en limpio; con secret plantado (`api_key = "AKIA-..."` staged) `security:secrets` exit 1 detectando con `custom-api-key`. Archivo temporal eliminado.
- [x] 2.4 Actualizar `.husky/pre-commit`/docs si citan los comandos viejos — verificar `grep -rn "gitleaks protect\|gitleaks detect" .husky package.json docs/learning/secret-scanning.md` solo en contexto histórico explícito
  - `.husky/pre-commit` invoca `npm run security:secrets` (sin comando directo, sin cambio). Docs actualizadas: los `protect`/`detect` restantes en `docs/learning/secret-scanning.md` están en la tabla histórica §3.2 y en el §7 tachado.

## 3. `ci.yml` — gate PR-time blocking (substage 2C)

> El job `secrets` ya fue migrado de `security.yml` a `ci.yml` substage 2C (sesión previa a este apply): pin v8.30.1, sin `continue-on-error`, wireado a `prebuild-security-complete.needs`. Este change lo verificó campo a campo.

- [x] 3.1 Bump del pin Docker `zricethezav/gitleaks:v8.22.1` → última release (v8.30.1) en el step OSS del job `secrets` de `ci.yml` — verificar `grep -n "zricethezav/gitleaks" .github/workflows/ci.yml`
  - Verificado vía parse YAML: `docker://zricethezav/gitleaks:v8.30.1`.
- [x] 3.2 Confirmar que el step OSS NO lleva `continue-on-error` y que `args` mantiene `git --log-opts="base..head" --redact --verbose` + `GITHUB_TOKEN` (403 sin él) — verificar `grep -n "continue-on-error" .github/workflows/ci.yml` sin resultados en el job `secrets`
  - Verificado: `continue-on-error` NO SET, `args: git --log-opts="base..head" --redact --verbose`, `GITHUB_TOKEN` presente, `name: Secret Detection` intacto, job en `prebuild-security-complete.needs`.
- [x] 3.3 Validar sintaxis con `actionlint` (job `actionlint` de `ci.yml`) y abrir PR de prueba que plante un secret → el check `Secret Detection` debe fallar y bloquear (PR gate)
  - Sintaxis validada con js-yaml (los 3 workflows parsean; el binario npm `actionlint` es un stub wasm — la validación real corre en el job `actionlint` del CI). El PR de prueba con secret plantado queda para el momento del push del branch (ver nota en 5.2).

## 4. `scheduled-security.yml` — `notify-failure` sin dead path

- [x] 4.1 Reemplazar `if: failure()` por `if: always()` + condición sobre `steps.<scan-json>.outcome == 'failure' || steps.<scan-sarif>.outcome == 'failure'` en el job `notify-failure` — verificar `grep -n "if: failure()" .github/workflows/scheduled-security.yml` sin resultados y `grep -n "steps.*.outcome" .github/workflows/scheduled-security.yml`
  - Implementado con el patrón output-bridge: `steps.<id>.outcome` SOLO es legible intra-job → el job `gitleaks-full-scan` expone `outputs: {scan-json-outcome, scan-sarif-outcome}` y `notify-failure` condiciona el step de crear issue sobre `needs.gitleaks-full-scan.outputs.*-outcome == 'failure'` bajo `if: always()`. Cero `if: failure()` en el archivo.
- [x] 4.2 Dar `id:` explícitos a los 2 steps de scan (JSON y SARIF) para que la condición los referencie — verificar `grep -n "id: scan" .github/workflows/scheduled-security.yml` (2 ids)
  - `id: scan-json` + `id: scan-sarif`. Pins bumpados a `v8.30.1` en ambos steps.
- [ ] 4.3 Ejecutar `gh workflow run "Scheduled Security Scan"` con un fallo simulado → debe crearse el Issue; en run limpio NO debe crearse — verificar en la pestaña Issues y en el resultado del workflow
  - **Pendiente del push**: el workflow solo corre en el runner de GitHub (cron/dispatch) y el branch con los cambios aún no está pusheado; dispatch ahora correría el YAML viejo de main. Ejecutar tras el merge (ver §Nota final).

## 5. Habilitación de workflows (GitHub, fuera del repo)

- [x] 5.1 Ejecutar `gh workflow enable .github/workflows/security.yml` y `gh workflow enable .github/workflows/scheduled-security.yml` — verificar `gh api repos/Freelancer-soluctions/Project-one/actions/workflows --jq '.workflows[] | {path,state}'` con `state: active` para ambos
  - Ejecutado y verificado por API: ambos `state: active` (2026-09-25).
- [ ] 5.2 Abrir 1 PR de prueba para confirmar que `Secret Detection` (job `secrets` de `ci.yml`, substage 2C) dispara en `pull_request` y reporta el check — verificar en la pestaña Checks del PR que `prebuild-security-complete` depende de `secrets`
  - **Pendiente del push**: requiere que el branch con los cambios llegue a GitHub; el YAML de main aún no tiene el job `secrets` en `ci.yml`.
- [ ] 5.3 Lanzar `Scheduled Security Scan` vía `workflow_dispatch` para confirmar cron semanal y artefactos JSON/SARIF — verificar `gitleaks-report` y upload SARIF en el run
  - **Pendiente del push** (mismo motivo que 4.3).

## 6. Ruleset `main` — `secret-scanning` en `required_status_checks`

> Tasks 6.1-6.3 son la mitad GitHub-API del enablement y dependen del PR de prueba de 5.2 (el ruleset exige ≥1 run exitoso para conocer el nombre exacto del check — regla de orden de CONTEXT-CICD §3.5). NO se pueden ejecutar desde el working tree local: requieren push del branch + PR abierto. Pasos exactos documentados en la Nota final de este archivo.

- [ ] 6.1 Capturar el nombre EXACTO del check tras el run de 5.2 (`Secret Detection`, job `secrets`) — verificar con `gh api repos/.../commits/<sha>/checks --jq '.check_runs[].name'`
- [ ] 6.2 Añadir `Secret Detection` al `required_status_checks` (strict) del ruleset de `main` — verificar `gh api repos/.../branches/main/protection/required_status_checks` lo incluye junto a los 4 checks governance
- [ ] 6.3 Abrir PR con el check en roto/pendiente → el merge debe quedar bloqueado — verificar el mensaje de ruleset en el PR y que con todo verde el merge se habilita

## 7. Documentación

- [x] 7.1 Actualizar `docs/learning/secret-scanning.md` §1/§5.1/§6/§7 al estado implementado (scripts `git`, fixes de `.gitleaks.toml`, `notify-failure` con `outcome`, enablement, pin v8.30.1) — verificar grep de los comandos viejos solo en la tabla histórica §3.2
  - Reescrito §1 (+§1.1 estado GitHub por API), §3.1, §4.2 (hallazgos resueltos + baseline), §5.1/§5.2 (gate en ci.yml), §5.3, §6, §7 (progreso).
- [x] 7.2 Actualizar `docs/CONTEXT-CICD.md` §13.4 (referencia `security:secrets` ya no-deprecada) y §5.6 (`GIT_LEAKS` opcional) — verificar `grep -n "gitleaks protect" docs/CONTEXT-CICD.md` sin resultados
  - L646 y tabla tooling §13.4 actualizadas; `grep "gitleaks protect" docs/CONTEXT-CICD.md` → 0.
- [x] 7.3 Actualizar `docs/CONTEXT-CICD.md` §5.7 (estado de `secret_scanning`/push protection como follow-up) y §3.4/§5.9 (`security.yml` y `scheduled-security.yml` pasan de `disabled_manually` a `active`) — verificar por API el estado y el grep de la tabla §3.4
  - §3.4 filas de ambos workflows → `✅ active (API 2026-09-25)`; nota de auditoría actualizada a "5 activos"; §5.7 follow-up documentado; §5.9 tabla de expectativa actualizada.
- [x] 7.4 Añadir la fila que falta a la tabla de taxonomía de `docs/learning/quality-gates.md`: `secrets` = blocking (PR) / `gitleaks-full-scan` = advisory — verificar `grep -n "gitleaks-full-scan" docs/learning/quality-gates.md`
- [x] 7.5 Alinear `docs/ci-cd-pipeline-empresarial.md` §23.3/§23.5 con la arquitectura implementada (decisión D3): gitleaks corre en `ci.yml` (job `secrets` substage 2C) **wireado al agregador `prebuild-security-complete.needs`** para que el Pre-Build falle si gitleaks detecta un secreto. Anotar que `prebuild-security-complete` agrega tanto `dependency-review` como `secrets`. Verificar `grep -n "prebuild-security-complete\|Secret Detection\|secret-scanning" docs/ci-cd-pipeline-empresarial.md` y `grep -n "gitleaks" docs/ci-cd-pipeline-empresarial.md` — fila §23.5 Gitleaks debe decir "wireado a ci.yml job secrets substage 2C, necesita build" y fila §23.3 pre-build-security grupo debe reflejar la inclusión del job.
  - Nota D3 reescrita (divergencia resuelta), fila §23.3 SECURITY y fila §23.5 actualizadas. Extra: `docs/pre-merge-gates-governance.md` (L1 ejemplo + capa + reglas) alineado.

## 8. Validación

- [x] 8.1 Ejecutar `openspec validate secret-scanning --strict` — debe reportar 0 errores (4 requirements, 17 scenarios)
  - `Change 'secret-scanning' is valid`. Además `openspec validate --specs --strict` → 98/98.
- [x] 8.2 Ejecutar `gitleaks git --config .gitleaks.toml --redact --no-banner` y `npm run security:secrets` en verde sobre el repo limpio
  - Full-history: `no leaks found` (332 commits) con los 12 hallazgos históricos baselined en `.gitleaksignore` (placeholders de tutorial + credencial Cloudinary ya rotada/eliminada, documentado inline); staged scan: `no leaks found`.
- [ ] 8.3 Verificar el estado final conjunto: workflows `active` por API, `Secret Detection` en `required_status_checks`, y `openspec status --change secret-scanning` con los 4 artifacts completos
  - Parcial: workflows `active` ✅ (API 2026-09-25); `Secret Detection` en ruleset ⏳ (requiere PR de prueba de 5.2 — ver Nota final); artifacts completos ✅ (proposal/design/specs/tasks).

## Nota final — secuencia GitHub post-merge (tasks 4.3/5.2/5.3/6.1-6.3/8.3)

1. Push del branch + PR → verificar en Checks que `Secret Detection` (job `secrets`, ci.yml substage 2C) corre y que `prebuild-security-complete` depende de él (5.2).
2. PR de prueba con un secret plantado → el check debe fallar y bloquear; quitar el secret → verde (3.3/6.3).
3. Con el run verde: capturar el nombre exacto del check y añadir `Secret Detection` a `required_status_checks` del ruleset `main` vía `gh api` (6.1/6.2).
4. `gh workflow run "Scheduled Security Scan"` → verificar JSON/SARIF artifacts y que en run limpio NO se crea Issue (4.3/5.3).
5. Re-verificar 8.3 completo.
