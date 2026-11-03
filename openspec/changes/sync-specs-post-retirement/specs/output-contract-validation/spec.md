# output-contract-validation Delta

## MODIFIED Requirements

### Requirement: Concurrent telemetry is thread-safe

_(Scenario-scoped delta — only the drifted scenario is restated.)_

#### Scenario: Concurrent delegations are thread-safe

- **WHEN** multiple `task` tool calls complete in quick succession across different agents (e.g., main, researcher, reviewer)
- **THEN** telemetry counters for each agent are independent
- **AND** `fs.appendFileSync` calls serialize safely on Node.js (single-threaded event loop, atomic for small writes)

> The original example list named `developer` and `git-manager`, both retired (`single-main-agent`, `retire-command-wrapper-agents`); the scenario's point is independence across _different agents_, not the specific names.
