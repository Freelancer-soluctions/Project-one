## Purpose

Guarantees every GitHub Action used by the repository's 8 active workflows (plus the `setup-monorepo` composite) runs on a Node 24+ runtime before GitHub removes Node 20 from hosted runners on 2026-09-16, while keeping the project's local Node version (`.nvmrc`, 22.23.1) independent of the action runtime.

## ADDED Requirements

### Requirement: Node 20 runtime removal compliance by 2026-09-16

All GitHub Actions referenced by the 8 active workflows (`ci`, `deploy`, `preview`, `quality`, `release`, `scheduled-security`, `security-digest`, `security`) and by `.github/actions/setup-monorepo/action.yml` SHALL run on a Node 24+ runtime (or a verified Node 24 major) before GitHub removes the Node 20 runtime from hosted runners on 2026-09-16, so pipeline execution is not broken by the removal.

#### Scenario: Workflow references a Node 20 action at the deadline

- **WHEN** GitHub removes the Node 20 runtime from hosted runners on 2026-09-16
- **THEN** every action used by the active workflows SHALL already run on a Node 24+ runtime
- **AND** no workflow SHALL reference an action major still running Node 20

#### Scenario: Audit-migrated actions

- **WHEN** the Aug 2026 audit identified Node 20-runtime actions
- **THEN** the Node 20-runtime actions SHALL be migrated to a Node 24-runtime major: `actions/setup-node@v5` (6 call sites incl. `setup-monorepo`), `actions/checkout@v6` (`release.yml:15`; the remaining workflows stay on `checkout@v5`, already Node 24), `gitleaks/gitleaks-action@v3`, `actions/upload-artifact@v5` (5 usages), `actions/download-artifact@v5` (3 usages), `aws-actions/configure-aws-credentials@v6.x` (3 usages), `anchore/sbom-action` first node24 major (2 usages: security-digest.yml:24, security.yml:119), `actions/dependency-review-action` first node24 major (security.yml:147), `google/osv-scanner-action@v2.5.0`, `aquasecurity/trivy-action@0.36.0`
- **AND** each migrated action SHALL be confirmed to run Node 24+ before merge
- **AND** `changesets/action@v1` SHALL NOT be treated as deadline-binding (live verification confirms v1 already runs node24 via v1.9.0); its bump to v2 is maintenance-driven only

### Requirement: Third-party action majors verified before touching

Before the migration is applied, the Node 24 runtime status of the following third-party action majors SHALL be verified (release notes / action runtime metadata): `dorny/paths-filter@v3`, `dorny/test-reporter@v3`, `peter-evans/find-comment@v3`, `peter-evans/create-or-update-comment@v4`, `actions/cache@v4`, `actions/github-script@v7`, `anchore/sbom-action@v0.17.2`, `actions/dependency-review-action@v4`, `aws-actions/amazon-ecr-login@v2`.

#### Scenario: Current major verified Node 24

- **WHEN** verification confirms the current major already runs Node 24+
- **THEN** the action SHALL keep its current major
- **AND** the verification result SHALL be recorded in the change tasks
- **AND** (`amazon-ecr-login@v2` is already confirmed Node 24 — verify only, no bump required)

#### Scenario: Current major still Node 20

- **WHEN** verification finds the current major still runs Node 20
- **THEN** the action SHALL be bumped to the first Node 24-runtime major
- **AND** the bump SHALL be reflected in the change tasks and design

### Requirement: Local Node version independent of action runtime

The project's local Node version (`.nvmrc` = 22.23.1) SHALL remain unchanged by the action runtime migration, and the distinction SHALL be documented so maintainers do not conflate the local toolchain with the actions runtime.

#### Scenario: .nvmrc remains stable

- **WHEN** the action runtime migration is applied
- **THEN** `.nvmrc` SHALL continue to declare `22.23.1`
- **AND** workflows SHALL continue to install the local runtime from `.nvmrc` via `node-version-file`
