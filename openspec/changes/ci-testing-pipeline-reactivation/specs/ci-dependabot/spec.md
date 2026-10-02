# Spec Delta — ci-dependabot (absorbida de `ci-test-integration`, verificada 2026-10-01)

## Purpose

Dependabot para PRs automáticos de actualización de dependencias, con el ecosistema npm (agrupación de dev-dependencies) y el ecosistema GitHub Actions en un único `.github/dependabot.yml`. El archivo ya existe en el árbol; esta capability especifica su contrato y prohíbe recrearlo (EXTEND-NOT-RECREATE).

## ADDED Requirements

### Requirement: Single Dependabot configuration file

The repository SHALL maintain exactly ONE `.github/dependabot.yml` at the repository root covering the npm and GitHub Actions ecosystems; any future change that needs additional ecosystems SHALL extend this file and SHALL NOT create a second Dependabot configuration.

#### Scenario: One config file for all ecosystems

- **WHEN** `.github/dependabot.yml` is read
- **THEN** both the `npm` and `github-actions` ecosystems are declared in the same file
- **AND** no other Dependabot configuration file exists in the repository

#### Scenario: Extension instead of recreation

- **WHEN** a future change adds a new ecosystem (e.g., `docker`)
- **THEN** it appends the new entry to the existing `.github/dependabot.yml`
- **AND** the existing npm and github-actions entries remain unchanged

### Requirement: npm ecosystem weekly updates with dev-dependency grouping

The npm ecosystem SHALL run on a weekly schedule with grouping for dev dependencies, `open-pull-requests-limit: 10` and labels `["dependencies", "automated"]`.

#### Scenario: npm ecosystem updates

- **WHEN** Dependabot runs on its weekly schedule
- **THEN** the npm ecosystem configuration uses grouping for dev-dependencies
- **AND** `open-pull-requests-limit` is set to 10 with labels `["dependencies", "automated"]`

### Requirement: GitHub Actions ecosystem weekly updates

The GitHub Actions ecosystem SHALL run on a weekly schedule in the same config file so workflow-action updates arrive as automated PRs.

#### Scenario: Actions ecosystem updates

- **WHEN** Dependabot runs on its weekly schedule
- **THEN** the `github-actions` ecosystem is configured in the same `.github/dependabot.yml`
- **AND** dependency update PRs for Actions are created automatically
