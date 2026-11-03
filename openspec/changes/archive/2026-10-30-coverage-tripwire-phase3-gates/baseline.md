# Phase 0 — Coverage baseline (2026-10-30)

Commands were run against full coverage suites using the local tripwire:

| Command                            | Exit code | Duration | Result                     |
| ---------------------------------- | --------: | -------: | -------------------------- |
| `npm run coverage:check -- client` |         0 |   98.2 s | All configured floors pass |
| `npm run coverage:check -- server` |         0 |    6.8 s | All configured floors pass |

The full command outputs were retained during implementation at
`C:/Users/user/AppData/Local/Temp/opencode/coverage-phase0-client.log` and
`C:/Users/user/AppData/Local/Temp/opencode/coverage-phase0-server.log`.

The generated `coverage-summary.json` workspace totals at the baseline were:

| Workspace | Statements | Branches | Functions |  Lines |
| --------- | ---------: | -------: | --------: | -----: |
| Client    |     71.41% |   50.36% |    60.89% | 71.91% |
| Server    |     63.95% |   65.66% |    68.23% | 64.72% |

Server inventory was counted from non-test source files under each named module. There are no
`*.unit.test.ts` files in these nine modules. The server unit coverage summary contains no entries
for eight modules; `stock` contains only `schemas/stock.joi.ts` (3/3 statements and lines, 100%;
zero branches/functions). An absent coverage-summary entry is recorded as **unmeasured**, not as a
measured 0%: v8 only reports files loaded by the executed unit suite.

| Critical module     | Source files | Unit test files | Files present in coverage summary |
| ------------------- | -----------: | --------------: | --------------------------------: |
| `auth`              |            6 |               0 |                                 0 |
| `permission`        |            6 |               0 |                                 0 |
| `users`             |            7 |               0 |                                 0 |
| `payroll`           |            6 |               0 |                                 0 |
| `sales`             |            6 |               0 |                                 0 |
| `inventoryMovement` |            6 |               0 |                                 0 |
| `stock`             |            6 |               0 |                                 1 |
| `warehouse`         |            6 |               0 |                                 0 |
| `expenses`          |            6 |               0 |                                 0 |
| **Total**           |       **55** |           **0** |                             **1** |

The 55 exact source paths are declared individually in `.coverage-critical-paths.json`; crypto is
also represented there as two additional exempt source paths. Every exemption has an owner,
reason, and expiry (`2027-01-30`).
