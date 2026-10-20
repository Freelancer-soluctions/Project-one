# Spec Delta — local-commit-all-dco

## MODIFIED Requirements

### Requirement: docs reflect the /commit-all DCO rule

The following documentation files SHALL be updated to document the DCO trailer format, the git commit -S -s convention, and the auto-signoff recommendation:

- docs/learning/ci-cd/01-git-y-yaml.md
- docs/learning/ci-cd/05e-pr-metadata-governance.md
- docs/CONTEXT-CICD.md

#### Scenario: Developer reads 01-git-y-yaml to learn the signed commit convention

- **WHEN** a developer reads docs/learning/ci-cd/01-git-y-yaml.md
- **THEN** they SHALL find documentation of the git commit -S -s convention, the KineticCafe Signed-off-by trailer format, and the local DCO enforcement mechanisms (the prepare-commit-msg auto-signoff hook plus commit-msg validation as the single local gate)
- **AND** any reference to `git config --global commit.signoff true` SHALL appear only as debunked legacy framing — stating that the variable does not exist in git and injects no trailer — and NEVER as a working recommendation

#### Scenario: Developer reads 05e-pr-metadata-governance for cross-references

- **WHEN** a developer reads docs/learning/ci-cd/05e-pr-metadata-governance.md
- **THEN** they SHALL find cross-references to the local DCO hooks — `prepare-commit-msg` auto-signoff plus `commit-msg` validation as the single local gate, with NO `pre-push` DCO re-check — and the /commit-all git-manager DCO rule, noting that DCO is enforced at 3 layers: local hooks (L1 prepare-commit-msg auto-signoff / L2 commit-msg validation), the /commit-all prompt rule, and CI KineticCafe (L3, authoritative and non-bypassable)

#### Scenario: Developer reads CONTEXT-CICD shifting-left section

- **WHEN** a developer reads docs/CONTEXT-CICD.md section 11 (shifting-left strategy)
- **THEN** they SHALL find a note about the auto-signoff mechanism (the prepare-commit-msg hook) and the /commit-all prompt rule as defense-in-depth complementing CI enforcement
