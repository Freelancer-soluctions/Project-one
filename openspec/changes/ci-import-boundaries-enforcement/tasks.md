# Tasks: ci-import-boundaries-enforcement

## Fase 1: Upgrade + migración de comando

- [ ] Upgrade `dependency-cruiser` 18.2.0 → ≥18.3.0 en `package.json` + lockfile (mismo PR que los flags)
- [ ] Migrar `depcruise-baseline` → `depcruise --baseline` en scripts de `package.json`
- [ ] Verificar que `--baseline` escribe el mismo formato que `.dependency-cruiser-known-violations.json` (58 entradas) antes de migrar

## Fase 2: Exit code fiable

- [ ] Añadir `--exit-code`/`-e` a scripts root: `depcruise`, `depcruise:ci`, `depcruise:report`
- [ ] Añadir `--exit-code` a lint-staged (`depcruise:report` en `package.json:132`)
- [ ] Añadir `--exit-code` a jobs `client-import-bounds` y `server-import-bounds` en `ci.yml` (líneas 2342, 2502)
- [ ] Verificar: violación nueva falla (exit != 0), violación conocida pasa (exit 0)

## Fase 3: Gobernanza

- [ ] Añadir línea de CODEOWNERS para `.dependency-cruiser-known-violations.json` (coordinar con hardening P1.3; last-match-wins)
- [ ] Documentar ratchet en `quality-policy.md` (regenerar baseline solo en PR dedicado, solo se poda)

## Fase 4: Docs

- [ ] Actualizar `docs/learning/import-boundaries.md` (exit code y comando actualizados)
- [ ] Actualizar `docs/pre-merge-gates-governance.md` (línea 753)
- [ ] Revisar sync con spec main `config-correctness` (líneas 211, 218-230)

## Validación

- [ ] `openspec validate --specs --strict` sin errores
- [ ] Verificar exit code con violación nueva y conocida
