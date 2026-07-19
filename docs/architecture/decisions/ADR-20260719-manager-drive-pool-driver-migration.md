# ADR-20260719: Manager Drive Pool Driver Migration

- Status: temporary exception
- Owner: sdkwork-drive maintainers
- Removal milestone: before the next Manager production release
- Canonical standard: `../../../sdkwork-specs/DATABASE_SPEC_PROCESS_SHARED_POOL.md`

## Decision

The Manager process enables the canonical process-shared `sqlx::PgPool` before IAM bootstrap. IAM, Manager, Order, Promotion, Payment, and Membership reuse that pool through `sdkwork-database-sqlx`.

Drive currently requires `sqlx::AnyPool` for its dual PostgreSQL/SQLite repository surface. Until those production repositories migrate to `sqlx::PgPool`, Manager embeds Drive's existing process-singleton `AnyPool` as a temporary second-driver exception. Drive must use the same PostgreSQL database, schema, credential identity, and TLS profile as the Manager process; the previous Manager-specific Drive SQLite override is removed.

The compatibility pool is created through the public process registry only when `SDKWORK_DATABASE_TEMPORARY_ANY_POOL_EXCEPTION=true`; the registry compares Drive's normalized identity with the canonical Manager pool and fails startup on mismatch.

The configured 10-connection development process budget is divided by the database framework: at
most 5 connections for the canonical Manager pool and 5 for Drive. The exception cannot enlarge the
process budget. This is migration debt and must not be described as single-pool compliance.

## Removal Criteria

1. Drive production route and repository state accepts the installed `DatabasePool::Postgres` handle.
2. The embedded Manager path no longer constructs or installs an `AnyPool`.
3. The temporary exception is removed from `specs/process-database-pool.spec.json`.
4. Live startup evidence shows one Manager process pool and clean shutdown returns its connections.
