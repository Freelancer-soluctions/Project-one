# AWS CD Learning Path

> **Progressive, Floci-based learning path to unlock each real-AWS phase of the CD pipeline**
>
> This document maps each AWS service (ECR → ECS → RDS → OIDC) to a hands-on emulated practice with Floci and a verifiable checkpoint. Complete each milestone to unlock the corresponding Phase 2 task in `openspec/changes/cd-aws-deploy-pipeline/tasks.md`.
>
> **Key principle**: All learning runs locally/CI with Floci — **zero AWS account, zero cloud cost** (design decision D1, spec `cd-aws-learning-path`).

---

## 🎯 Learning Path Overview

| Milestone | AWS Service | Floci Practice | Checkpoint Task | Unlocks Phase 2 Task |
|-----------|-------------|----------------|-----------------|---------------------|
| **M1** | **ECR** | Push/pull Docker images to emulated ECR | `aws ecr describe-repositories` shows `project-one-server` | Task 5.2: Create real ECR repo + lifecycle policy |
| **M2** | **ECS Fargate** | Register task definition, create service, deploy | `aws ecs describe-services` shows RUNNING task with health checks | Tasks 6.2–6.5: Provision VPC/ALB/ECS staging + deploy |
| **M3** | **RDS PostgreSQL** | Create DB, run Prisma migrations, connect app | `prisma migrate deploy` succeeds against emulated RDS | Tasks 7.2–7.4: Provision real RDS + Secrets Manager wiring |
| **M4** | **IAM OIDC** | Configure GitHub OIDC provider + role trust policy | `aws sts assume-role-with-web-identity` works from Floci | Tasks 5.3, 8.1: Real OIDC role + GitHub variable |

> **Cross-references**:
> - `docs/aws-learning-with-floci.md` — Progressive AWS learning levels 1–5 (sibling `ci-preview-environments`)
> - `docs/aws-dev-local-floci.md` — Local dev setup with Floci (sibling `ci-floci-migration`)

---

## 📚 Pedagogical Sequence: Console-Guided → Terraform

> **Design Decision D9**: Learn by touching services in the AWS Console first, then codify in Terraform. This document guides the **console-guided practice**; `docs/aws-deploy-architecture.md` provides the **Terraform reference** for reproducibility.

```
┌─────────────────────────────────────────────────────────────────┐
│  LEARNING PHASE (Floci, zero cost)                             │
├─────────────────────────────────────────────────────────────────┤
│  1. Read concept → 2. Floci emulated practice → 3. Checkpoint  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  CONSOLE-GUIDED PHASE (Real AWS, Phase 2)                      │
├─────────────────────────────────────────────────────────────────┤
│  1. Repeat practice in AWS Console (guided)                    │
│  2. Understand each resource, its dependencies, and limits     │
│  3. Document gotchas, naming, and configuration                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│  TERRAFORM CODIFICATION PHASE (Reference in aws-deploy-arch)   │
├─────────────────────────────────────────────────────────────────┤
│  1. Translate console resources to Terraform modules           │
│  2. Store state in S3 + DynamoDB locking                       │
│  3. Validate: `terraform plan` → `terraform apply`             │
│  4. Destroy test resources, re-apply from clean state          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🏁 Milestone 1: ECR (Elastic Container Registry)

### Concept
Private Docker registry for immutable SHA-tagged images. The CD pipeline pushes `project-one-server:${GITHUB_SHA}` and `latest`; rollback redeploys a previous SHA tag.

### Floci Emulated Practice

```bash
# Prereq: Floci running (see aws-learning-with-floci.md)
cd apps/server

# 1. Build the image locally
docker build -t project-one-server:learning -f Dockerfile .

# 2. Create repository in Floci ECR
aws --endpoint-url=http://localhost:4566 ecr create-repository \
  --repository-name project-one-server \
  --image-scanning-configuration scanOnPush=true

# 3. Tag and push
aws --endpoint-url=http://localhost:4566 ecr get-login-password \
  | docker login --username AWS --password-stdin localhost:4566

docker tag project-one-server:learning localhost:4566/project-one-server:learning
docker tag project-one-server:learning localhost:4566/project-one-server:latest
docker push localhost:4566/project-one-server:learning
docker push localhost:4566/project-one-server:latest

# 4. Verify
aws --endpoint-url=http://localhost:4566 ecr describe-images \
  --repository-name project-one-server

