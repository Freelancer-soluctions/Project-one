## MODIFIED Requirements

### Requirement: SBOM artifact upload for traceability

The workflow SHALL upload the generated SBOM file as a GitHub Actions artifact so it can be downloaded for auditing and traceability purposes.

#### Scenario: SBOM uploaded after generation

- **WHEN** the SBOM job successfully generates the SBOM file
- **THEN** the workflow uploads the SBOM file via `actions/upload-artifact@v5`
- **AND** the artifact is named `sbom` and contains the file `sbom-project-one.json`

#### Scenario: SBOM generation fails

- **WHEN** the SBOM generation step fails
- **THEN** the job fails
- **AND** no SBOM artifact is uploaded
- **AND** the workflow reports a failed check on the PR

## ADDED Requirements

### Requirement: Trivy filesystem scan fails closed with SARIF reporting

The security workflow's dependency-scan job SHALL run a Trivy filesystem scan that fails the run when CRITICAL or HIGH severity vulnerabilities with an available fix are detected, emits a SARIF report, and uploads it to the GitHub Security tab so findings are both blocking and visible. Vulnerabilities without an available fix SHALL be ignored (`ignore-unfixed: true`) to avoid unactionable noise.

#### Scenario: Critical or high finding detected

- **WHEN** the Trivy filesystem scan detects a CRITICAL or HIGH vulnerability with an available fix
- **THEN** the scan SHALL exit non-zero (`exit-code: 1`), failing the dependency-scan job
- **AND** the run SHALL be reported as failed on the PR

#### Scenario: SARIF uploaded to the Security tab

- **WHEN** the Trivy scan produces a SARIF report (`format: sarif` with an `output` file)
- **THEN** the workflow SHALL upload the SARIF report via `github/codeql-action/upload-sarif`
- **AND** the findings SHALL appear in the GitHub Security tab

#### Scenario: Unfixed vulnerability with no available fix

- **WHEN** the Trivy scan detects a CRITICAL or HIGH vulnerability with no available fix (`ignore-unfixed: true`)
- **THEN** the finding SHALL NOT fail the run
- **AND** the finding SHALL remain visible in the uploaded SARIF report
