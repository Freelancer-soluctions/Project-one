## Purpose

Creates a repository-root `.dockerignore` file so Docker builds exclude non-runtime content (dependencies, environment files, docs, tooling) — reducing build context size and preventing secrets (.env) from leaking into images.

## ADDED Requirements

### Requirement: Repository root .dockerignore
The repository root SHALL contain a `.dockerignore` file that excludes non-runtime files from the Docker build context.

#### Scenario: Build context excludes non-runtime content
- **WHEN** a Docker build runs from the repository root
- **THEN** the build context SHALL exclude `node_modules`, `.env`, `.git`, `.github`, `openspec`, `docs`, `reports`, `*.log`, `.husky`, `.vscode`, `.idea`
- **AND** the `.dockerignore` file SHALL exist at the repository root