# 5. Simulate lifecycle policy (Floci doesn't enforce, but API works)
aws --endpoint-url=http://localhost:4566 ecr put-lifecycle-policy \
  --repository-name project-one-server \
  --lifecycle-policy-text '{
    "rules": [
      {"rulePriority": 1, "description": "Keep last 30", "selection": {"tagStatus": "any", "countType": "imageCountMoreThan", "countNumber": 30}, "action": {"type": "expire"}},
      {"rulePriority": 2, "description": "Expire > 30 days", "selection": {"tagStatus": "any", "countType": "sinceImagePushed", "countUnit": "days", "countNumber": 30}, "action": {"type": "expire"}}
    ]
  }'
```

### ✅ Checkpoint Task (Verifiable)
```bash
# Run this — must succeed without errors
aws --endpoint-url=http://localhost:4566 ecr describe-repositories \
  --repository-names project-one-server \
  --query 'repositories[0].repositoryName' \
  --output text
# Expected output: project-one-server
```
**Mark complete**: ☐ `M1-ECR-CHECKPOINT` in your learning log

### Unlocks
- **Task 5.2**: Create real ECR repo `project-one-server` + lifecycle policy (console-guided)
- **Task 5.3**: Configure OIDC role with ECR push permissions

---

## 🏁 Milestone 2: ECS Fargate (Staging)

### Concept
Serverless container orchestration. Deployment = (1) `register-task-definition` with new SHA image (new revision), (2) `update-service --force-new-deployment` with circuit breaker. ALB provides stickiness + idle timeout ≥ 65s for Socket.IO.

### Floci Emulated Practice

```bash
# Prereq: Floci running, ECR repo exists (M1 complete)

# 1. Create VPC + subnets + security groups (emulated - Floci supports subset)
# Note: Floci VPC/EC2 emulation is partial. Focus on ECS API calls.

# 2. Create ECS cluster
aws --endpoint-url=http://localhost:4566 ecs create-cluster \
  --cluster-name project-one-staging \
  --settings name=containerInsights,value=enabled

# 3. Register task definition (simulate with local image ref)
aws --endpoint-url=http://localhost:4566 ecs register-task-definition \
  --family project-one-staging-api \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu "256" \
  --memory "512" \
  --execution-role-arn arn:aws:iam::000000000000:role/ecsTaskExecutionRole \
  --task-role-arn arn:aws:iam::000000000000:role/ecsTaskRole \
  --container-definitions '[
    {
      "name": "api",
      "image": "localhost:4566/project-one-server:learning",
      "portMappings": [{"containerPort": 3000, "protocol": "tcp"}],
      "environment": [{"name": "NODE_ENV", "value": "staging"}, {"name": "PORT", "value": "3000"}],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:us-east-1:000000000000:secret:staging-db-url"},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:us-east-1:000000000000:secret:staging-jwt"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {"awslogs-group": "/ecs/project-one-staging", "awslogs-region": "us-east-1", "awslogs-stream-prefix": "api"}
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
        "interval": 30, "timeout": 5, "retries": 3, "startPeriod": 60
      }
    }
  ]'

# 4. Create service (requires VPC/subnet/SG - use Floci defaults or mock ARNs)
aws --endpoint-url=http://localhost:4566 ecs create-service \
  --cluster project-one-staging \
  --service-name api \
  --task-definition project-one-staging-api:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration 'awsvpcConfiguration={subnets=["subnet-12345"],securityGroups=["sg-12345"],assignPublicIp=DISABLED}' \
  --deployment-configuration 'deploymentCircuitBreaker={enable=true,rollback=true}'

# 5. Simulate deployment (new task definition revision)
aws --endpoint-url=http://localhost:4566 ecs register-task-definition \
  --family project-one-staging-api \
  --network-mode awsvpc \
  --requires-compatibilities FARGATE \
  --cpu "256" --memory "512" \
  --execution-role-arn arn:aws:iam::000000000000:role/ecsTaskExecutionRole \
  --task-role-arn arn:aws:iam::000000000000:role/ecsTaskRole \
  --container-definitions '[
    {"name":"api","image":"localhost:4566/project-one-server:latest","portMappings":[{"containerPort":3000,"protocol":"tcp"}],"environment":[{"name":"NODE_ENV","value":"staging"},{"name":"PORT","value":"3000"}],"secrets":[{"name":"DATABASE_URL","valueFrom":"arn:aws:secretsmanager:us-east-1:000000000000:secret:staging-db-url"},{"name":"JWT_SECRET","valueFrom":"arn:aws:secretsmanager:us-east-1:000000000000:secret:staging-jwt"}],"logConfiguration":{"logDriver":"awslogs","options":{"awslogs-group":"/ecs/project-one-staging","awslogs-region":"us-east-1","awslogs-stream-prefix":"api"}},"healthCheck":{"command":["CMD-SHELL","curl -f http://localhost:3000/health || exit 1"],"interval":30,"timeout":5,"retries":3,"startPeriod":60}}
  ]'

