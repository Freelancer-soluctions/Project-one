## Why

Project One tiene infraestructura de CI configurada pero con gaps críticos que debilitan la calidad del código:

1. **ESLint no es gate bloqueante**: El workflow `quality.yml` ejecuta `eslint` pero sin flags que fuercen fail en presencia de errores. Actualmente lint corre pero no bloquea merge de PRs. Sin un gate bloqueante, errores de lint (variables no usadas, imports incorrectos, patrones inseguros) pueden llegar a `main`.

2. **lint-staged desactivado**: El hook `.husky/pre-commit` ejecuta SAST, secret scanning y regression tests, pero NO ejecuta lint-staged. lint-staged está configurado en `package.json` y la dependencia está instalada (`lint-staged@^16.2.7`), pero el pre-commit hook no lo invoca. Esto significa que ESLint + Prettier no se ejecutan automáticamente antes de cada commit.

3. **Falta de baseline de cobertura**: No hay medición documentada de cobertura actual. El plan CI/CD (`cicd-plan-implementacion.md`) referencia thresholds de cobertura que se configurarán en un cambio futuro (`ci-test-integration`), pero sin baselines actuales no se puede medir mejora.

4. **Workflow quality.yml sin blindaje**: Aunque es reusable y funciona, no tiene `fail-on: error` ni asegura que el paso de lint bloquee el merge efectivamente.

5. **Server legacy eslintConfig obsoleto**: `apps/server/package.json` tiene un campo `eslintConfig` que extiende `standard`, pero ESLint 9 con flat config (`eslint.config.js`) lo ignora. Esto crea confusión y falsa sensación de seguridad sobre qué reglas aplican al servidor.

## What Changes

### ESLint como Gate Bloqueante en CI
- Agregar `--max-warnings 0` en los scripts `lint` de ambos workspaces
- Ejecutar pre-flight lint primero para detectar warnings existentes antes de activar gate
- Verificar que ESLint correctamente ignora legacy configs y usa flat config

### Reactivar lint-staged en Pre-commit
- Modificar `.husky/pre-commit` para ejecutar lint-staged con `npm exec lint-staged` (no `npx`) antes de los checks existentes
- lint-staged ya está configurado en `package.json` — solo falta invocarlo

### Documentar Coverage Baselines
- Ejecutar `npm run test:coverage` en ambos workspaces (client + server)
- Capturar y registrar en `docs/cicd-plan-implementacion.md` (sección 4.5) las métricas actuales

### Harden quality.yml
- No requiere cambio YAML — exit code non-zero de `npm run lint` con `--max-warnings 0` basta para que GitHub Actions falle el paso

### Address Server ESLint Config
- Verificar si `apps/server/package.json` tiene `eslintConfig` legacy que el flat config ignora
- Migrar remover o consolidar reglas en `eslint.config.js` root

## Dependencies

- **Depende de sí mismo**: Los errores/warnings de lint actuales deben corregirse como parte de este cambio
- **Predecesor de `ci-test-integration`**: Las coverage baselines documentadas aquí alimentan los thresholds en `ci-test-integration`. Aplicar en orden.
- `lint-staged` ya está instalado en devDependencies (`^16.2.7`) — no requiere instalación
- Husky 9.x ya está configurado — no requiere reinstalación

## Capabilities

### New Capabilities

- `eslint-blocking-gate`: ESLint es gate bloqueante en CI. Cualquier error de ESLint en PR falla el workflow y bloquea merge.
- `pre-commit-lint-staged`: lint-staged se ejecuta en pre-commit con `npm exec`, aplicando ESLint + Prettier en archivos staged.

### Modified Capabilities

- `quality-ci-workflow`: Workflow `quality.yml` ahora falla en lint errors via `--max-warnings 0`.
- `pre-commit-hook`: `.husky/pre-commit` incluye lint-staged al inicio (antes de SAST/secrets/regression).

## Impact

- **`.husky/pre-commit`**: Agregar `npm exec lint-staged` al inicio
- **`apps/client/package.json`**: Agregar `--max-warnings 0` al script `lint`
- **`apps/server/package.json`**: Agregar `--max-warnings 0` al script `lint`; investigar/remover `eslintConfig` legacy
- **`docs/cicd-plan-implementacion.md`**: Agregar sección "Coverage Baselines (Jul 2026)" como §14.5
- **`eslint.config.js`**: Posible update si se consolidan reglas del server
