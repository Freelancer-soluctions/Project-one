# Tasks — Normalización de nombres de jobs por bloque

Consolidación y extensión de una convención ya existente en `ci.yml`, no diseño nuevo. Ver `design.md` D1-D8.

## 1. Inventario (previo, ya ejecutado 2026-10-03)

- [x] 1.1 Inventariar los 50 jobs de `ci.yml` con `id:`, `name:` y bloque físico. Resultado en `design.md` (tabla de
      estado real).
- [x] 1.2 Identificar los nombres atados a checks requeridos consultando la **API** del ruleset, no la documentación.
      Resultado: ruleset 21227644 (`enforcement: active`) exige exactamente 4 contexts — `Verify Commit Signatures`,
      `Commit Lint (Conventional Commits)`, `PR Title Lint`, `DCO`. La protección clásica de `main` tiene
      `required_status_checks.contexts: []`, así que no hay otros bindings.
- [x] 1.3 Acordar con el usuario el alcance de la primera pasada (3 inconsistencias de SECURITY; los 4 atados al
      ruleset se dejan y se documentan).

## 2. Primera pasada — SECURITY (HECHO 2026-10-03, commit `ece67e3c`)

- [x] 2.1 `dependency-review`: `Dependency Review` → `Security: Dependency Review`. — El valor necesita comillas:
      `Security: Dependency Review` sin ellas rompe el mapeo YAML; `actionlint` lo detecta como `Nested mappings are not
allowed in compact mappings`.
- [x] 2.2 `secrets`: `Secret Detection` → `Security: Secret Detection` (misma razón de comillas).
- [x] 2.3 `actionlint-advisory`: `Quality: ActionLint Advisory (SARIF, FASE 1)` → `Security: ActionLint Advisory
(SARIF, FASE 1)` — es el único cuyo prefijo **miente** sobre su bloque: vive en SUBSTAGE 2C SECURITY y se
      anunciaba como Quality.
- [x] 2.4 Comprobar que ningún `id:` ni ninguna referencia de `needs:` cambia (design.md D4).
- [x] 2.V Verificación: los 9 jobs de SUBSTAGE 2C llevan `Security:`; ningún job fuera de ese rango usa el prefijo;
      `actionlint` exit 0.

## 3. Documentación de la primera pasada (HECHO 2026-10-03)

- [x] 3.1 `docs/CONTEXT-CICD.md`: §3.2 (excepción del ruleset, párrafo nuevo), §3.3 (tabla de jobs), §9.3.5, el
      diagrama de flujo (`DR[...]`) y la nota de `security.yml`.
- [x] 3.2 `docs/learning/quality-gates.md` §2 — **SIN CAMBIOS NECESARIOS, verificado**: la tabla cita el `id:` del job
      (`secrets`, `dependency-review`), no el `name:`. Como el renombrado no toca ids (design.md D4), la tabla sigue
      siendo correcta.
- [x] 3.3 `docs/ci-cd-pipeline-empresarial.md` — **SIN CAMBIOS NECESARIOS, verificado**: el documento se declara
      "documento de investigación técnica... documento genérico/educativo". Sus ocurrencias están dentro de extractos
      YAML de workflows **hipotéticos y genéricos**. Editarlos convertiría un ejemplo válido en una descripción falsa
      del `ci.yml` real.

## 4. Ampliación de alcance — los jobs que faltaban (2026-10-03)

El usuario señaló que aún quedan jobs sin normalizar, en particular los de test. Re-inventario de los 11 restantes y
decisión de esquema con el usuario: **prefijo del bloque**, con ENTRY/GUARDS/agregador raíz como excepciones por rol
documentadas (design.md D6).

- [x] 4.1 `sast`: `SAST (Semgrep)` → `Governance: SAST (Semgrep)` (2A GOVERNANCE).
- [x] 4.2 `test-unit-client`: `Unit Tests - Client` → `Tests: Unit - Client` (2D).
- [x] 4.3 `test-unit-server`: `Unit Tests - Server` → `Tests: Unit - Server` (2D).
- [x] 4.4 `test-integration`: `Integration Tests - Server` → `Tests: Integration - Server` (2D, corre post-build).
- [x] 4.5 `test-smoke`: `Smoke Tests - Server` → `Tests: Smoke - Server` (2D, corre post-build).
- [x] 4.6 `client-build`: `Build - Client` → `Build: Client` (STAGE 3).
- [x] 4.7 `server-build`: `Build - Server` → `Build: Server` (STAGE 3).
- [x] 4.8 `e2e`: `E2E Tests` → `Tests: E2E` (testing post-build, `if: false`).
- [x] 4.9 Verificación: el diff completo son 8 líneas, todas `name:`; ningún `id:` ni `needs:` tocado; `actionlint`
      exit 0 con `-config-file .github/actionlint.yaml`.
- [x] 4.10 Verificación de cobertura: los 50 jobs de `ci.yml` con nombre now llevan prefijo de bloque salvo los 7
      de las excepciones documentadas (4 del ruleset + `repo-discovery` + `zombie-workflow-guard` + `ci-complete`).

## 5. Lockstep de specs por el renombrado de `sast` (2026-10-03)

`sast` era el caso con coste: 3 specs citan `"SAST (Semgrep)"` como el contexto que un admin añadiría al ruleset en el
paso manual F2. Sin actualizarlas, el manual de F2 nombraría un contexto que ningún job emite (design.md D5).

