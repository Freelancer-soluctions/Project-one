## Purpose

Enables Dependabot for automated dependency update pull requests, covering the npm ecosystem (with grouping for dev dependencies) and the GitHub Actions ecosystem, so dependency updates and security patches arrive automatically.

## ADDED Requirements

### Requirement: Dependabot configuration for npm dependencies
The repository SHALL enable Dependabot for the npm ecosystem on a weekly schedule with grouping for dev dependencies.

#### Scenario: npm ecosystem updates
- **WHEN** Dependabot runs on its weekly schedule
- **THEN** `.github/dependabot.yml` configures the npm ecosystem with grouping for dev-dependencies
- **AND** `open-pull-requests-limit` is set to 10 with labels `["dependencies", "automated"]`
- **AND** ignore rules are configured for major React updates

### Requirement: Dependabot configuration for GitHub Actions
The repository SHALL enable Dependabot for the GitHub Actions ecosystem on a weekly schedule in the same config file.

#### Scenario: Actions ecosystem updates
- **WHEN** Dependabot runs on its weekly schedule
- **THEN** `.github/dependabot.yml` configures the GitHub Actions ecosystem in the same config file
- **AND** dependency update pull requests for Actions are created automatically
