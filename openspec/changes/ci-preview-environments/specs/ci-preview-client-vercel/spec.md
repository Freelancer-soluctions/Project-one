## Purpose

Creates automatic Vercel preview deployments of the React client for every pull request via the native Vercel GitHub App, giving each PR a unique frontend URL without custom deployment actions.

## ADDED Requirements

### Requirement: Automatic client preview per PR

The system SHALL create a Vercel preview deployment of the React client for each pull request opened against `main`, using the native Vercel GitHub App integration (dashboard configuration, not a custom workflow action).

#### Scenario: PR opened triggers client preview
- **WHEN** a pull request is opened or synchronized against `main`
- **THEN** Vercel creates a preview deployment of the client from `apps/client`
- **AND** a unique preview URL is generated for that deployment

#### Scenario: Client build uses project settings
- **WHEN** Vercel builds the preview deployment
- **THEN** it uses the Vite framework preset with root directory `apps/client`
- **AND** the build runs the client build script producing static assets in `apps/client/dist`

### Requirement: Preview URL availability

The Vercel preview URL SHALL be retrievable by the preview workflow so it can be published in the pull request comment alongside the backend emulation validation results.

#### Scenario: Workflow captures client preview URL
- **WHEN** the Vercel preview deployment for the PR branch completes
- **THEN** the workflow retrieves the deployment URL from the Vercel commit status (`GET /repos/{owner}/{repo}/commits/{sha}/status`) using the automatic `GITHUB_TOKEN` (no custom secrets)
- **AND** includes that URL in the pull request comment

#### Scenario: Preview URL is per-branch
- **WHEN** the client branch changes (new commit pushed)
- **THEN** Vercel creates an updated preview deployment for the same PR
- **AND** the published comment is updated with the new URL

### Requirement: No production impact

Client preview deployments SHALL never promote to production and SHALL NOT affect the production Vercel deployment.

#### Scenario: Preview is isolated from production
- **WHEN** a preview deployment is created
- **THEN** it is deployed to Vercel's preview environment only
- **AND** the production deployment and its URL remain unchanged
