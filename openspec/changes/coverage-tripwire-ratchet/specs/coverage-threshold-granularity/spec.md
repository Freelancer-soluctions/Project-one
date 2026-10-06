# Spec Delta

## Purpose

Define the contract for layered coverage thresholds — a low global floor combined with high per-file and per-glob granularity — and require every enforcement point to evaluate all three levels so the reported verdict matches what the test run itself enforces.

## ADDED Requirements

### Requirement: Layered thresholds combine a global floor with per-file and per-glob granularity

Each workspace coverage configuration SHALL support three threshold levels: a global floor across the workspace, an optional per-file threshold, and optional thresholds scoped to path globs. Per-file and glob thresholds SHALL apply in addition to the global floor, never replacing it, so that a project can keep a low global floor while enforcing a higher standard on well-tested areas. A glob threshold SHALL only constrain files that match the glob; non-matching files SHALL be evaluated solely against the global floor and the per-file threshold.

#### Scenario: Global floor applies to every file

- **WHEN** coverage is evaluated for a workspace that declares a global floor
- **THEN** every file's measured coverage is compared against that global floor

#### Scenario: Per-file threshold tightens a single file

- **WHEN** per-file thresholds are enabled for a workspace
- **THEN** each individual file is additionally compared against the per-file threshold
- **AND** a file below the per-file threshold fails even when the global floor is satisfied

#### Scenario: Glob threshold applies only to matching files

- **WHEN** a glob threshold is declared for a path pattern
- **THEN** only files matching that pattern are compared against it
- **AND** files that do not match the pattern are not evaluated against that threshold

#### Scenario: Untested files remain visible under granularity

- **WHEN** a file contains uncovered code and granularity thresholds are enabled
- **THEN** the file's own coverage is evaluated and reported rather than being absorbed into the workspace total

### Requirement: Enforcement points evaluate every configured threshold level

Every process that reports a coverage verdict — the CI guard and the local verification command — SHALL evaluate the global floor, the per-file threshold and all matching glob thresholds, and SHALL fail if any of them is unmet. A verifier that evaluates only global totals SHALL NOT report success while a configured per-file or glob threshold is unmet, because a green verdict from one enforcement point while another fails misrepresents the state of the repository.

#### Scenario: Global totals pass but a per-file threshold fails

- **WHEN** the workspace total meets the global floor but one file is below its per-file threshold
- **THEN** every enforcement point reports failure and names the offending file
- **AND** no enforcement point reports success

#### Scenario: Verifier disagrees with the test run

- **WHEN** the test run itself enforces per-file or glob thresholds and fails
- **THEN** the verifier used for reporting also fails
- **AND** the two do not produce contradictory verdicts for the same run

### Requirement: Threshold patterns match files by workspace-relative path

Glob threshold patterns SHALL be matched against each file's path relative to its workspace root, expressed with forward slashes. Enforcement SHALL NOT depend on the absolute path separator or drive of the machine that produced the coverage report, so that the same configuration yields the same verdict on Windows and on POSIX systems.

#### Scenario: Patterns match on a Windows host

- **WHEN** the coverage report was produced on a system whose absolute paths use backslashes
- **THEN** glob thresholds still match correctly against workspace-relative forward-slash paths
- **AND** the verdict matches the verdict produced for the same coverage on a POSIX system

#### Scenario: Same configuration yields the same verdict across platforms

- **WHEN** the same workspace coverage is evaluated on Windows and on POSIX
- **THEN** the files matched by each glob threshold are identical
- **AND** no threshold passes on one platform and fails on the other for reasons unrelated to coverage values