aws --endpoint-url=http://localhost:4566 ecs update-service \
  --cluster project-one-staging \
  --service api \
  --task-definition project-one-staging-api:2 \
  --force-new-deployment \
  --deployment-configuration 'deploymentCircuitBreaker={enable=true,rollback=true}'

# 6. Wait for stability
aws --endpoint-url=http://localhost:4566 ecs wait services-stable \
  --cluster project-one-staging --services api
```

### ✅ Checkpoint Task (Verifiable)
```bash
# Run this — must show RUNNING status and desiredCount = runningCount = 1
aws --endpoint-url=http://localhost:4566 ecs describe-services \
  --cluster project-one-staging \
  --services api \
  --query 'services[0].{status:status, desired:desiredCount, running:runningCount, pending:pendingCount}' \
  --output table
# Expected: status=ACTIVE, desired=1, running=1, pending=0
```
**Mark complete**: ☐ `M2-ECS-CHECKPOINT` in your learning log

### Unlocks
- **Tasks 6.2–6.5**: Provision real VPC, ALB (stickiness + idle timeout ≥ 65s), ECS staging cluster, GitHub `staging` environment secrets, real deploy

---

## 🏁 Milestone 3: RDS PostgreSQL

### Concept
Managed PostgreSQL with automated backups, PITR, and security group isolation. Prisma migrations run as part of deploy (preferably via ECS one-off task to avoid runner IP whitelisting).

### Floci Emulated Practice

```bash
# Prereq: Floci running

# 1. Create DB subnet group (Floci emulates RDS API)
aws --endpoint-url=http://localhost:4566 rds create-db-subnet-group \
  --db-subnet-group-name project-one-db-subnet-group \
  --db-subnet-group-description "Project One DB subnets" \
  --subnet-ids subnet-12345 subnet-67890

# 2. Create parameter group (force SSL)
aws --endpoint-url=http://localhost:4566 rds create-db-parameter-group \
  --db-parameter-group-name project-one-pg16 \
  --db-parameter-group-family postgres16 \
  --description "Postgres 16 with force_ssl"

aws --endpoint-url=http://localhost:4566 rds modify-db-parameter-group \
  --db-parameter-group-name project-one-pg16 \
  --parameters "ParameterName=rds.force_ssl,ParameterValue=1,ApplyMethod=pending-reboot"

# 3. Create RDS instance (staging: single-AZ, minimal)
aws --endpoint-url=http://localhost:4566 rds create-db-instance \
  --db-instance-identifier project-one-staging-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 16.4 \
  --allocated-storage 20 \
  --storage-encrypted \
  --db-subnet-group-name project-one-db-subnet-group \
  --vpc-security-group-ids sg-12345 \
  --db-parameter-group-name project-one-pg16 \
  --db-name project_one \
  --master-username appuser \
  --master-user-password <REDACTED_DB_CREDENTIAL> \
  --backup-retention-period 7 \
  --multi-az false \
  --deletion-protection false

# 4. Wait for available
aws --endpoint-url=http://localhost:4566 rds wait db-instance-available \
  --db-instance-identifier project-one-staging-db

# 5. Get endpoint and run Prisma migrations
ENDPOINT=$(aws --endpoint-url=http://localhost:4566 rds describe-db-instances \
  --db-instance-identifier project-one-staging-db \
  --query 'DBInstances[0].Endpoint.Address' --output text)

DATABASE_URL="<DATABASE_URL>" \
  npx prisma migrate deploy

# 6. Verify schema
DATABASE_URL="<DATABASE_URL>" \
  npx prisma db pull --print
```

### ✅ Checkpoint Task (Verifiable)
```bash
# Run this — must show tables created by Prisma
DATABASE_URL="<DATABASE_URL>" \
  npx prisma db execute --stdin <<'SQL'
\dt
SQL
# Expected: tables like User, _prisma_migrations, etc.
```
**Mark complete**: ☐ `M3-RDS-CHECKPOINT` in your learning log

### Unlocks
- **Tasks 7.2–7.4**: Provision real RDS (staging: t3.micro, prod: Multi-AZ), `DATABASE_URL` as GitHub env secret → Secrets Manager, wire `loadSecrets()` in app bootstrap

---

## 🏁 Milestone 4: IAM OIDC (GitHub Actions → AWS)

### Concept
Federate GitHub OIDC provider with IAM role. No long-lived access keys. Role trust policy restricted to `repo:<owner>/<repo>` + environment filter. Least-privilege policy for ECR + ECS.

### Floci Emulated Practice

```bash
# Prereq: Floci running (IAM/STS emulated)

