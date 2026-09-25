# Spec Delta

## Purpose

Canonical Spanish-language documentation for project configuration knowledge: a single maintained reference (`docs/learning/eslint-configuration.md`) that explains the ESLint flat-config setup, cites official sources, and stays synchronized with the actual `eslint.config.js` and CI quality gates.

## ADDED Requirements

### Requirement: Canonical Spanish ESLint configuration documentation

The project SHALL maintain `docs/learning/eslint-configuration.md` as the canonical, single reference for the ESLint flat-config setup. The document SHALL be written in Spanish (the documentation language of the team), SHALL explain the flat-config mental model (array of configuration objects, ordered merge with last-wins, `files` glob scoping, global vs local `ignores`, plugins as JS objects), and SHALL cite official `eslint.org` documentation for the behavior it describes.

#### Scenario: Document exists as the single canonical reference

- **WHEN** a team member needs to understand or modify `eslint.config.js`
- **THEN** `docs/learning/eslint-configuration.md` SHALL exist and SHALL be the only canonical document describing the ESLint configuration
- **AND** the document SHALL be written in Spanish

#### Scenario: Official sources are cited

- **WHEN** the document states a flat-config behavior (merge order, `ignores`, `languageOptions`, plugins, etc.)
- **THEN** the document SHALL include links to the corresponding official ESLint documentation pages

### Requirement: Documentation synchronized with configuration state

After the configuration corrections of this change, the canonical document SHALL match the real state of `eslint.config.js` and the `*-complexity` jobs in `.github/workflows/ci.yml`: a single server complexity threshold equal in CI and config, backend globals without `globals.browser`, and a plugin inventory that lists only plugins actually registered in the configuration (or explicitly marks them as unwired/removed).

#### Scenario: Complexity threshold documented accurately

- **WHEN** the document describes the `complexity` rule per workspace
- **THEN** the documented server threshold SHALL equal the value enforced by both `eslint.config.js` and the `server-complexity` CI job

#### Scenario: Backend globals documented accurately

- **WHEN** the document describes `languageOptions.globals` of the backend block
- **THEN** it SHALL document `globals.node` and the Vitest globals only, with no `globals.browser` in the backend

#### Scenario: Plugin inventory documented accurately

- **WHEN** the document's plugin table lists a plugin as present in the repo
- **THEN** that plugin SHALL be imported and registered in `eslint.config.js`, or the table SHALL explicitly mark it as not wired / removed
