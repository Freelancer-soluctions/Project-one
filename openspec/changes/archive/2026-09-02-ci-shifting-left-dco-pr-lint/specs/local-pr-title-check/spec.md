## Purpose

Local PR title validation wrapper — a Node script that mirrors ci.yml `pr-title-lint` configuration, invoked via `npm run pr:create` before `gh pr create`, providing instant feedback on PR title Conventional Commits compliance.

## ADDED Requirements

### Requirement: PR title validated against Conventional Commits types

The `pr-title-check.mjs` script SHALL validate that a PR title starts with one of the allowed Conventional Commits type prefixes: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`, `ops`.

#### Scenario: Valid type prefix

- **WHEN** PR title is `feat: add user authentication`
- **THEN** the script SHALL exit 0 (success)

#### Scenario: Invalid type prefix

- **WHEN** PR title is `feature: add user authentication`
- **THEN** the script SHALL exit non-zero with error message listing valid types

#### Scenario: No type prefix

- **WHEN** PR title is `add user authentication`
- **THEN** the script SHALL exit non-zero with error message

### Requirement: Subject must not start with uppercase letter

The script SHALL enforce `subjectPattern: ^(?![A-Z]).+$` — the subject (text after `type: `) must NOT begin with an uppercase letter.

#### Scenario: Lowercase subject

- **WHEN** PR title is `feat: add user authentication`
- **THEN** the script SHALL exit 0

#### Scenario: Uppercase subject

- **WHEN** PR title is `feat: Add user authentication`
- **THEN** the script SHALL exit non-zero with error message about lowercase subject

#### Scenario: Acronym in middle allowed

- **WHEN** PR title is `fix: resolve AWS timeout issue`
- **THEN** the script SHALL exit 0 (uppercase `AWS` is mid-subject, not first char)

### Requirement: Scope is optional

The script SHALL NOT require a scope. Both `feat: description` and `feat(scope): description` SHALL be accepted.

#### Scenario: Without scope

- **WHEN** PR title is `fix: patch login bug`
- **THEN** the script SHALL exit 0

#### Scenario: With scope

- **WHEN** PR title is `fix(auth): patch login bug`
- **THEN** the script SHALL exit 0

### Requirement: Script reads PR title from command-line argument or stdin

The script SHALL accept the PR title as a command-line argument. If no argument is provided, it SHALL read from stdin.

#### Scenario: Title passed as argument

- **WHEN** script is invoked with `node scripts/hooks/pr-title-check.mjs "feat: add feature"`
- **THEN** the script SHALL validate the provided title string

#### Scenario: Title piped via stdin

- **WHEN** script is invoked with `echo "feat: add feature" | node scripts/hooks/pr-title-check.mjs`
- **THEN** the script SHALL read and validate the piped title

### Requirement: npm run pr:create wraps gh pr create with title validation

The `pr:create` npm script SHALL first run `pr:title-check` with the provided title argument. Only if validation passes SHALL it invoke `gh pr create`.

#### Scenario: Valid title — PR created

- **WHEN** developer runs `npm run pr:create -- --title "feat: add feature" --body "Description"`
- **THEN** `gh pr create` SHALL be invoked with the provided arguments

#### Scenario: Invalid title — PR not created

- **WHEN** developer runs `npm run pr:create -- --title "bad title" --body "Description"`
- **THEN** `gh pr create` SHALL NOT be invoked and the script SHALL exit non-zero

### Requirement: Error messages are actionable

All error messages from the PR title check SHALL include the invalid title, the reason for rejection, and an example of a valid title.

#### Scenario: Error includes context

- **WHEN** PR title `chore: Update deps` fails validation
- **THEN** the error message SHALL state that subject must not start with uppercase and show `chore: update deps` as valid example
