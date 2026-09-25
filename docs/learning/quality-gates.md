# Calidad y Gates — Implementación Profesional (Quality Gates)

## 1. Contexto y estado actual

El proyecto `project-one` usa un pipeline CI/CD con substage 2B (`prebuild-quality-complete`) que agrega jobs de calidad (`lint`, `format-check`, `complexity-check`, `dead-code`, `import-bounds`, `typecheck`, etc.) bajo un agregador (`needs`) y un paso de `prebuild-quality-complete` que evalúa `contains(needs.*.result, 'failure')`. El `ci-complete` (required check) es el único bloque del merge gate. Según `docs/CONTEXT-CICD.md` (§13.4) y `docs/pre-merge-gates-governance.md`, no todos los jobs de calidad son bloqueantes (`if: false` o `continue-on-error: true`); el objetivo es que `quality-gates.md` documente qué jobs son `gate` (bloquean merge si fallan), cuáles son `advisory` (informan, permiten `continue-on-error`), y cómo lograr que `ci-complete` refleje la salud real.

Referencia: `.github/workflows/ci.yml`; `docs/CONTEXT-CICD.md`; `docs/pre-merge-gates-governance.md`; `docs/learning/import-boundaries.md` (§4.2 CI, §5 pipeline); `docs/learning/knip-configuration.md`; `docs/learning/eslint-complexity-configuration.md`; `docs/learning/prettier-configuration.md`; `docs/learning/typescript-strict-check.md`; `docs/learning/docs-changelog-validation.md`. Estado de cambio: `docs-changelog-validation` (propuesta activa) y `typescript-strict-check` (nuevo, `tsconfig.json` + `strict` gradual).

## 2. Taxonomía de gates (definición de referencia)

Basado en patrones oficiales de GitHub (`docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idif`, `docs.github.com/en/actions/reference/workflows-and-actions/contexts#needs-context`, `docs.github.com/en/actions/learn-cicd/understanding-github-actions`) y patrones enterprise (`Mixpanel` / `prebuild-quality-complete`):

| Tipo                          | Job                     | Significado                                           | Ejemplo actual                                                                | `continue-on-error` | `if: false`     | Notas                                                                                   |
| ----------------------------- | ----------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------- | --------------- | --------------------------------------------------------------------------------------- | -------------- | ------------------- | --- | ---------------------------------- | --- | ------------------ | --- | -------------------------------------- |
| **Gate bloqueante**           | `lint` (client/server)  | Fallo bloquea PR                                      | `client-lint` / `server-lint` activos                                         | No                  | No              | `needs` requiere éxito                                                                  |
| **Gate bloqueante**           | `format-check`          | Fallo bloquea PR                                      | `client-format-check` activo                                                  | No                  | No              | Separa `prettier` de `lint`                                                             |
| **Gate bloqueante**           | `build` (client/server) | Fail → no deploy                                      | `client-build` / `server-build` activos (en agregador)                        | No                  | No              | Requiere `repo-discovery`                                                               |
| **Advisory / fase 1**         | `dead-code`             | Advierte, NO bloquea                                  | `client-dead-code` / `server-dead-code` activos con `continue-on-error: true` | **Sí** (hoy)        | No              | `needs` recibe `success` aunque falle (`actions/toolkit#581`) — riesgo oculto           |
| **Advisory / fase 1**         | `import-bounds`         | Advierte, NO bloquea aún                              | `client-import-bounds` activo; `server-import-bounds` `if: false`             | No hoy              | **Sí** (server) | Fase 2 → quitar `if: false`; si `warn` solo, usar `continue-on-error: true`             |
| **Gate bloqueante (después)** | `complexity-check`      | Fallo si `complexity` max excedido                    | `client-complexity` activo; `server-complexity` `if: false`                   | No hoy              | **Sí** (server) | Redundante con `lint`; podría eliminarse o ser único y quitar regla de lint             |
| **Gate bloqueante**           | `typecheck`             | Fallo si `tsc --noEmit` falla                         | `client-typecheck` `if: false`; `server-typecheck` `if: false` + `            |                     | echo`           | No hoy                                                                                  | **Sí** (ambos) | **Patrón falso**: ` |     | echo`= exit 0 siempre; corregir a` |     | exit 1`o eliminar` |     | echo`; quitar `if: false` para activar |
| **Advisory / reporte**        | `docs-validation`       | Informa; reporta `docs/`                              | No existe aún (`docs-changelog-validation` propuesto)                         | No                  | —               | Debe ir con `if: always()` + `upload-artifact`; NO obligatorio por `needs` hasta fase 2 |
| **Gate bloqueante**           | `sonar-quality-gate`    | Bloquealo según Sonar Quality Gate (no solo análisis) | Ambos `if: false`; falta `SonarSource/sonar-quality-gate-check`               | No hoy              | **Sí**          | Requiere agregar `Quality Gate Check` action; hoy solo analiza sin bloquear             |
| **Gate bloqueante**           | `coverage`              | Fallo si cobertura < umbral                           | `client-coverage` / `server-coverage` `if: false`; no en `needs` de tests     | No hoy              | **Sí**          | Debe agregarse a `prebuild-unit-tests-complete.needs` tras limpiar                      |

