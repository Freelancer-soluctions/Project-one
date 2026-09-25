# config-correctness Delta

## MODIFIED Requirements

### Requirement: Max lines per function without ignorePattern

The `max-lines-per-function` rule SHALL be configured in the core block of `eslint.config.js` as `["error", { max: 80, skipBlankLines: true, skipComments: true }]` WITHOUT the rule option `ignorePattern`. The rule SHALL be enforced for ALL production code under `apps/*/src/**` — both server and client; the Phase-1 exemption block for `apps/client/src/**` SHALL be REMOVED from `eslint.config.js` together with its technical-debt comment. The test-files block SHALL explicitly disable the rule (`'max-lines-per-function': 'off'`). Exemptions for specific files (e.g., generated files, long test scaffolds) SHALL be expressed via `files`/`ignores` configuration blocks or via documented `eslint-disable` comments in source.

#### Scenario: Rule option not used for exemptions

- **WHEN** `eslint.config.js` declares `max-lines-per-function`
- **THEN** no `ignorePattern` option SHALL be present on that rule

#### Scenario: Pinned rule options on server core

- **WHEN** `npx eslint --print-config <server core file>` is evaluated
- **THEN** the `max-lines-per-function` rule SHALL be `["error", { max: 80, skipBlankLines: true, skipComments: true }]`

#### Scenario: Client files exempt during Phase 1

- **WHEN** `npx eslint --print-config <client src file>` is evaluated after the Phase-2 change (`eslint-mlpf-client-phase2`) is applied
- **THEN** the Phase-1 exemption SHALL be gone: the `max-lines-per-function` rule SHALL be `["error", { max: 80, skipBlankLines: true, skipComments: true }]` — identical to server
- **AND** the `complexity` rule SHALL stay `["error", { max: 15 }]` for that same file

#### Scenario: Phase-1 exemption block removed

- **WHEN** `eslint.config.js` is read
- **THEN** no `files` block disabling `max-lines-per-function` for `apps/client/src/**` SHALL remain
- **AND** the technical-debt comment block of the Phase-1 exemption SHALL be gone

#### Scenario: No violations after refactor

- **WHEN** `npm run lint --workspace=apps/client` runs with the exemption removed
- **THEN** ESLint SHALL report zero `max-lines-per-function` errors

#### Scenario: Test files exempt from max-lines-per-function

- **WHEN** `npx eslint --print-config <test file>` is evaluated
- **THEN** the `max-lines-per-function` rule SHALL be `off`

#### Scenario: Exemptions via config blocks

- **WHEN** a set of files must be exempt from `max-lines-per-function`
- **THEN** the exemption SHALL be implemented with a `files`/`ignores` block or a documented `eslint-disable` comment
