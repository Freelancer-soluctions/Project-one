## MODIFIED Requirements

### Requirement: Scheduled dependency vulnerability and license review

The workflow SHALL scan the merged dependency tree for known vulnerabilities on the weekly cadence, independent of PRs, so newly-published vulnerabilities in already-merged dependencies are surfaced. The license summary SHALL be derived from the SBOM components (CycloneDX metadata), not from a separate license scanner. The scan SHALL fail closed: known vulnerabilities fail the run so they cannot be silently ignored, while the JSON report is still uploaded for review.

#### Scenario: Vulnerable package in merged dependencies

- **WHEN** the vulnerability review job scans `package-lock.json` on the scheduled cadence
- **THEN** the scan SHALL report each known-vulnerable package with its severity and affected version
- **AND** the findings SHALL be written to a machine-readable report (JSON) for the digest job
- **AND** the scan job SHALL fail the run when findings are reported (fail-closed), so vulnerable merged dependencies block the pipeline

#### Scenario: Report still uploaded when the scan fails

- **WHEN** the OSV scan step exits non-zero because vulnerabilities were detected
- **THEN** the report upload step SHALL still run (declared `if: always()`) and upload the JSON report artifact
- **AND** the digest job SHALL still execute against the uploaded report so findings remain visible

#### Scenario: No known vulnerabilities found

- **WHEN** the vulnerability review job finds no known vulnerabilities in the merged dependencies
- **THEN** the scan SHALL complete successfully
- **AND** the report SHALL indicate zero findings

#### Scenario: License summary derived

- **WHEN** the digest job processes the SBOM and vulnerability report
- **THEN** the digest SHALL include a license summary derived from the SBOM components
- **AND** the digest SHALL flag any license matching the project's documented deny-list (static constant `LICENSE_DENY_LIST` in `generate-security-digest.mjs`, documented in `docs/security/SECURITY.md`)
- **AND** the deny-list SHALL contain 15 entries covering the core GPL/LGPL/AGPL family (base versions plus their `-+` "or later" variants for GPL and AGPL, and base versions for LGPL)
- **AND** the deny-list SHALL intentionally omit the `-+` suffix variants `LGPL-2.0+`, `LGPL-2.1+`, and `LGPL-3.0+` present in the sibling dependency-review-action default deny-list — an accepted scope reduction: the base LGPL family (LGPL-2.0, LGPL-2.1, LGPL-3.0) is already covered, and the `-+` variants are omitted to avoid over-blocking

## REMOVED Requirements

### Requirement: Digest and reports surfaced without breaking automation

**Reason**: Replaced by a fail-closed policy — scheduled scans now fail the run on findings instead of keeping it green in audit mode, while report artifacts remain uploaded.
**Migration**: See the ADDED requirement "Findings fail the run with reports preserved" and the MODIFIED requirement "Scheduled dependency vulnerability and license review".

## ADDED Requirements

### Requirement: Findings fail the run with reports preserved

The scheduled security review SHALL fail the run when actionable findings are detected, while still uploading the SBOM, vulnerability report, and generated digest as artifacts so the findings remain visible and auditable after the failed run.

#### Scenario: Vulnerabilities found on schedule

- **WHEN** the scheduled run detects vulnerabilities
- **THEN** the run SHALL fail (fail-closed)
- **AND** the findings SHALL be visible via the uploaded digest and JSON report artifacts

#### Scenario: Digest job failure handling

- **WHEN** the digest generation job fails (e.g. missing input file)
- **THEN** the workflow SHALL report the failure on the run
- **AND** the previously generated SBOM and vulnerability report artifacts SHALL remain available for manual inspection