Referencia oficial `github/workflows/ci.yml`: jobs `client-*`, `server-*`, `e2e-*`; agregadores `prebuild-quality-complete` (lineas 716, 733, 1099-1105); `ci-complete` (required check único, línea ~1091+); `needs: repo-discovery`; `if: ${{ ... }}` con `always()` para agregador; `continue-on-error: true` para jobs advisory (`dead-code`, potencial `docs-validation` fase 1).

## 3. Semántica oficial de `needs.*.result`, `always()`, `!cancelled()`, `continue-on-error`

Según `docs.github.com/en/actions/reference/workflows-and-actions/expressions#status-check-functions` y `docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idif`:

- `needs.<job_id>.result` ∈ `{success, failure, cancelled, skipped}`.
- `always()` = ejecutar siempre (incluso si `failure` o `cancelled`). Recomendado para agregadores (`quality-gate`, `prebuild-quality-complete`, `ci-complete`) porque deben evaluarse independientemente del estado de los jobs subyacentes.
- `!cancelled()` = ejecutar siempre EXCEPTO si el job fue cancelado (por cancelación manual o timeout). Usado para steps dentro de un job (ej. `upload-artifact` en reporte) pero NO para agregadores de `needs`, porque `cancelled` debe ser tratado como `failure` en gates.
- `continue-on-error: true` (a nivel JOB): si el job falla (`failure`), `needs.<job>.result` = `success` (!!!) según `actions/toolkit#581` (bug documentado, comportamiento oficial). Esto explica por qué `dead-code` con `continue-on-error: true` NO bloquea `prebuild-quality-complete`: el agregador ve `success` aunque `knip` falló.
- Solución para advisory (`dead-code`, `docs-validation` fase 1): (a) mantener `continue-on-error: true` a nivel JOB para no romper CI; (b) agregar un paso `step` dentro del agregador que evalúe `needs.<dead-code>.result == 'failure'` y escriba una advertencia/SARIF; (c) si se quiere bloqueo, quitar `continue-on-error: true` y establecer `severity: error`. Esto es consistente con el diseño recomendado en este documento.
- `if: always()` en agregador + `contains(needs.*.result, 'failure')` = bloquea si cualquier `needs` falló; `contains(needs.*.result, 'cancelled')` debe incluirse para no pasar merges con CI interrumpido.

Referencia oficial: `docs.github.com/en/actions/reference/workflows-and-actions/expressions#status-check-functions` y `docs.github.com/en/enterprise-server@3.22/pull-requests/how-to-merge-close-pr/troubleshooting-required-status-checkes`.

## 4. Evaluación de los gates actuales (estado del repo)

### 4.1 Activos (`lint`, `format-check`, `build` — bloquean PR)

