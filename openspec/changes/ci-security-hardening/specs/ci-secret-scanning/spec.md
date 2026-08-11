## MODIFIED Requirements

### Requirement: Scheduled full-repository scan

The system SHALL run a Gitleaks scan over the entire repository history on a weekly schedule, independent of pull requests, so secrets committed in the past are detected. The scheduled scan SHALL fail closed: a detected secret fails the run so a leak blocks the pipeline, while the JSON and SARIF report artifacts are still uploaded so findings remain visible and auditable.

#### Scenario: Weekly scheduled scan executes

- **WHEN** the scheduled workflow trigger fires (weekly cron)
- **THEN** the workflow SHALL scan the full repository, including all historical commits (not only staged changes)
- **AND** the workflow SHALL report all findings in the job output with commit hash and file path for each detected secret

#### Scenario: Secret found in historical commit

- **WHEN** the full-history scan detects a secret in a past commit
- **THEN** the workflow SHALL surface the finding with the commit SHA and file path
- **AND** the workflow SHALL fail the scheduled run (fail-closed), blocking the pipeline until the secret is rotated or removed

#### Scenario: Reports still uploaded when the scan fails

- **WHEN** the Gitleaks scan step exits non-zero because findings were detected
- **THEN** the JSON and SARIF report steps SHALL still run (declared `if: always()`) and upload the report artifacts
- **AND** the artifacts SHALL remain downloadable for remediation even though the run failed
