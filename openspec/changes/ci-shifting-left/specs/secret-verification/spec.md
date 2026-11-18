# secret-verification Specification

## Purpose

Adds TruffleHog to the security pipeline with `--results=verified` to verify detected secrets against the issuing API, complementing the existing Gitleaks scan by filtering out false positives and confirming only real, exploitable secrets.

## ADDED Requirements

### Requirement: TruffleHog verified secret scan

The security pipeline SHALL run TruffleHog against the repository with `--results=verified`, so only secrets verified against their issuing API are reported.

#### Scenario: TruffleHog scan runs

- **WHEN** the security workflow runs
- **THEN** the `trufflehog` job SHALL run `trufflehog github --repo ${{ github.repository }} --results=verified`
- **AND** the scan SHALL check the repository's git history for secrets

#### Scenario: Verified secret found

- **WHEN** TruffleHog finds a secret that is verified against the issuing API
- **THEN** the job SHALL report the verified secret with its location
- **AND** the job SHALL fail, requiring the secret to be rotated and removed

#### Scenario: No verified secrets found

- **WHEN** TruffleHog finds no verified secrets (unverified candidates are filtered out)
- **THEN** the job SHALL pass
- **AND** the security check SHALL report success

### Requirement: Complementarity with Gitleaks

The TruffleHog scan SHALL complement the existing Gitleaks scan without replacing it, so both detection layers run in the security pipeline.

#### Scenario: Both scans run

- **WHEN** the security workflow runs
- **THEN** the Gitleaks scan SHALL run on the PR diff
- **AND** the TruffleHog scan SHALL run on the full repository
- **AND** findings from both tools SHALL be reported

#### Scenario: Gitleaks false positive

- **WHEN** Gitleaks flags a candidate secret that is not verified by the issuing API
- **THEN** TruffleHog SHALL filter it out with `--results=verified`
- **AND** the candidate SHALL NOT fail the pipeline on its own