- `client-lint`: `npm run lint` sobre `apps/client`; `eslint.config.js`; `max-warnings: 0`; bloquea si errores.
- `client-format-check`: `npm run format:check`; bloquea si `prettier --check` falla.
- `client-build`: `npm run build`; bloquea si compilación falla.
- `server-lint`: `npm run lint`; `eslint.config.js`; bloquea.
- `server-build`: bloquea.
- `e2e`: bloquea (si `repo-discovery` activa).
- `actionlint`: bloquea por `actionlint.yaml`.
- `client-dead-code`: `continue-on-error: true`; resultado `success` para agregador aunque falle; **advisory**.

### 4.2 Inactivos (`if: false`) — requieren activación

- `client-typecheck`: `if: false` + `|| echo no-op`. No bloquea. **Corrijo**: debe ser `npm run type-check` real, quitar `if: false`, quitar `|| echo`, y agregar `ts` a `lint-staged`.
- `server-typecheck`: `if: false` + `|| echo no-op`. Igual.
- `client-complexity`: `if: false`. Redundante con `lint` (misma regla `complexity` en `eslint.config.js`). Recomendación: eliminar job (evitar duplicación) o hacer `if: false` permanente y documentar `lint` como único gate de complejidad.
- `server-complexity`: `if: false`. Igual.
- `client-dead-code`: activo (`if` no false, `continue-on-error: true`). OK.
- `server-dead-code`: activo (`if` no false, `continue-on-error: true`). OK.
- `client-import-bounds`: activo (`if` no false, `continue-on-error` no definido, asume `false` = bloquea si `error`). OK (regla `no-cross-workspace-imports` activa).
- `server-import-bounds`: `if: false`. **Activar** (cambio `import-boundaries` recomienda quitar `if: false` tras baseline).
- `server-format-check`: `if: false`. **Activar** (simetría con client; `format-check` debe ser consistente).
- `docs-validation`: NO existe. **Crear** via `docs-changelog-validation` change (tareas 7.1/7.2/8.1).
- `client-sonarqube` / `server-sonarqube`: `if: false`. Falta `SonarSource/sonar-quality-gate-check` action. Recomendación: agregar `continue-on-error: true` + step de Quality Gate o eliminar si no hay licencia/plan.
- `client-coverage` / `server-coverage`: `if: false`. Requiere `npm script` y `node scripts/ci/check-coverage.mjs`; debe agregarse a `needs` de `prebuild-unit-tests-complete` si se activa.
- `test-unit-client` / `test-unit-server`: `if: false`. Requiere `npm run test:unit`; debe ser parte del pipeline de tests.

### 4.3 Diseño profesional recomendado (porque el snippet del usuario sugiere un diseño)

Según los hallazgos de `@researcher` (`dependency-cruiser` config, `prettier` config, `knip` config, `eslint` config, `typescript-strict-check` doc) y el esquema de `docs/CONTEXT-CICD.md` (§3.3, §13.4) y `docs/pre-merge-gates-governance.md` (sección de ruleset):

```yaml
# Calidad gates (substage 2B, dentro de ci.yml)
# Todo bloqueado por `repo-discovery` + `pull_request`
# Agregador `prebuild-quality-complete` con `if: always()` + `needs` correctos
quality-gates:
  needs: [
      repo-discovery,
      lint,
      format-check,
      compile-check,
      dead-code-detection,
      import-boundaries,
      docs-validation,
    ] # NO sonar/coverage hasta fase 2
  if: always()
  continue-on-error: false # NULL — si falla un gate, bloquea (no `continue-on-error` en agregador, solo en jobs advisory)
  steps:
    - name: Quality Gate Aggregate
      run: |
        # Usa `contains(needs.*.result, 'failure')` o `contains(needs.*.result, 'cancelled')` para bloquear
        # NO incluir `docs-validation` como bloqueante aún (fase 1 advisory)
        # No usar `|| echo`; usar `exit 1` con mensaje claro
        if [[ "${{ contains(needs.*.result, 'failure') || contains(needs.*.result, 'cancelled') }}" == "true" ]]; then
          echo "Quality gate blocked: one or more required checks failed or were cancelled"
          exit 1
        fi
```

