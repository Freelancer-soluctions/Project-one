# Tasks — Test Sharding (rollout gateado)

Fuente de verdad: `docs/learning/test-sharding.md` (§4 prerequisitos, §5 plan). Diseño D1-D9 en
`design.md`. Spec: `specs/ci-test-sharding/spec.md`.

**Gating (D1): G3-G5 solo se ejecutan si G2 = PROCEED.** Si G2 = N/A, se marcan como N/A con su
evidencia y el change salta a G6 (docs + verificación) — cierre legítimo (la evidencia actual
son suites de 5-14 s y jobs de ~2m20s, muy bajo el umbral de 5-8 min). Cada tarea = una invocación
de developer. `[CI]` = toca `.github/workflows/ci.yml` o exige run real de CI.

**Cross-references (nunca duplicar):** `tia-hardening` posee selección D7 +
`sequence.sequencer`; `smart-test-ordering` posee TTFF/shuffle; `ci-testing-gate-promotion` posee
quitar `continue-on-error` (FASE 1→2); `client-snapshot-testing` posee
`apps/client/vitest.config.js` y `package.json`; `ci-shifting-left` posee e2e-sharding.

## Evidencia (sección sin checkbox — la rellenan G1.2 y G2.1)

| Corrida (run/fecha) | `test-unit-client` | `test-unit-server` | Notas |
| ------------------- | ------------------ | ------------------ | ----- |
| _(G1.2)_            |                    |                    |       |

## 1. G1 — Prerequisitos y medición (siempre, SIN matriz)

- [ ] 1.1 [CI] Añadir a `test-unit-client` y `test-unit-server` un step advisory
      (`if: always()`, append-only, tras el step de tests) que mida la duración del step de tests
      y la publique en `$GITHUB_STEP_SUMMARY` — verificación: `actionlint .github/workflows/ci.yml`
      exit 0 y un run real muestra la línea de duración en ambas jobs.
- [ ] 1.2 [CI] Recoger **≥3 corridas reales** de `test-unit-*` tras el paso 1.1 y registrar
      fecha + duración en la tabla de Evidencia de este fichero — verificación: 3 filas
      completas con enlace de run; ninguna celda vacía.
- [ ] 1.3 [CI] Verificar por escrito el prerequisito **Coverage Merge Gate** (§23.6 /
      `unit-tests-enterprise` §2.6): (a) gate por workspace existe
      (`scripts/ci/check-coverage.mjs` en `client-coverage`/`server-coverage`), (b) el merge de
      shards NO existe aún y queda diseñado en `design.md` D3-D5, (c) `--merge-reports --coverage`
      se ejecuta antes del tripwire — verificación: nota en este fichero citando las tres
      constatacciones con líneas de `ci.yml`/§23.6.
- [ ] 1.4 [CI] Auditoría de ownership inicial (greps de design D9): `sequence.sequencer`,
      conteo de `continue-on-error` en los 6 jobs, bloque TIA/D7, `.github/flaky-quarantine.yml`,
      `apps/client/vitest.config.js`, `apps/client/package.json` — verificación: salida de
      `git diff main --name-only` de este change todavía vacía de esos ficheros (G1 solo añade el
      step de 1.1) y greps idénticos a `main`.
- [ ] 1.V [CI] Verificación de grupo: actionlint exit 0; los 6 jobs siguen con
      `continue-on-error: true` y el agregador con exactamente 6 `needs`
      (`grep -A8 "prebuild-unit-tests-complete:" .github/workflows/ci.yml`) — sin esto no se
      pasa a G2.

## 2. G2 — Decisión (gate duro; N/A es un cierre válido)

- [ ] 2.1 [CI] Calcular la duración medida de `test-unit-*` sobre las ≥3 corridas de G1.2 y
      aplicar el umbral: **>8 min en 3 corridas consecutivas ⇒ PROCEED**; **<5 min ⇒ N/A**; banda
      5-8 min ⇒ PROCEED solo con análisis de coste `N*(s+T/w)` vs ahorro de wall-time —
      verificación: el cálculo (medias, comparación) queda escrito en la tabla/Notas.
- [ ] 2.2 Registrar la decisión **PROCEED o N/A** en este fichero con enlaces a la evidencia.
      Si N/A: marcar 3.1-3.4, 4.1-4.3, 5.1-5.4 y sus `.V` como N/A (nota en la propia línea,
      checkbox sin marcar) y **saltar directamente a G6** — verificación: la línea de decisión
      existe y G3-G5 quedan sin ejecutar; `grep -c "strategy.matrix" .github/workflows/ci.yml`
      sin cambios respecto a `main`.
