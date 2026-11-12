# root-manifest-hygiene Specification (Delta)

## ADDED Requirements

### Requirement: Externalized allowlist with reason/owner/issue

The root manifest guard SHALL read the allowlist from a versioned `manifest-allowlist.json` file with schema `{ "allow": [...], "entries": [{ "name", "reason", "owner", "issue" }] }`. The script SHALL exit 2 if the file is missing and exit 1 on violations, naming each offending dependency.

#### Scenario: Missing allowlist file

- **WHEN** `manifest-allowlist.json` is absent
- **THEN** the script exits with code 2

#### Scenario: Violation

- **WHEN** a root dependency is outside the allowlist and not a direct dependency of a workspace
- **THEN** the script exits with code 1 and names the offending dependency
  EOF
