# Tasks: ci-format-check-blocking

> Verificado en local el 2026-11-12. La deuda de formato del server NO se
> reproduce en archivos trackeados: los fallos venían de artefactos generados
> (`.vitest-reports/blob.json`, `reports/*.json`, `reports/lighthouse/*`) que
> Prettier no excluía. Se añadieron `.prettierignore` por workspace.

## Fase 0: Re-validación de deuda real

- [x] Ejecutar `npm run format:check --workspace=apps/server` y confirmar que los archivos trackeados pasan (el fallo, si lo hay, proviene de artefactos gitignored) — fallaba solo por 4 artefactos generados
- [x] Ejecutar `npm run format:check --workspace=apps/client` y `--workspace=e2e` para confirmar estado real — client fallaba por 7 artefactos; e2e ya pasaba
- [x] Anotar en `docs/learning/quality-gap-analysis.md` §3.2 y en el comentario FASE de `ci.yml` el resultado de la re-validación

## Fase 1: Higiene de ignore

- [x] Extender `.prettierignore` (raíz y por workspace) con `**/reports/` y `**/.vitest-reports/` (y reportes de lighthouse) — ficheros `apps/client/.prettierignore`, `apps/server/.prettierignore`, `e2e/.prettierignore` + raíz
- [x] Verificar que `format:check` pasa en client/server/e2e con artefactos presentes — los tres en exit 0

## Fase 2: Normalización (solo si hay diff)

- [x] Ejecutar `npm run format --workspace=apps/server` (prettier --write) y revisar diff (solo formato, sin cambios semánticos)
- [x] Si hay diff, commit dedicado de normalización de formato — NO aplica: no hay diff en archivos trackeados
- [x] Si no hay diff, omitir (no generar commit vacío)

## Fase 3: Activación

- [x] Reemplazar `if: false` en `server-format-check` por condición path-scoped + PR-only (`needs.repo-discovery.outputs.server == 'true' && github.event_name == 'pull_request'`)
- [x] Actualizar comentario FASE de `server-format-check` (eliminar "FASE 1 (diferido)" obsoleto)
- [x] Crear job `e2e-format-check` (espejo de `e2e-lint`) con `npm run format:check --workspace=e2e`
- [x] Añadir `server-format-check` y `e2e-format-check` a `prebuild-quality-complete.needs` (verificar que siguen presentes) — y ampliar el mapa del veredicto (`quality-aggregator-verdict.mjs`) para el área `e2e`

## Fase 4: Validación

- [x] Verificar que `format:check` pasa en client/server/e2e (con artefactos excluidos)
- [ ] Verificar que el aggregator `prebuild-quality-complete` sigue verde — requiere run de CI
- [x] `openspec validate --specs --strict` sin errores

## Notas de verificación local

- `npm run format:check` en `apps/server`, `apps/client` y `e2e`: exit 0.
- `scripts/ci/quality-aggregator-verdict.test.mjs`: 11 tests, incluido el mapeo de `e2e-format-check` al ámbito `e2e`.
- `.github/workflows/ci.yml` parsea (YAML) y `prettier --check` limpio en los ficheros tocados.