- [ ] 2.V Verificación de grupo: coherencia decisión ↔ evidencia (si la tabla dice <5 min, la
      decisión NO puede ser PROCEED) revisada en el artefacto antes de abrir cualquier tarea de
      G3.

## 3. G3 — Matrix N=2 advisory + puente único (SOLO si G2 = PROCEED)

- [ ] 3.1 [CI] Introducir la matriz dinámica en `test-unit-client` según D2:
      `strategy.matrix: ${{ fromJSON(...) }}` que emite `shard/total` 2/2 solo cuando
      `needs.repo-discovery.outputs.shared == 'true'` (modo full) y `total: 1` en caso contrario
      (sin `--shard`); `fail-fast: false`, `max-parallel: 2`, `--shard=${{ matrix.shard }}/${{ matrix.total }}`
      solo si `total > 1` — verificación: `actionlint` exit 0 + un run `shared` muestra 2 legs y
      un run diff-scoped 1 leg con comando idéntico al actual.
- [ ] 3.2 [CI] Artefactos por shard y blob por leg (D4/D7): renombrar uploads a
      `coverage-client-shard-${{ matrix.shard }}` y `flaky-evidence-client-shard-${{ matrix.shard }}`
      con `include-hidden-files: true`, y añadir `--reporter=blob` por CLI (**sin** tocar
      `apps/client/package.json`) — verificación: en un run existen 2 artifacts con nombres
      distintos por tipo (colisión = sólo un uploader, error de inmutabilidad).
- [ ] 3.3 [CI] Crear el job puente `test-unit-client-merge` (D3): nombre fijo,
      `if: ${{ always() && needs.test-unit-client.result != 'skipped' }}`,
      `continue-on-error: true` (FASE 1), `setup-monorepo`, `download-artifact` con patrón
      `coverage-client-shard-*` (`merge-multiple`), propagación del fallo de cualquier shard
      (`contains(needs.test-unit-client.result, 'failure')` ⇒ exit 1), re-publicación del
      resumen canónico `coverage-client`, y `dorny/test-reporter` con el junit fusionado
      (el reporter se retira de las legs) — verificación: run con una shard fallante → el
      puente ejecuta, falla con mensaje claro y publica UN solo check "Client Unit Tests";
      `prebuild-unit-tests-complete.needs` sigue con exactamente 6 ids.
- [ ] 3.4 [CI] Reencadenar `client-coverage` al puente (D6): `needs: [test-unit-client-merge]` e
      `if: ${{ always() && github.event_name == 'pull_request' && needs.test-unit-client-merge.result != 'skipped' }}`
      consumiendo `needs.*.result` — verificación: actionlint exit 0; en un run sin cambios de
      client el job se salta (propagación intacta) y en un run con shard fallante
      `client-coverage` corre en vez de saltarse.
- [ ] 3.V [CI] Verificación de grupo: greps D9 idénticos a `main` (bloque TIA/D7 byte-idéntico,
      `sequence.sequencer` sin cambios, conteo de `continue-on-error` sin cambios,
      quarantine y configs intactos); matriz SOLO se activa con `shared == 'true'`
      (verificado en los dos runs de 3.1); agregador 6 `needs`.

## 4. G4 — Coverage merge antes del tripwire + D18 (SOLO si G2 = PROCEED)

- [ ] 4.1 [CI] En el puente, ejecutar `npx vitest --merge-reports --coverage --reporter=junit`
      (desde `apps/client`, tras `setup-monorepo`/`npm ci`) **antes** de subir el resumen
      fusionado — verificación: el run del puente produce `apps/client/reports/junit.xml` y
      `coverage/` con el `coverage-summary.json` de la suite COMPLETA (ambas shards presentes).
- [ ] 4.2 [CI] Asegurar el contrato D18/D5: `client-coverage` evalúa únicamente el
      `coverage-client` fusionado publicado por el puente; si falta el artifact de cualquier
      shard o el fusionado, el job sale con código 1 **antes** de leer thresholds; thresholds
      absolutos solo en full suite y `coverage.thresholds.autoUpdate` nunca en CI —
      verificación: simulación de artifact ausente (renombrar/borrar en un run de prueba o
      revisar la rama de error) ⇒ exit 1 con mensaje "coverage artifact missing"; y un run full
      correcto ⇒ `check-coverage.mjs` en verde con cobertura completa.
