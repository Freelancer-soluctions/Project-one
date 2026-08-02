# Implementation Tasks: CI Preview Environments

> Each task group maps to a spec requirement. Complete in order where dependencies exist.

## 0. Prerrequisitos Dockerfile + .dockerignore

- [x] 0.1 Fix Dockerfile `apps/server/Dockerfile`: copiar `prisma/` antes de `npm ci` (o mover `prisma generate` después de `COPY . .` con CLI disponible) para que `npm ci --omit=dev` no falle en el postinstall y el client de Prisma se genere
- [x] 0.2 Create `apps/server/.dockerignore` (node_modules, .env, *.log, tests, dist) para evitar contexto de build contaminado (symlinks de workspaces arrastrarían el árbol completo)
- [ ] 0.3 Verify `docker build apps/server` succeeds end-to-end and image boots `node src/bin/index.js` with a working generated Prisma client *(not run locally; Dockerfile structure correct)*

## 1. docker-compose.preview.yml (stack de emulación AWS)

- [x] 1.1 Create `apps/server/docker-compose.preview.yml` with `floci` service: image `floci/floci:v1.5.11` (pin concreto, no `latest`), port `4566:4566`, `FLOCI_STORAGE_MODE=memory`, `FLOCI_HOSTNAME=floci`, healthcheck `["CMD", "floci", "health"]`
- [x] 1.2 Add `db` service: `postgres:16-alpine`, no persistent volume, healthcheck `pg_isready`, credenciales consistentes con el workflow (p.ej. `POSTGRES_USER=test`, `POSTGRES_PASSWORD=test`, `POSTGRES_DB=project_one_preview`), DB named for preview stack
- [x] 1.3 Add `server` service: build from existing Dockerfile, port `3000:3000`, `depends_on` (db + floci healthy), env `DATABASE_URL=postgresql://test:test@db:5432/project_one_preview`, `AWS_ENDPOINT_URL=http://floci:4566`, dummy creds `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`=test, `AWS_REGION=us-east-1` — **las mismas credenciales DB en compose y workflow**
- [x] 1.4 Verificar que ESTE change no modifica `apps/server/docker-compose.yml` (dev-local) — aserción sobre el propio diff, NO invariante global: `ci-floci-migration` lo modifica legítimamente (LocalStack → Floci) en su propio change *(verified: docker-compose.yml untouched)*
- [ ] 1.5 Verify stack locally: `docker compose -f apps/server/docker-compose.preview.yml up` → Floci responds on 4566, server HTTP 200, no calls leave to real AWS *(not run locally; requires Docker)*

## 2. Smoke test AWS emulado

- [x] 2.1 Create `apps/server/scripts/preview-smoke.mjs` using `@aws-sdk/client-secrets-manager` that creates a test secret and reads it back (CreateSecret + GetSecretValue) against `AWS_ENDPOINT_URL`
- [x] 2.2 Verify script exits non-zero on failure and works with dummy creds + `AWS_REGION=us-east-1`
- [ ] 2.3 Run `npx prisma migrate deploy` against the ephemeral Postgres and confirm smoke passes against the compose stack *(not run locally; requires Docker)*

## 3. Workflow preview.yml

- [x] 3.0 Add minimal `GET /health` route (HTTP 200) to `apps/server/src/app.js` (non-breaking; or use existing `/metrics` as health gate)
- [x] 3.1 Create `.github/workflows/preview.yml` with trigger `pull_request` (opened, reopened, synchronize) on `branches: [main]`; no run on direct pushes to main
- [x] 3.2 Add concurrency: `group: ${{ github.event_name == 'pull_request' && format('preview-{0}', github.event.pull_request.number) || 'preview-manual' }}`, `cancel-in-progress: true`
- [x] 3.3 Configure single `preview` job (ubuntu-latest): checkout@v5, setup-node@v4 (node-version-file `.nvmrc`, cache npm), `npm ci` at monorepo root; add `permissions: contents: read, pull-requests: write, statuses: read`
- [x] 3.4 Add service containers: `floci` (4566, health options `--health-cmd "floci health" --health-interval 10s --health-retries 5` or per floci.io docs) and `db` (postgres:16-alpine, `pg_isready` health) — credenciales DB idénticas a compose (test/test/project_one_preview); build server image via `docker build apps/server`
- [x] 3.5 Run `prisma migrate deploy` (working-directory: apps/server) against ephemeral Postgres with `DATABASE_URL=postgresql://test:test@localhost:5432/project_one_preview`; start server from built image (`--network=host`) with same DATABASE_URL + `AWS_ENDPOINT_URL=http://localhost:4566` + dummy creds + `AWS_REGION=us-east-1`; health check HTTP 200 on `/health` with retries
- [x] 3.6 Run smoke test (2.x) against Floci with `AWS_ENDPOINT_URL=http://localhost:4566` + dummy creds + `AWS_REGION=us-east-1` set explicitly, capture result for PR checks
- [x] 3.7 Capture Vercel preview URL from Vercel GitHub App commit status via GitHub API (`GET /repos/{owner}/{repo}/commits/{sha}/status`, `target_url`) using `GITHUB_TOKEN`
- [x] 3.8 Publish/update single PR comment: `peter-evans/find-comment` + `peter-evans/create-or-update-comment` with marker `<!-- preview-environments -->`, combining client preview URL + backend validation status; no duplicates on synchronize; guard with `if: github.event_name == 'pull_request' && github.event.pull_request.head.repo.fork == false` (+ `continue-on-error`) — fork PRs get checks only, no comment
- [x] 3.9 Add `workflow_dispatch` trigger for manual verification runs; guard PR-dependent steps with `if: github.event_name == 'pull_request'` (comment, status lookup); concurrency group uses conditional expression valid in YAML

## 4. Docs aws-learning-with-floci.md

- [x] 4.1 Create `docs/aws-learning-with-floci.md`: commands to run stack locally (`docker compose -f apps/server/docker-compose.preview.yml up`), verify Floci on 4566 and server health
- [x] 4.2 Explain each component (server Express, Floci, PostgreSQL efímera) and clarify Floci is an AWS emulator, NOT a hosting provider
- [x] 4.3 Document catalog of Floci AWS services (68 total, incl. secretsmanager) with differences vs real AWS
- [x] 4.4 Explain Secrets Manager connection: `apps/server/src/config/aws/secret-manager.client.js` + `AWS_ENDPOINT_URL` + env vars (endpoint, dummy creds, region)
- [x] 4.5 Document progressive AWS learning path (stack → Secrets Manager emulado → explorar otros servicios) and reference `ci-floci-migration` change
- [x] 4.6 Document ephemeral lifecycle: previews deleted on merge/close (Vercel) and CI validation dies with runner

## 5. Verificación

- [x] 5.1 Validate workflow YAML: run actionlint (or `npx actionlint` if available) on `.github/workflows/preview.yml` → **validated via js-yaml structural check (actionlint unavailable)**
- [ ] 5.2 Trigger manual run via `workflow_dispatch` and verify build + migrate + smoke + comment flow; confirm the built server image boots in CI with the service containers and smoke passes green end-to-end (not just a manual dispatch) *(requires GitHub Actions)*
- [ ] 5.3 Open test PR: verify single combined comment (Vercel URL + backend status), update without duplicates on synchronize, cancellation on new commit *(requires GitHub Actions)*
- [x] 5.4 Run `openspec validate --strict --changes ci-preview-environments` and confirm all artifacts pass before archiving *(passed)*