# 1. Create OIDC provider (GitHub)
aws --endpoint-url=http://localhost:4566 iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1

# 2. Create trust policy document (save as trust-policy.json)
cat > trust-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowGitHubActions",
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::000000000000:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:OWNER/REPO:*"
        },
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        }
      }
    }
  ]
}
EOF

# 3. Create role
aws --endpoint-url=http://localhost:4566 iam create-role \
  --role-name project-one-github-actions \
  --assume-role-policy-document file://trust-policy.json \
  --max-session-duration 3600

# 4. Create least-privilege policy (save as cd-policy.json)
cat > cd-policy.json <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ECRPushPull",
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:InitiateLayerUpload",
        "ecr:PutImage",
        "ecr:CompleteLayerUpload",
        "ecr:BatchCheckLayerAvailability",
        "ecr:BatchGetImage",
        "ecr:GetDownloadUrlForLayer"
      ],
      "Resource": "arn:aws:ecr:us-east-1:000000000000:repository/project-one-server/*"
    },
    {
      "Sid": "ECSCRUD",
      "Effect": "Allow",
      "Action": [
        "ecs:RegisterTaskDefinition",
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:DescribeTaskDefinition",
        "ecs:ListTasks",
        "ecs:WaitServicesStable"
      ],
      "Resource": [
        "arn:aws:ecs:us-east-1:000000000000:cluster/project-one-staging",
        "arn:aws:ecs:us-east-1:000000000000:cluster/project-one-prod",
        "arn:aws:ecs:us-east-1:000000000000:task-definition/project-one-staging-api:*",
        "arn:aws:ecs:us-east-1:000000000000:task-definition/project-one-prod-api:*"
      ]
    }
  ]
}
EOF

aws --endpoint-url=http://localhost:4566 iam create-policy \
  --policy-name project-one-github-actions-cd \
  --policy-document file://cd-policy.json

# 5. Attach policy to role
aws --endpoint-url=http://localhost:4566 iam attach-role-policy \
  --role-name project-one-github-actions \
  --policy-arn arn:aws:iam::000000000000:policy/project-one-github-actions-cd

# 6. Test assume-role (simulate GitHub OIDC token)
# Note: Floci STS may not fully validate OIDC token; this tests the trust policy structure
aws --endpoint-url=http://localhost:4566 sts assume-role-with-web-identity \
  --role-arn arn:aws:iam::000000000000:role/project-one-github-actions \
  --role-session-name test-session \
  --web-identity-token "dummy-token" \
  --duration-seconds 900
```

### ✅ Checkpoint Task (Verifiable)
```bash
# Run this — must show role with correct trust policy and attached policy
aws --endpoint-url=http://localhost:4566 iam get-role \
  --role-name project-one-github-actions \
  --query 'Role.{Arn:Arn, AssumeRolePolicyDocument:AssumeRolePolicyDocument}' \
  --output json

aws --endpoint-url=http://localhost:4566 iam list-attached-role-policies \
  --role-name project-one-github-actions \
  --query 'AttachedPolicies[].PolicyName' \
  --output table
