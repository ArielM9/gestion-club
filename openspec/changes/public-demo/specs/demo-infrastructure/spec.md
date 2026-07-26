# Demo Infrastructure Specification

## Purpose

Defines the deployment infrastructure for a self-contained public demo: Docker Compose stack, CI/CD nightly reset, and branch isolation strategy.

## Requirements

### Requirement: Branch Isolation

The system SHALL maintain a dedicated `demo` branch that diverges from `main` and MUST NEVER be merged back.

#### Scenario: Demo branch exists independently

- GIVEN the `main` branch exists with production code
- WHEN the demo feature is deployed
- THEN a `demo` branch exists containing demo-specific overrides
- AND the `demo` branch has no merge path to `main`

#### Scenario: Weekly rebase keeps demo current

- GIVEN the `demo` branch has drifted from `main`
- WHEN the weekly rebase workflow runs
- THEN the `demo` branch is rebased onto latest `main`
- AND demo-specific overrides are preserved

### Requirement: Docker Compose Stack

The system SHALL provide a `docker-compose.yml` that runs the full application stack locally or on a VPS.

#### Scenario: Full stack starts from single command

- GIVEN `docker-compose.yml` and `.env.demo` are present
- WHEN `docker compose --env-file .env.demo up -d` is executed
- THEN three services start: `app` (Next.js), `db` (PostgreSQL), `storage` (MinIO)
- AND the app is accessible on port 3000

#### Scenario: Services use correct environment

- GIVEN the demo stack is running
- WHEN the app connects to dependencies
- THEN PostgreSQL uses the `victorianos_demo` database
- AND MinIO uses the `club-files` bucket
- AND `NEXT_PUBLIC_IS_DEMO=true` is set in the app service

### Requirement: Nightly Reset

The system SHALL reset the demo instance nightly via GitHub Actions cron.

#### Scenario: Nightly reset triggers at 02:00 UTC

- GIVEN the GitHub Actions workflow is configured
- WHEN the cron schedule `0 2 * * *` fires
- THEN the workflow destroys existing Docker volumes
- AND rebuilds and re-seeds the stack from scratch
- AND the demo is available within 10 minutes

#### Scenario: Reset preserves MinIO assets

- GIVEN the nightly reset runs
- WHEN volumes are destroyed and recreated
- THEN the seed script re-uploads all MinIO assets (photos, documents)
- AND no stale or expired presigned URLs remain

### Requirement: Environment Configuration

The system SHALL use a `.env.demo` file to configure all demo-specific variables.

#### Scenario: Demo env file defines all required variables

- GIVEN `.env.demo` exists in the repository root
- WHEN the demo stack starts
- THEN `NEXT_PUBLIC_IS_DEMO=true` is set
- AND `DATABASE_URL` points to the demo PostgreSQL instance
- AND `S3_*` variables point to the demo MinIO instance
- AND no production credentials are present

## Non-Requirements

- Production deployment configuration (out of scope — demo only)
- Kubernetes or cloud-native orchestration (Docker Compose is sufficient)
- SSL/TLS termination (handled by reverse proxy / Coolify)
- Blue-green or canary deployment strategies

## Dependencies

- Existing Prisma schema and seed script (modified by `demo-seed`)
- Better Auth configuration (modified by `demo-mode`)
- S3/MinIO client setup (`lib/s3.ts`)
