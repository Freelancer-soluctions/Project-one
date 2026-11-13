# ci-typescript-strict-config Specification

## Purpose
Activar TypeScript strict en la base compartida y en apps/server, con project references y build incremental, sin romper el typecheck existente.

## Requirements

### Requirement: Base compartida strict

El repositorio SHALL tener un `tsconfig.base.json` en la raíz con `strict: true` y flags PRD §1 (target ES2022, module NodeNext, moduleResolution NodeNext, esModuleInterop, skipLibCheck, forceConsistentCasingInFileNames, resolveJsonModule, isolatedModules).

#### Scenario: Base strict

- **WHEN** se lee `tsconfig.base.json`
- **THEN** `compilerOptions.strict` es `true`

### Requirement: Server extiende base strict

`apps/server/tsconfig.json` SHALL extender `../../tsconfig.base.json` y activar `composite: true`, `outDir: ./dist`, `rootDir: ./src`.

#### Scenario: Server strict

- **WHEN** se ejecuta `npx tsc --noEmit -p apps/server/tsconfig.json`
- **THEN** exit 0 (sin errores de tipos)

### Requirement: Root project references

El `tsconfig.json` raíz SHALL usar `files: []` y `references: [{ path: "./apps/server" }]`.

#### Scenario: References

- **WHEN** se ejecuta `tsc -b`
- **THEN** compila apps/server sin errores

### Requirement: Build script

`apps/server/package.json` SHALL tener un script `build` que ejecute `tsc -b` (o `tsc -p` como fallback).

#### Scenario: Build

- **WHEN** se ejecuta `npm run build --workspace=apps/server`
- **THEN** genera `apps/server/dist/` con los archivos compilados

### Requirement: .gitignore y .dockerignore

`.gitignore` SHALL incluir `**/dist/` y `*.tsbuildinfo`. `.dockerignore` SHALL incluir `.tsbuildinfo`.

#### Scenario: Ignore

- **WHEN** se revisa `.gitignore` y `.dockerignore`
- **THEN** ambos patrones están presentes