- [ ] 4.3 [CI] Cuarentena y evidencia flaky por shard (D4): el argv de
      `quarantine-exclude.mjs` se deriva en CADA leg antes de `--shard`, y la evidencia sube como
      `flaky-evidence-client-shard-<k>` — verificación: un fichero de
      `.github/flaky-quarantine.yml` no corre en ninguna shard y `flaky-weekly.yml` sigue
      matcheando los artifacts (`startswith("flaky-evidence-")`).
- [ ] 4.V [CI] Verificación de grupo: en un run `shared` con sharding activo, el orden observado
      es legs → `--merge-reports --coverage` → `check-coverage.mjs` (el tripwire jamás ve
      cobertura parcial); grep de `--merge-reports` aparece SOLO en el puente.

## 5. G5 — Required check y balanceo (SOLO si G2 = PROCEED)

- [ ] 5.1 [CI] Verificar contra la API del ruleset que los required checks siguen siendo solo
      los 4 governance de `CONTEXT-CICD.md` §3.2 (`gh api .../rulesets/21227644` o
      `branches/main/protection/required_status_checks`) y que NINGÚN check de shard está
      requerido — verificación: salida de la API pegada en este fichero; si apareciera un binding
      sobre `Tests: Unit - Client`, se documenta y se detiene (no se renombra nada).
- [ ] 5.2 [CI] Publicar métricas advisory en el paso summary del puente (D8): duración por shard,
      ratio máx/mín (objetivo ≤1.15), straggler share y minutos facturados vs baseline, sin
      `exit 1` y sin afirmar mejora de TTFF — verificación: run real con las 4 métricas visibles
      en el summary del puente.
- [ ] 5.3 Registrar el resultado del balanceo: si ratio >1.15 ⇒ follow-up de re-balanceo escrito
      en este fichero (delegado a `tia-hardening`/`vitest#9184`, **sin** tocar
      `sequence.sequencer`); si ≤1.15 ⇒ nota "balance aceptado" — verificación: la línea de
      resultado existe con el ratio del run real.
- [ ] 5.4 Documentar la decisión de `test-unit-server`: sin evidencia propia que supere G1/G2
      queda **single-runner** (no se replica la matriz por simetría) — verificación:
      `grep -A12 "test-unit-server:" .github/workflows/ci.yml` sin `strategy.matrix`.
- [ ] 5.V [CI] Verificación de grupo: cero checks por shard requeridos, agregador con 6 `needs`,
      métricas visibles y FASE 1 intacta (`grep -c "continue-on-error: true"` == `main`).

## 6. G6 — Docs lockstep y verificación final (siempre, incluso si G2 = N/A)

- [ ] 6.1 Actualizar `docs/learning/test-sharding.md` (header Status y §4/§5: estado real del
      repo — implementado o dormido con evidencia y decisión citadas) y
      `docs/learning/unit-tests-enterprise.md` §2.4/§2.6 (estado del merge de shards según G2)
      — verificación: `npm run docs:lint` exit 0 y los dos docs reflejan la decisión de G2.
- [ ] 6.2 [CI] Greps de safety net finales (contrato con los changes en vuelo, design D9):
      agregador con exactamente 6 `needs`; `grep -c "continue-on-error: true"` idéntico a `main`;
      `sequence.sequencer` sin cambios; `.github/flaky-quarantine.yml` sin cambios;
      `apps/client/vitest.config.js` y `apps/client/package.json` sin cambios; bloque TIA/D7
      byte-idéntico — verificación: los 6 greps impresos y comparados con `main`
      (`git diff main -- <fichero>` vacío donde aplica).
- [ ] 6.3 [CI] Verificación final del change: `actionlint .github/workflows/ci.yml` exit 0,
      `npm run docs:lint` exit 0 y `openspec validate test-sharding --strict` **PASSED** —
      verificación: los tres comandos en verde en la misma invocación.
- [ ] 6.V Cierre: resumen de G1-G6 con la decisión de G2, evidencia enlazada y listado de
      follow-ups delegados (re-balanceo por duración → `tia-hardening`; FASE 1→2 del puente →
      `ci-testing-gate-promotion`; TTFF → `smart-test-ordering`; e2e-sharding →
      `ci-shifting-left`; shards del server → nueva evidencia) — verificación: el resumen existe
      en este fichero y `openspec status --change test-sharding` muestra 4/4.