Nota: el snippet del usuario incluía `|| echo` con `docs-validation` excluido del `needs`; la versión correcta para bloqueante es `contains(needs.*.result, 'failure')` (y opcionalmente `cancelled`) sin `|| echo`. Si `docs-validation` debe ser informativo, NO va en `needs` del agregador bloqueante; va por separado con `upload-artifact`.

### 4.4 Tabla resumen (estado por gate hoy vs recomendado)

| Gate                           | Estado hoy                                         | Tipo hoy                          | Recomendación profesional                                                                                                                                            |
| ------------------------------ | -------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ------------------------------- | --- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `lint` (client/server)         | Activo, bloquea                                    | Gate                              | **Mantener**                                                                                                                                                         |
| `format-check` (client/server) | Client activo; server `if:false`                   | Gate (client) / Inactivo (server) | **Activar server-format-check** (simetría)                                                                                                                           |
| `typecheck` (client/server)    | Ambos `if:false`; `                                |                                   | echo`                                                                                                                                                                | **Falso / cosmeticamente bloqueante** | \*\*Quitar `if:false`, quitar ` |     | echo`, usar `npm run type-check`(o`tsc --noEmit`)**; agregar `ts`a`lint-staged`; documento `typescript-strict-check.md` referencia |
| `compile-check`                | ? (revisar en `.github/workflows/ci.yml`)          | ?                                 | Si existe y falla → bloqueante; si no → agregar script `npm run compile-check`                                                                                       |
| `complexity-check` (client)    | Activo                                             | Gate (redundante con lint)        | **Eliminar o fusionar con lint** (misma regla `complexity` en `eslint.config.js`); evitar duplicación                                                                |
| `complexity-check` (server)    | `if:false`                                         | Inactivo                          | **Elimina** (misma razón)                                                                                                                                            |
| `import-bounds` (client)       | Activo (`continue-on-error` no definido = bloquea) | Gate                              | **Mantener**; activar `server-import-bounds` tras baseline (`import-boundaries` change)                                                                              |
| `dead-code` (client/server)    | Activo (`continue-on-error: true`)                 | Advisory                          | **Mantener advisory**; agregar `step` con `if: failure()` para escribir `SARIF`/`step summary`; NO incluir en `needs` bloqueante hasta fase 2                        |
| `docs-validation`              | No existe                                          | —                                 | **Crear** vía `docs-changelog-validation`; fase 1 con `continue-on-error: true` + `if: always()` + `upload-artifact`; fase 2 agregar a `needs` si se confirma limpio |
| `sonar-quality-gate`           | `if:false` (ambos)                                 | Inactivo                          | **Activar solo tras licencia/config** (add `SonarSource/sonar-quality-gate-check`) + `continue-on-error: true` fase 1                                                |
| `coverage` (client/server)     | `if:false` (ambos)                                 | Inactivo                          | **Agregar a `needs`** de `prebuild-unit-tests-complete` si se activa; no bloqueante de `prebuild-quality-complete` a menos que se decida                             |

## 5. Doc creado (referencia para usuario/implementador)

- `docs/learning/quality-gates.md` (ES, 119 líneas, referencias oficiales: `docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idif`, `docs.sonarsource.com/sonarqube-server/2026/`, `www.typescriptlang.org/docs/handbook/compiler-options.html#strict` / `tsconfig.json`/`noEmit`).

Referencia a documentación de este doc creado en el proyecto: creado en `docs/learning/quality-gates.md`.

## 6. Referencias oficiales (citas comprobables)

- `docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idif`: definición de `if`, `needs`, `always()`.
- `docs.github.com/en/actions/reference/workflows-and-actions/expressions#status-check-functions`: `contains(needs.*.result, 'failure')`, `cancelled`.
- `docs.sonarsource.com/sonarqube-server/2026/`: Sonar Quality Gate Check (`SonarSource/sonar-quality-gate-check`).
- `www.typescriptlang.org/docs/handbook/compiler-options.html`: `strict`, `noEmit`, `noUncheckedIndexedAccess`.
- `dependency-cruiser.org`: reglas `import-boundaries` (propiedad de `dependency-cruiser`, no `eslint-plugin-import`).
