## Phase 1 — Implementación

- [ ] 1.1 Añadir `dependency-snapshot: true` al step de `anchore/sbom-action` en `.github/workflows/security.yml`.
- [ ] 1.2 Añadir `dependency-snapshot: true` al step de `anchore/sbom-action` en `.github/workflows/scheduled-security.yml`.
- [ ] 1.3 Verificar que los jobs tienen `permissions: contents: write` (o equivalente).

## Validación

- [ ] 2.1 Ejecutar `openspec validate sbom-dependency-snapshot --type change` y confirmar sin errores.
- [ ] 2.2 Verificar que los workflows siguen parseando: `python -c "import yaml; yaml.safe_load(open('.github/workflows/security.yml'))"`.

## Documentación

- [ ] 3.1 Actualizar `docs/CONTEXT-CICD.md` o `docs/learning/quality-gates.md` con la mejora de cobertura.
