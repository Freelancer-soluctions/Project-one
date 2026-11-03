# TASK-07 — Add a Prisma index for a slow query

## Task ID & Title

`TASK-07` — Add one composite index that fixes a measured slow query, delivered as
a reviewed Prisma migration.

## Scope

- **Goal:** a documented slow query gets a matching composite index via
  `schema.prisma` + a generated migration; the query plan improves.
- **In scope:** `apps/server/prisma/schema.prisma`, one migration, a query-plan
  before/after note.
- **Out of scope:** changing query logic, denormalizing columns, adding a cache.
- **Affected apps:** server.

## Inputs

- The slow query and its current `EXPLAIN` output with measured timing.
- Local Postgres, `npm run prisma-migration` available in `apps/server`.

## Steps expected

1. grill-me — column order of the composite index, write-path cost, whether an
   existing index already covers the predicate.
2. spec — `server-data-model` delta: index definition and the query it serves.
3. review — reviewer checks the index is not redundant with an existing one.
4. implement — schema change + generated, reversible migration.
5. verify — `prisma migrate` applied locally; `EXPLAIN` shows the index used;
   server tests pass.
6. commit — `feat(server)` commit including schema + migration, signed, DCO signoff.
7. Trello — card created and linked.

## Expected artifacts

- OpenSpec change with a `server-data-model` delta.
- `schema.prisma` diff + `prisma/migrations/<timestamp>_*/migration.sql`.
- Before/after `EXPLAIN` output with timings.
- One signed commit; one Trello card id.

## Acceptance criteria

- [ ] Migration is applied and reversible locally.
- [ ] `EXPLAIN` shows the new index used by the target query.
- [ ] No existing index is made redundant; no unrelated schema change.
- [ ] Server tests remain green.
- [ ] Commit is conventional, signed, DCO-signed-off, and references the Trello card.

## Run notes

### Run A

_pending_

### Run B

_pending_
