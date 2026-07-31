## Purpose

Adds multi-layer caching to the CI pipeline — npm dependencies, root-level Vitest cache, and Playwright browsers — so CI completes in under 7 minutes.

## ADDED Requirements

### Requirement: npm dependency caching
The composite action SHALL cache npm dependencies using setup-node's built-in npm cache.

#### Scenario: npm cache via setup-node
- **WHEN** `setup-node@v4` runs
- **THEN** `~/.npm` is cached with `cache: 'npm'` using the `package-lock.json` hash

### Requirement: Vitest root-level caching
The composite action SHALL cache the root-level Vitest cache directory so unaffected tests are not re-run.

#### Scenario: Vitest cache via actions/cache
- **WHEN** `actions/cache@v4` runs for Vitest
- **THEN** `node_modules/.cache/vitest` (root-level — npm hoists dependencies) is cached with key `vitest-${{ runner.os }}-${{ hashFiles('package-lock.json') }}`
- **AND** a restore-keys fallback of `vitest-${{ runner.os }}-` recovers a partial cache when the lockfile changes

### Requirement: CI performance target
The CI pipeline SHALL complete in under 7 minutes with all caching layers active.

#### Scenario: Parallel jobs under target
- **WHEN** all jobs run in parallel with all caching layers active
- **THEN** total CI time is less than 7 minutes
