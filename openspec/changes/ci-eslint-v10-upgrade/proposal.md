# Proposal

## Why

ESLint 9.39.x llegó a EOL el 2026-08-06 (verificado en eslint.org/version-support). El repo usa `eslint ^9.39.2` (resuelve a 9.39.3) y el PRD advierte que v9 está muerto. ESLint 10.14.0 está disponible y compatible con Node ≥20.19 (repo engines ≥22.11). La actualización mayor debe probarse en un job advisory paralelo antes de reemplazar (política de actualización de herramientas), y si cambian los hallazgos, regenerar el baseline en el mismo PR de herramientas.

## What Changes

- Añadir job advisory `eslint-v10-advisory` en CI que ejecuta lint con ESLint 10 sobre client/server/e2e, instalado vía `npx --package eslint@10 eslint …` (ver design: mecanismo fijado, no devDependency separada por el manifest guard).
- Validar que no haya reglas renombradas/removidas ni plugins incompatibles que rompan la config flat.
- Crear o regenerar baseline de supresiones (`eslint-suppressions.json`) si los hallazgos cambian o si no existe.
- Promover ESLint 10 a dependencia principal y retirar el job advisory. **(FASE 2, condicional a que el advisory pase; BLOQUEADA por plugins upstream — `eslint-plugin-react`/`eslint-plugin-jsx-a11y` sin peer `^10`. Ver design D8 y `quality-policy.md` §4.1.)**
- Fijar versión exacta (sin caret) y actualizar lockfile.

## Dependencies

- `quality-policy.md` (creado por `ci-quality-gates-blocking-hardening` P1.4): este change actualiza la policy con la fecha de promoción. Si hardening no aterrizó, crear la plantilla mínima.
- CODEOWNERS: los patrones `eslint-suppressions.json` (:60) y `eslint.config.*` (:55) **ya existen** en `.github/CODEOWNERS` tras hardening P1.3; este change solo verifica cobertura (no añade líneas, evita duplicados last-match-wins).

## Capabilities

### New Capabilities

- `eslint-v10-adoption`: proceso de adopción de ESLint 10 con job advisory paralelo, validación de config flat, regeneración de baseline y promoción.

### Modified Capabilities

- (ninguna a nivel de requirements de producto; es tooling)

## Impact

**Affected code:**

- `package.json` (devDependencies: eslint, @eslint/js, typescript-eslint)
- `eslint.config.js` (posibles ajustes por reglas renombradas/removidas o plugins incompatibles)
- `.github/workflows/ci.yml` (job advisory nuevo)
- `.github/CODEOWNERS` (añadir `eslint-suppressions.json` y verificar `eslint.config.*`)
- `eslint-suppressions.json` (creado o regenerado)

**Affected docs:**

- `docs/learning/quality-policy.md` (registro de actualización; crear plantilla mínima si no existe)

**Dependencies:**

- eslint 9.39.3 → 10.14.0
- @eslint/js 9.39.3 → 10.x
- typescript-eslint 8.71.2 → compatible con ESLint 10

**Sistemas:**

- GitHub Actions (job advisory)
- npm (lockfile)
