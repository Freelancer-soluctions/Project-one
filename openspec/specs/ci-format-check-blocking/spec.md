# ci-format-check-blocking Specification

## Purpose

Gate de formato Prettier bloqueante en todos los workspaces: CI solo verifica (`--check`), pre-commit aplica auto-fix. Sin auto-fix en CI para no romper firmas/DCO. La cobertura de globs sigue los scripts `format:check` de cada workspace.

## Requirements

### Requirement: Format check bloqueante en todos los workspaces

Los jobs `client-format-check`, `server-format-check` y `e2e-format-check` SHALL ejecutar `prettier --check` sobre su workspace (según los globs de su script `format:check`) y fallar (exit 1) si algún archivo está sin formatear. Ningún job SHALL usar `--write` en CI.

#### Scenario: Archivo sin formatear

- **WHEN** un archivo del workspace no está formateado
- **THEN** el job de format SHALL fallar con exit 1
- **AND** CI no modifica ningún archivo

#### Scenario: Todos los archivos formateados

- **WHEN** todos los archivos del workspace están formateados
- **THEN** el job SHALL pasar (exit 0)

### Requirement: Auto-fix solo en pre-commit

El hook pre-commit SHALL aplicar `prettier --write` sobre archivos staged (vía lint-staged). El auto-fix en CI está prohibido.

#### Scenario: Commit con archivo sin formatear

- **WHEN** un archivo staged no está formateado
- **THEN** lint-staged aplica `prettier --write` y re-añade al commit
- **AND** el commit pasa si no hay otros errores

### Requirement: Higiene de ignore para artefactos generados

`.prettierignore` (raíz y por workspace) SHALL excluir artefactos generados (`reports/`, `.vitest-reports/`, `coverage/`, `dist/`, `build/`) para que `format:check` no reporte falsos positivos en CI ni localmente.

#### Scenario: Artefacto generado

- **WHEN** existe un archivo bajo `reports/` o `.vitest-reports/`
- **THEN** prettier lo ignora
- **AND** `format:check` no falla por ese archivo
  EOF
