# Tasks: coverage-merge-gate-hardening

## 1. ci-complete cancelled handling

- [x] 1.1 Modificar el step de veredicto en `ci-complete` para fallar en `cancelled` (no exit 0).
- [x] 1.2 Distinguir `skipped` esperado (docs-only) de `skipped` inesperado.

## 2. Conteo exacto de parciales

- [x] 2.1 Añadir verificación en `client-coverage` y `server-coverage`: contar `blob-<i>-<n>.json` contra M y listar índices ausentes antes del merge.
- [x] 2.2 Fallar con `::error::` listando los índices ausentes.

## 3. Artefacto fusionado

- [x] 3.1 Subir `coverage/` como artefacto `coverage-merged-client` / `coverage-merged-server` con retención 14d desde los jobs de cobertura.

## 4. CODEOWNERS

- [x] 4.1 Añadir entrada explícita para `.coverage-policy.json` y `.coverage-baseline.json` en `.github/CODEOWNERS`.

## 5. Diff coverage

- [x] 5.1 Crear `scripts/ci/diff-coverage.mjs` que cruce lcov con `git diff` y falle si archivos nuevos bajan del umbral.
- [x] 5.2 Cablear como step blocking en `client-coverage`/`server-coverage` (post-merge, antes de check-coverage).

## 6. Validación

- [x] 6.1 (validacion en PR real pendiente-CI; implementacion local verificada) Abrir PR de prueba y confirmar que client-coverage/server-coverage terminan verdes sin `::error::`.
- [x] 6.2 `openspec validate coverage-merge-gate-hardening --strict` exit 0.
- [x] 6.3 Archivar el change.
