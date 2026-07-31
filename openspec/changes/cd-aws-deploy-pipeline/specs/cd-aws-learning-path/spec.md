## Purpose

Provide a structured, Floci-based AWS learning path whose milestones unlock each real-AWS phase of the CD pipeline (ECR, ECS, RDS, OIDC), plus the AWS architecture and Terraform reference documentation.

## ADDED Requirements

### Requirement: Structured learning path with Floci
The system SHALL provide a documented, milestone-based learning path that uses Floci (the free local AWS emulator) to practice each AWS service before it is used for real, with a checkpoint task per milestone.

#### Scenario: Each milestone has emulated practice and a checkpoint
- **WHEN** a learner reaches a milestone (e.g. ECR, ECS, RDS, OIDC)
- **THEN** the learning path documents an emulated practice exercise with Floci and a concrete checkpoint task that verifies the acquired knowledge

#### Scenario: Real AWS phase unlocks after milestone
- **WHEN** the milestone checkpoint is completed and its infrastructure prerequisite exists
- **THEN** the corresponding real-AWS phase of the CD pipeline (documented in this change) becomes eligible to run

### Requirement: AWS architecture documentation
The system SHALL document the target AWS architecture for the server (container orchestration, load balancing, managed PostgreSQL, container registry, IAM federation) so the infrastructure is reproducible and reviewable before provisioning.

#### Scenario: Architecture doc describes components and network
- **WHEN** an engineer reads the architecture documentation
- **THEN** they find the component inventory (compute, load balancer, database, registry, identity), their relationships, and the network layout

#### Scenario: Terraform reference available
- **WHEN** infrastructure is to be provisioned
- **THEN** the documentation provides a Terraform reference (or equivalent IaC) covering the components, usable as the starting point for real provisioning

### Requirement: No real cloud cost during learning
The learning path SHALL be executable without a real AWS account: all practice exercises run against Floci and ephemeral local services, so no cloud resources or costs are incurred during the learning phase.

#### Scenario: Practice runs fully emulated
- **WHEN** the learner follows the learning path
- **THEN** every practice exercise uses the Floci emulator and local ephemeral services with zero AWS account usage

### Requirement: Pipeline phase gating is explicit and visible
The real-AWS phases of the CD pipeline SHALL be visibly gated so it is always clear whether the pipeline is running in "learning/preparation mode" (no cloud) or "fully active" (cloud deployed), avoiding silent partial deployments.

#### Scenario: Skipped cloud steps are clearly reported
- **WHEN** the pipeline runs without the AWS infrastructure configured
- **THEN** every skipped cloud step reports a clear reason and the run still completes green for the non-cloud stages