- [x] 5.1 `openspec/specs/sast-governance-gate/spec.md` — el requirement del nombre del job, la fase F2 y su escenario
      pasan a `Governance: SAST (Semgrep)`.
- [x] 5.2 `openspec/specs/ruleset-expansion/spec.md` — la lista de checks a añadir, el escenario del PATCH del admin y
      el escenario de Regla 8 pasan a `Governance: SAST (Semgrep)`.
- [x] 5.3 `openspec/changes/ci-governance-quality-hygiene/specs/ci-runtime-config-hygiene/spec.md` — el scenario de
      `sast` declara el `name:` como invariante; actualizado con nota de que el prefijo lo adoptó este change.

## 6. Documentación en lockstep de la ampliación (2026-10-03)

- [x] 6.1 `docs/CONTEXT-CICD.md`: §3.2 (la convención ahora lista los 5 prefijos de bloque), §3.3 (fila de `sast` y la
      fila agrupada de `if: false`), **§3.3.1 NUEVA** (tabla de prefijos por bloque + las 4 categorías de excepción +
      el gotcha YAML), §9.3.9 (título y caveat Regla 8, que pasa a decir que el contexto de F2 es el nombre nuevo), y
      el nodo `Q_DISABLED` del diagrama.
- [x] 6.2 `docs/pre-merge-gates-governance.md`: §4.8 (`job 'Security: Dependency Review'`), §4.9
      (`Security: Secret Detection`) y **corrección de un error de hecho**: la línea afirmaba que `Secret Detection` era
      check del ruleset en modo strict; verificado contra la API el 2026-10-03 que el ruleset 21227644 exige solo los 4
      contexts de §3.2. El texto anterior era incorrecto y se annota como tal.
- [x] 6.3 `docs/learning/ci-cd/24-dag-infraestructura.md` — **SÍ se actualiza**: su tabla §1.4 declara "jobs
      habilitados que SÍ corren hoy" y su diagrama es el mapa del DAG real. Añadida también la fila de `sast`, que la
      tabla no listaba pese a estar documentado en la nota siguiente.
- [x] 6.4 `docs/learning/ci-cd/{02,06,10}` — **bannerizados, no editados** (design.md D8): sus extractos YAML son de
      un `ci.yml` anterior (el path-filter se llamaba `changes` con outputs `frontend`/`backend`; hoy `repo-discovery` con
      `client`/`server`). Cada banner declara que el material es didáctico congelado y apunta a `CONTEXT-CICD.md`
      §3.3/§3.3.1 como estado real.
- [x] 6.5 `docs/openspec-implementation-audit.md` §5 y `docs/opencode/agent-architecture-analysis.md` — **SIN CAMBIOS
      NECESARIOS, verificado**: la coincidencia de `E2E Tests` en §5 es el título de una sección sobre tests E2E
      skipeados, no una cita del nombre del check; en el diagrama de arquitectura es una etiqueta de caja.
- [x] 6.V Verificación: `grep` de los 11 nombres antiguos sobre `docs/` y `openspec/specs/` → 0 coincidencias fuera de
      `docs/learning/ci-cd/{02,06,10}` (bannerizadas) y del histórico en `openspec/changes/archive/` (inmutable por
      definición: describe el estado de su fecha). `npm run docs:lint` exit 0.

## 7. Artefactos del change

- [x] 7.1 `proposal.md` reescrito con el alcance real (11 jobs, tabla completa) y el motivo por el que los jobs de test
      son el incumplimiento más visible.
- [x] 7.2 `design.md` reescrito: inventario de 11 bloques, D5 (el coste de renombrar `sast`), D6 (esquema por bloque +
      excepciones por rol), **D7 (revertida la decisión de dejar los `if: false` sin tocar)**, D8 (banneres en vez de
      editar extractos congelados), y el gotcha YAML.
- [x] 7.3 Delta de `ci-prebuild-substage-structure`: el requirement de convención pasa a llevar la tabla completa de
      bloques y añade el scenario de `if: false`; **2 requirements nuevos**: "Jobs with no block are enumerated as role
      exceptions" y "A spec that cites a job name as a ruleset context is updated with it".

## 8. Cierre

- [x] 8.1 `openspec validate ci-job-naming-normalization --strict` → `Change 'ci-job-naming-normalization' is valid`;
      `openspec validate --specs --strict` → 129/129 passed, 0 failed (antes 128: el requirement nuevo de enumeración
      de excepciones es el que suma el ítem).
- [x] 8.2 `npx prettier --check` sobre los ficheros tocados → `All matched files use Prettier code style!` (la primera
      pasada marcó `tasks.md`; corregido con `--write` y re-verificado).
- [x] 8.3 Verificación final: los 4 contexts del ruleset 21227644 intactos contra la API (`Verify Commit Signatures`,
      `Commit Lint (Conventional Commits)`, `PR Title Lint`, `DCO`); los 6 `needs` de `prebuild-unit-tests-complete` y
      los 7 de `ci-complete` sin cambios (referencian ids, no nombres — design.md D4); `actionlint` exit 0 con
      `-config-file .github/actionlint.yaml`.
- [x] 8.4 Sincronizar el delta a `openspec/specs/ci-prebuild-substage-structure/spec.md` y archivar.
