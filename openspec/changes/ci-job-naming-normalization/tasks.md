# Tasks — Normalización de nombres de jobs por substage

Consolidación de una convención ya existente en `ci.yml` (16/16 jobs de 2B llevan `Quality:`, 6/7 de SECURITY
llevan `Security:`), no diseño nuevo. Ver `design.md` D1-D5.

## 1. Inventario (previo, ya ejecutado 2026-10-03)

- [x] 1.1 Inventariar los 50 jobs de `ci.yml` con `id:`, `name:` y substage. Resultado en `design.md` (tabla de
      estado real).
- [x] 1.2 Identificar los nombres atados a checks requeridos consultando la **API** del ruleset, no la documentación.
      Resultado: ruleset 21227644 (`enforcement: active`) exige exactamente 4 contexts — `Verify Commit Signatures`,
      `Commit Lint (Conventional Commits)`, `PR Title Lint`, `DCO`. La protección clásica de `main` tiene
      `required_status_checks.contexts: []`, así que no hay otros bindings.
- [x] 1.3 Acordar con el usuario el alcance: arreglar las 3 inconsistencias; los 4 atados al ruleset se dejan y se
      documentan (decisión del 2026-10-03 tras el análisis riesgo/beneficio de design.md D2).

## 2. Renombrado en ci.yml

- [x] 2.1 `dependency-review`: `Dependency Review` → `Security: Dependency Review`. — HECHO 2026-10-03 (el valor necesita comillas: `Security: Dependency Review` sin ellas rompe el mapeo YAML; `actionlint` lo detecta como `Nested mappings are not allowed in compact mappings`).
- [x] 2.2 `secrets`: `Secret Detection` → `Security: Secret Detection` (misma razón de comillas).
- [x] 2.3 `actionlint-advisory`: `Quality: ActionLint Advisory (SARIF, FASE 1)` → `Security: ActionLint Advisory (SARIF, FASE 1)` — es el único cuyo prefijo **miente** sobre su bloque: vive en SUBSTAGE 2C SECURITY y se anunciaba como Quality.
- [x] 2.4 Comprobar que ningún `id:` ni ninguna referencia de `needs:` cambia (design.md D4). — HECHO: el diff completo son 3 líneas, todas `name:`.
- [x] 2.V Verificación: los 9 jobs de SUBSTAGE 2C llevan ahora `Security:` (los 9 verificados por `awk` sobre el rango del bloque); ningún job fuera de ese rango usa el prefijo `Security:`; `actionlint` exit 0.

## 3. Documentación en lockstep

- [x] 3.1 `docs/CONTEXT-CICD.md`: §3.2 (excepción del ruleset, párrafo nuevo), §3.3 (tabla de jobs), §9.3.5, el
      diagrama de flujo (`DR[...]`) y la nota de `security.yml`. — HECHO 2026-10-03.
- [x] 3.2 `docs/learning/quality-gates.md` §2 — **SIN CAMBIOS NECESARIOS, verificado**: la tabla cita el `id:` del job
      (`secrets`, `dependency-review`), no el `name:`. Como el renombrado no toca ids (design.md D4), la tabla sigue siendo
      correcta. La mención "Secret Detection" describe la herramienta, no el nombre del check.
- [x] 3.3 `docs/ci-cd-pipeline-empresarial.md` — **SIN CAMBIOS NECESARIOS, verificado**: el documento se declara
      "documento de investigación técnica... documento genérico/educativo". Sus 3 ocurrencias de `Dependency Review` y la
      de `Stage 1: Secret Detection` están dentro de extractos YAML de workflows **hipotéticos y genéricos**
      (`.github/workflows/dependency-review.yml` de ejemplo, con `actions/checkout@11bd71…` y `gitleaks-action@952e5…`
      fijados a SHAs de la documentación de Actions, no a los del repo). Editarlos convertiría un ejemplo válido en una
      descripción falsa del `ci.yml` real. Se dejan intactos.
- [x] 3.V Verificación: `npm run docs:lint` exit 0; los restos de los nombres antiguos en `docs/` corresponden al
      histórico del change `ci-secret-scanning` (§9.1, fila de 2026-08-07: "Secret Detection (Gitleaks OSS...) en
      `security.yml`"), que describe el estado de entonces y es correcto como tal.

## 4. Cierre

- [ ] 4.1 `openspec validate ci-job-naming-normalization --strict` y `openspec validate --specs --strict` exit 0.
- [ ] 4.2 Sincronizar el delta a `openspec/specs/ci-prebuild-substage-structure/spec.md` y archivar.
- [ ] 4.V Verificación: los 6 check names del `prebuild-unit-tests-complete` y `CI Complete` sin cambios; ningún
      required status check del ruleset 21227644 alterado (verificable contra la API: los 4 contexts siguen iguales).