# Expected: project-one-github-actions-cd
```
**Mark complete**: ☐ `M4-OIDC-CHECKPOINT` in your learning log

### Unlocks
- **Task 5.3**: Create real OIDC provider + role with subject restriction to your repo
- **Task 5.4**: Add `AWS_ROLE_ARN` as GitHub **repository variable** (not secret — D6)
- **Task 8.1**: Production OIDC verification

---

## 💰 Phase 2 Cost Estimate & Mitigation

> **Design Decision D1, Risk: Cost AWS during Phase 2** — Mitigation documented here.

### Estimated Monthly Cost (us-east-1, minimal config)

| Resource | Config | Est. Monthly Cost |
|----------|--------|-------------------|
| **ECS Fargate (staging)** | 1 task × 0.25 vCPU / 0.5 GB, 24/7 | ~$7–10 |
| **ECS Fargate (prod)** | 1 task × 0.5 vCPU / 1 GB, 24/7 | ~$14–20 |
| **ALB** | 1 LB + LCU (low traffic) | ~$16–20 |
| **RDS PostgreSQL (staging)** | db.t3.micro, 20 GB, single-AZ, 7-day backup | ~$13–18 |
| **RDS PostgreSQL (prod)** | db.t3.micro, 20 GB, Multi-AZ, 30-day backup | ~$35–50 |
| **ECR** | ~2 GB storage, minimal transfer | ~$0.20 |
| **CloudWatch Logs** | ~1 GB ingestion + storage | ~$0.50 |
| **NAT Gateway** | 2 AZs, minimal data | ~$32–45 |
| **Total (24/7)** | | **~$118–184/month** |

### Mitigation Strategies (Reduce to ~$30–50/month)

1. **Shutdown outside hours** (biggest savings):
   ```bash
   # Staging: scale to 0 nights/weekends via EventBridge + Lambda
   # Or: stop ECS service (desired-count=0) on schedule
   aws ecs update-service --cluster project-one-staging --service api --desired-count 0
   ```

2. **RDS Instance Scheduling**:
   - Staging: stop instance nights/weekends (`aws rds stop-db-instance`)
   - Prod: keep running (Multi-AZ required for HA), but use `db.t3.micro` + Serverless v2 min capacity

3. **NAT Gateway**: Single NAT for staging (or use NAT Instance for dev), or VPC endpoints for ECR/S3/Secrets Manager to avoid NAT traffic

4. **Fargate Spot** (staging only): Up to 70% discount, acceptable for non-prod

5. **ALB**: Required — no direct alternative for public HTTPS + stickiness

### Zero-Cost Learning Guarantee
> **Spec `cd-aws-learning-path` Requirement**: "All practice exercises run against Floci and local ephemeral services, so no cloud resources or costs are incurred during the learning phase."
>
> ✅ **This learning path is 100% executable without an AWS account.** All milestones use Floci emulator (`floci/floci:v1.5.11`) and local PostgreSQL. No AWS credentials needed. No cloud resources created. Zero cost.

---

## 📋 Learning Log Template

Copy this to your local notes and check off as you complete each milestone:

```
# AWS CD Learning Log — Project One

## Milestone 1: ECR
☐ Read concept
☐ Floci practice completed
☐ M1-ECR-CHECKPOINT passed
☐ Console-guided: Created real ECR repo + lifecycle policy
☐ Terraform: Added ECR module to aws-deploy-architecture.md reference

## Milestone 2: ECS Fargate (Staging)
☐ Read concept
☐ Floci practice completed
☐ M2-ECS-CHECKPOINT passed
☐ Console-guided: Provisioned VPC, ALB (stickiness+idle≥65s), ECS cluster, service
☐ Terraform: Added VPC/ALB/ECS modules to reference

## Milestone 3: RDS PostgreSQL
☐ Read concept
☐ Floci practice completed
☐ M3-RDS-CHECKPOINT passed
☐ Console-guided: Provisioned RDS (staging t3.micro, prod Multi-AZ), ran migrations
☐ Terraform: Added RDS module to reference

## Milestone 4: IAM OIDC
☐ Read concept
☐ Floci practice completed
☐ M4-OIDC-CHECKPOINT passed
☐ Console-guided: Created OIDC provider, role with repo-restricted trust, least-priv policy
☐ Terraform: Added IAM OIDC module to reference

## Phase 2 Activation
☐ AWS_ROLE_ARN added as GitHub repository variable (not secret)
☐ GitHub staging environment secrets configured
☐ deploy.yml jobs activate (no longer skipped)
☐ Staging deploy green + smoke tests pass
☐ Production deploy with approval + 5-min health check pass
☐ Rollback verified (circuit breaker + manual tag redeploy + prisma migrate down)
```

---

## 🔗 Cross-References

| Document | Purpose |
|----------|---------|
| `docs/aws-deploy-architecture.md` | Component inventory, network layout, **Terraform reference** (D9) |
| `docs/aws-learning-with-floci.md` | Progressive AWS learning levels 1–5 (sibling `ci-preview-environments`) |
| `docs/aws-dev-local-floci.md` | Local dev setup with Floci (sibling `ci-floci-migration`) |
| `openspec/changes/cd-aws-deploy-pipeline/tasks.md` | Phase 2 tasks unlocked by milestones (5.x–9.x) |
| `openspec/changes/cd-aws-deploy-pipeline/design.md` | Design decisions D1–D10 |
| `.github/workflows/deploy.yml` | Pipeline with gated jobs (Phase 1 scaffold + Phase 2 real) |

---

*Generated as part of OpenSpec change `cd-aws-deploy-pipeline` — tasks 3.3, 3.4.*