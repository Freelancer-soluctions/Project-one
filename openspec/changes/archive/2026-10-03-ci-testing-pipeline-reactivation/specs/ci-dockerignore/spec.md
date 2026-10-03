# Spec Delta — ci-dockerignore (absorbida de `ci-test-integration`, verificada 2026-10-01)

## Purpose

Un `.dockerignore` en la raíz del repositorio para que los builds de Docker excluyan contenido no-runtime (dependencias, archivos de entorno, docs, tooling) — reduce el tamaño del build context y evita que secretos (`.env`) terminen dentro de las imágenes. El archivo ya existe en el árbol; esta capability especifica su contrato.

## ADDED Requirements

### Requirement: Repository root .dockerignore

The repository root SHALL contain a `.dockerignore` file that excludes non-runtime files from the Docker build context.

#### Scenario: Build context excludes non-runtime content

- **WHEN** a Docker build runs from the repository root
- **THEN** the build context SHALL exclude `node_modules`, `.env`, `.git`, `.github`, `openspec`, `docs`, `reports`, `*.log`, `.husky`, `.vscode`, `.idea` (or a documented equivalent set whose exclusions cover at minimum dependencies, env files, VCS metadata and CI configuration)
- **AND** the `.dockerignore` file SHALL exist at the repository root

#### Scenario: Secrets never enter the image

- **WHEN** the image build context is inspected
- **THEN** `.env*` files are excluded so application secrets cannot be copied into any image layer
