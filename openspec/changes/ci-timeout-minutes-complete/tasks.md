# Tasks

## 1. Añadir timeouts

- [x] 1.1 Añadir `timeout-minutes: 5` a `verify-signatures` en `ci.yml`.
- [x] 1.2 Añadir `timeout-minutes: 10` a los 4 agregadores prebuild (`prebuild-governance-complete`, `prebuild-quality-complete`, `prebuild-security-complete`, `prebuild-tests-complete`).
- [x] 1.3 Añadir `timeout-minutes: 15` a `ci-complete`.
- [x] 1.4 Verificar que todos los jobs de `build.yml` ya tienen timeout (4/4).

## 2. Verificación

- [x] 2.1 Verificar que TODOS los jobs de `ci.yml` tienen `timeout-minutes` a nivel de job (no solo step). Comando corregido (ver nota):

  ```bash
  PYTHONUTF8=1 python3 - <<'EOF'
  import re, sys

  lines = open('.github/workflows/ci.yml', encoding='utf-8').read().split('\n')
  jobs, in_jobs = [], False
  for i, line in enumerate(lines):
      if line.strip() == 'jobs:':
          in_jobs = True
          continue
      if in_jobs:
          m = re.match(r'^  ([A-Za-z][\w-]*):\s*$', line)
          if m:
              jobs.append((m.group(1), i))

  missing = []
  for name, start in jobs:
      end = start + 1
      while end < len(lines) and not re.match(r'^  [A-Za-z][\w-]*:\s*$', lines[end]):
          end += 1
      if not re.search(r'^    timeout-minutes:', '\n'.join(lines[start:end]), re.M):
          missing.append(name)

  print(f'jobs: {len(jobs)} | sin timeout a nivel de job: {missing or "ninguno"}')
  sys.exit(1 if missing else 0)
  EOF
  ```

- [x] 2.2 Ejecutar `actionlint` sobre ci.yml para validar sintaxis.

## Resultado de la verificación (2026-11-18)

- **Jobs afectados: 8, no 5-6.** Además de los 6 del proposal, faltaban `commit-lint` y `dco`
  (el listado del proposal los omitía). Valores aplicados:
  `verify-signatures` 5 · `commit-lint` 5 · `dco` 5 · los 4 `prebuild-*-complete` 10 ·
  `ci-complete` 15.
- **`build.yml`: 4/4 con timeout** (`build` 15, `image` 30, `trivy` 15, `validate` 20).
- **Cobertura**: 64 jobs en `ci.yml`, **0 sin `timeout-minutes` a nivel de job** (check estructural,
  EXIT 0). Antes del cambio eran 8.
- **`actionlint .github/workflows/ci.yml`** → EXIT 0 (sin warnings).
- **Política documentada** en el propio workflow (bloque encima de `jobs:`): 5 para gates ligeros,
  10 para agregadores, 15 para `ci-complete`, 10-30 para jobs con `npm ci`/tests/análisis.
- **Divergencias del artefacto:**
  - El snippet original de 2.1 no servía como gate: su regex `^  [a-z][\w-]*:\s*$` captura claves de
    `on:` (`pull_request`, `workflow_dispatch`) y su ventana de 400 caracteres da falsos negativos en
    jobs con mucho comentario antes de `runs-on` (`test-unit-client`, `build-complete`, …), que sí
    tienen timeout. Se reemplazó por el check estructural de arriba, que delimita el bloque completo
    del job y solo acepta `timeout-minutes` con indentación de 4 espacios.
  - En esta máquina no hay alias `python3` (Windows); el comando se ejecutó con el launcher `py -3` y
    `PYTHONUTF8=1` (el `open()` por defecto en Windows usa cp1252 y rompe con los caracteres del
    archivo). En CI Linux el snippet funciona tal cual.
