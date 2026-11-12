# Tasks: ci-format-check-blocking

## Fase 0: Re-validación de deuda real

- [ ] Ejecutar `npm run format:check --workspace=apps/server` y confirmar que los archivos trackeados pasan (el fallo, si lo hay, proviene de artefactos gitignored)
- [ ] Ejecutar `npm run format:check --workspace=apps/client` y `--workspace=e2e` para confirmar estado real
- [ ] Anotar en `docs/learning/quality-gap-analysis.md` §3.2 y en el comentario FASE de `ci.yml:2412` el resultado de la re-validación

## Fase 1: Higiene de ignore

- [ ] Extender `.prettierignore` (raíz y por workspace) con `**/reports/` y `**/.vitest-reports/` (y reportes de lighthouse)
- [ ] Verificar que `format:check` pasa en client/server/e2e con artefactos presentes

## Fase 2: Normalización (solo si hay diff)

- [ ] Ejecutar `npm run format --workspace=apps/server` (prettier --write) y revisar diff (solo formato, sin cambios semánticos)
- [ ] Si hay diff, commit dedicado de normalización de formato
- [ ] Si no hay diff, omitir (no generar commit vacío)

## Fase 3: Activación

- [ ] Reemplazar `if: false` en `server-format-check` por condición path-scoped + PR-only (`needs.repo-discovery.outputs.server == 'true' && github.event_name == 'pull_request'`)
- [ ] Actualizar comentario FASE de `server-format-check` (eliminar "FASE 1 (diferido)" obsoleto)
- [ ] Crear job `e2e-format-check` (espejo de `e2e-lint`) con `npm run format:check --workspace=e2e`
- [ ] Añadir `server-format-check` y `e2e-format-check` a `prebuild-quality-complete.needs` (verificar que siguen presentes)

## Fase 4: Validación

- [ ] Verificar que `format:check` pasa en client/server/e2e (con artefactos excluidos)
- [ ] Verificar que el aggregator `prebuild-quality-complete` sigue verde
- [ ] `openspec validate --specs --strict` sin errores
