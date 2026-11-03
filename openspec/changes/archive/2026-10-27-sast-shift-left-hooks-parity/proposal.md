# Proposal

## Why

El gate SAST del repo tiene dos implementaciones divergentes y **ninguna de las dos bloquea**:

- **Local (`pre-commit`)**: `sast:semgrep` → `scripts/security/semgrep-staged.ps1`. Calcula `git diff --cached`
  pero **no pasa los archivos a Semgrep** (escanea el repo completo, `node_modules` incluido); no usa `--error`
  (exit 0 aunque haya hallazgos); el exit code de Docker no se propaga desde PowerShell; corre sobre
  `semgrep/semgrep:latest` mientras el CI corre `1.176.1`; lanza 98 `--config "r/..."` individuales (93 únicas)
  contra el registro, uno por regla, y sin filtro por extensión — un commit que solo toca `.md` paga el escaneo
  completo. Y es PowerShell: el CI (ubuntu) no puede reutilizarlo.
- **CI (`ci.yml` job `sast`)**: se autodenomina _early-abort gate_ pero tiene `continue-on-error: true` y no está
  en `needs` de ningún agregador (L409-424): no aborta nada, y su resultado no se retiene en ningún artifact.

Resultado: el mismo diff puede dar veredictos distintos en local y en CI, y el objetivo O1 del PRD (que lo que
pasa en local pase en CI) no se cumple por construcción. Además la spec `openspec/specs/sast-governance-gate/spec.md`
arrastra **drift factual** verificado contra el YAML: afirma `semgrep ci --baseline-commit ... --fail-on error`
(mientras el YAML usa `semgrep scan ... --error` — `semgrep ci` no soporta `--severity` ni `--fail-on`, issue
#5075) y un requirement titulado _"Inline packs (no local config dependency)"_ cuando el YAML **sí** carga
`--config .semgrep/rules`.

## What Changes

- **Nuevo `scripts/sast-diff.mjs`**: un único script Node que ejecutan el hook `pre-push` y el job `sast` del CI.
  Modos `local`/`ci` vía `SAST_MODE`, versión de Semgrep pineada **una sola vez**, packs como fuente única de
  reglas, escaneo diff-scoped (`--baseline-commit`), `--severity ERROR --error --metrics off`, las 8 exclusiones
  inline y timeout propio.
- **SAST sale de `pre-commit` y entra en `pre-push`** (decisión D1 del PRD): los secretos se detectan lo antes
  posible (un secreto commiteado obliga a reescribir historia); SAST puede esperar al push porque necesita
  `--baseline-commit`, que en `pre-commit` no es posible (solo hay archivos completos). Orden nuevo del hook:
  `git fetch origin main --depth=1` → guard de `origin/main` → gate de firma de commits (L2) → **SAST diff-scoped** →
  tests scoped. Si SAST bloquea, los tests no se pagan. **No se reintroduce el re-check DCO** (se eliminó el
  2026-10-19; `commit-msg` es el único gate local de DCO).
- **Política de fallos asimétrica** (D3): local **fail-open** (Docker apagado, timeout o falta de red avisan y
  dejan pasar el push); CI **fail-closed** (herramienta rota = job en rojo). Exit code 0 → pasa, 1 → bloquea,
  cualquier otro → "herramienta rota".
- **`pre-commit` conserva solo el escaneo de secretos staged**, endurecido: scoped a lo staged, valor del secreto
  redactado, fail-open con aviso visible ante herramienta rota, presupuesto <5 s y salida capturada que solo se
  muestra si falla.
- **Job `sast` del CI delega en el script** (`SAST_MODE=ci node scripts/sast-diff.mjs`) y se gradúa en dos fases
  **dentro de este mismo change** (D4): FASE 1 ahora (conserva `continue-on-error: true` + retiene el resultado
  como artifact de 14 días + criterio de graduación escrito en el YAML) y FASE 2 diferida (quitar
  `continue-on-error` y añadir `sast` a `prebuild-governance-complete.needs`). El ruleset 21227644 no se toca y
  aun así el hallazgo bloquea el merge: el bloqueo llega vía `Prebuild Governance Complete`, required check de ese
  ruleset (bindear `Governance: SAST (Semgrep)` directamente queda fuera de scope e innecesario para el efecto
  bloqueante). `ci-complete.needs` tampoco se toca.
- **Limpieza**: se eliminan `scripts/security/semgrep-staged.ps1` y el npm script `sast:semgrep`.
  `scripts/security/semgrep.ps1` (`sast:semgrep:full`) se **conserva como excepción deliberada**: mantiene su lista
  `r/...` para el escaneo completo on-demand, deduplicada, y pasa de `latest` a la versión pineada.
- **Documentación**: `docs/security/segremp-rules.md` (política de reglas y de fallos; se corrige también el typo
  del nombre) y `docs/learning/quality-gates.md` §2 (registro canónico advisory/blocking), más las referencias
  al npm script eliminado en `docs/CONTEXT-CICD.md` y las guías de `docs/learning/ci-cd/`.

## Capabilities

### New Capabilities

- `sast-diff-scanning`: SAST diff-scoped compartido por el hook `pre-push` y el job `sast` del CI — script único,
  modos `local`/`ci`, versión y reglas de fuente única, paridad de veredicto sobre el mismo diff, timeout,
  contrato de exit codes, política de fallos local fail-open / CI fail-closed, orden de etapas del hook,
  portabilidad y observabilidad de los skips.
- `pre-commit-secret-gate`: escaneo de secretos **staged** en `pre-commit` — alcance staged-only, redacción del
  valor del secreto, fail-open con aviso visible ante herramienta rota, presupuesto de latencia <5 s y salida
  capturada que solo se muestra si falla.

### Modified Capabilities

- `sast-governance-gate`: el job `sast` delega en el script compartido (RF-CI-01); FASE 1 con artifact de
  evidencia y criterio de graduación documentado (RF-CI-02/03) y FASE 2 redefinida al agregador real
  `prebuild-governance-complete.needs` (RF-CI-04); **reconciliación del drift factual** — `semgrep scan --error`
  en lugar de `semgrep ci --fail-on error`, config local `.semgrep/rules` sí cargada, fuente única de
  versión/reglas — y de la relación de `sast` con `ci-complete`.
- `pre-commit-lint-staged`: `pre-commit` deja de ejecutar SAST (RF-PC-01/RF-CLN-02), así que la secuencia del hook
  pasa de `lint-staged` → `SAST`+`secrets` en paralelo a `lint-staged` → `secrets` staged → capas advisory.

## Impact

- **Hooks**: `.husky/pre-commit` (sale el bloque SAST del gate bloqueante), `.husky/pre-push` (nueva etapa SAST
  entre el gate de firma y los tests scoped).
- **Scripts y npm**: nuevo `scripts/sast-diff.mjs`; borrado `scripts/security/semgrep-staged.ps1`; borrado el npm
  script `sast:semgrep`; `scripts/security/semgrep.ps1` + `sast:semgrep:full` conservados (pin de versión +
  deduplicación).
- **CI**: `.github/workflows/ci.yml` job `sast` (comando + artifact FASE 1 + comentario de graduación; FASE 2:
  quitar `continue-on-error` y añadirlo a `needs` de `prebuild-governance-complete`). `ci-complete.needs` y el
  ruleset 21227644 quedan intactos: el ruleset sigue sin bindear el check `Governance: SAST (Semgrep)`, pero el
  bloqueo del merge llega por `Prebuild Governance Complete` (required).
- **Docs**: `docs/security/segremp-rules.md` (renombrado a `semgrep-rules.md`), `docs/learning/quality-gates.md`,
  `docs/CONTEXT-CICD.md`, `.markdownlintignore` y las guías que citan `sast:semgrep`.
- **Dependencias**: ninguna nueva. Semgrep sigue consumiéndose como imagen Docker; el script usa solo Node y
  Docker, ambos ya presentes en el stack.
- **DX**: un push con un hallazgo ERROR nuevo ahora falla en local. Mitigado por el escaneo diff-scoped
  (`--baseline-commit origin/main`), el skip por working tree sucio, el skip cuando el push no toca
  `.js/.jsx/.cjs/.mjs/.ts/.tsx` y el fail-open ante herramienta rota. Escape explícito y visible:
  `git push --no-verify` / `HUSKY=0`.
