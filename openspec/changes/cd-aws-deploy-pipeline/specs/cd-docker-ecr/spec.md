## Purpose

Build, tag and validate the server container image on every merge to main so the project always produces a deployable, immutable artifact — and, once the AWS learning milestone is reached, push it to Amazon ECR.

## ADDED Requirements

### Requirement: Dockerfile produces a bootable image with working Prisma client
The system SHALL build the server image with a Dockerfile that generates the Prisma client during build (fixing the `npm ci --omit=dev` postinstall failure), so the image boots `node src/bin/index.js` with a functional database client.

#### Scenario: Build from a clean context
- **WHEN** `docker build apps/server` runs against a clean working tree
- **THEN** the build succeeds, the Prisma client is generated, and the image starts the Express + Socket.IO server without errors

#### Scenario: Image boots and responds
- **WHEN** the built image is started with a reachable PostgreSQL and its HTTP port exposed
- **THEN** the server responds HTTP 200 on its health endpoint

### Requirement: Immutable image tagging
The pipeline SHALL tag every built image with an immutable identifier derived from the source revision (the git SHA) and additionally maintain a mutable `latest` tag for convenience.

#### Scenario: Push to main produces a SHA tag
- **WHEN** a commit is merged to `main`
- **THEN** the pipeline builds the image and tags it with the full commit SHA (and `latest`), so the artifact is traceable to its exact source revision

### Requirement: Image validation without a real AWS account
The pipeline SHALL validate that the built image boots and passes smoke checks against an emulated AWS stack (Floci + ephemeral PostgreSQL) before any step that requires a real AWS account, so builds are verifiable with zero cloud cost.

#### Scenario: Validation runs with emulated services
- **WHEN** the pipeline runs the image validation job
- **THEN** it starts the image against Floci and an ephemeral PostgreSQL, runs the smoke checks, and fails the build if the image does not boot correctly

#### Scenario: No real AWS calls during validation
- **WHEN** the validation job runs
- **THEN** no request leaves for real AWS services; all AWS interactions go through the emulator endpoint

### Requirement: ECR push gated on infrastructure readiness
The pipeline SHALL push the validated image to Amazon ECR only when the AWS infrastructure (OIDC role and ECR repository) is configured; otherwise the push job SHALL be skipped with a clear, visible status.

#### Scenario: OIDC role and ECR repository configured
- **WHEN** the `AWS_ROLE_ARN` repository variable is set and the ECR repository exists
- **THEN** the pipeline authenticates via OIDC, pushes the SHA-tagged image, and reports the ECR image URI

#### Scenario: AWS infrastructure not yet configured
- **WHEN** the OIDC role variable is absent or the repository does not exist
- **THEN** the push step is skipped, the build+validation job still completes green, and the skip reason is visible in the job output

### Requirement: Container registry credentials without long-lived keys
The pipeline SHALL authenticate to AWS using short-lived federated credentials via OIDC instead of static access keys, so no long-lived AWS credentials are stored as GitHub secrets.

#### Scenario: Authentication via OIDC
- **WHEN** a job needs AWS credentials
- **THEN** it assumes the configured IAM role through GitHub OIDC with the region `us-east-1`, without requiring stored access key secrets
