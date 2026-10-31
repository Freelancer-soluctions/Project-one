# Spec Delta

> **Delta sobre `openspec/specs/pre-push-scoped-testing/spec.md` (4 requirements).** Este change inserta una etapa
> SAST en el hook `pre-push`, lo que cambia de facto el contrato de `### Requirement: Pre-push hook runs scoped
tests`: los tests scoped pasan a ejecutarse **condicionados** a que las etapas anteriores (guard de `origin/main`,
> gate de firma y SAST diff-scoped) hayan pasado. El bloque MODIFIED copia el requirement con sus **tres scenarios y
> títulos intactos** y añade dos scenarios nuevos. Los otros tres requirements de la capability (_Fallback when
> origin/main is unavailable_, _Three-tier strategy documented_, _Architectural decisions updated_) no cambian y por
> eso no se repiten, aunque el segundo y el tercero tienen tareas de documentación asociadas en este change
> (tareas 7.4 y 7.7).
>
> **Corrección oportunista de drift.** El scenario del spec vigente invoca
> `npx vitest run --changed origin/main --config apps/server/vitest.config.js`. Esa forma dejó de ser la del hook en
> el change `coverage-tripwire-stage-2d` (hoy el hook delega en los scripts `test:changed` de cada workspace, que es
> lo que consume el CI). Como este delta ya toca el requirement, la línea se reconcilia aquí en vez de dejar un
> comando inexistente en la spec archivada. El presupuesto de 30 s también se acota: pertenece a la etapa de tests,
> no al hook completo (que ahora incluye SAST con su propio presupuesto).

## MODIFIED Requirements

### Requirement: Pre-push hook runs scoped tests

The pre-push hook SHALL run only tests affected by the diff between HEAD and `origin/main`, instead of the full test suite, and SHALL run them only after the earlier stages of the hook — `origin/main` guard, commit-signature gate and diff-scoped SAST — have passed.

#### Scenario: Successful push with scoped tests

- **WHEN** a developer pushes commits to a remote branch
- **THEN** the pre-push hook SHALL run the workspace-scoped test scripts for the changed packages (`npm run test:changed --workspace=apps/server` and `--workspace=apps/client`)
- **AND** the pre-push hook SHALL NOT run `npm run test:unit` or `npm run test:integration` (full suites)
- **AND** the scoped-test stage SHOULD complete within 30 seconds (GitHub SSH timeout limit)

#### Scenario: E2E tests excluded from pre-push

- **WHEN** the pre-push hook executes
- **THEN** it SHALL NOT run Playwright E2E tests
- **AND** it SHALL NOT run any test requiring browser binaries

#### Scenario: DB integration tests excluded from pre-push

- **WHEN** the pre-push hook executes
- **THEN** it SHALL NOT run Prisma-based integration tests that require a PostgreSQL database
- **AND** it SHALL NOT run any test requiring database connectivity

#### Scenario: Tests are not executed when an earlier stage blocks

- **WHEN** the commit-signature gate or the diff-scoped SAST stage of the hook fails
- **THEN** the scoped tests SHALL NOT be executed
- **AND** the hook exits non-zero without paying the cost of the test suite

#### Scenario: The test budget is separate from the SAST budget

- **WHEN** the hook runs both the SAST and the scoped-test stages
- **THEN** the 30-second expectation applies to the scoped-test stage alone
- **AND** the SAST stage is bounded by its own documented budget, measured and recorded separately
