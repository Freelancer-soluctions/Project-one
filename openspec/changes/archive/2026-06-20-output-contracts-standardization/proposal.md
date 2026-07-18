## Why

Agent responses in the current system are unstructured, making them difficult for the orchestrator to parse, validate, and act upon programmatically. As the number of agents grows (developer, spec-manager, git-manager, reviewer, researcher, project-manager, planner, orchestrator), inconsistent response formats lead to fragile parsing logic, increased error rates, and wasted tokens on re-clarification. Implementing XML-enveloped JSON output contracts solves this by establishing a predictable, machine-parseable contract for every agent response.

## What Changes

- Define an XML-enveloped JSON output contract format: `<output-contract agent="[name]" version="1"> { JSON payload } </output-contract>`
- Create per-agent JSON Schema files (`docs/opencode/prompts/contracts/`) defining required fields for each response type
- Add an `## Output Contract` section to all 8 agent prompt files (developer.md, spec-manager.md, git-manager.md, reviewer.md, researcher.md, project-manager.md, planner.md, orchestrator.md)
- Define success and failure response formats per agent with mandatory fields
- Add orchestrator-side validation logic to parse and verify agent responses against contracts
- Update orchestrator delegation logic to expect contract-enveloped responses

## Capabilities

### New Capabilities

- `output-contract-schemas`: JSON Schema definitions for each agent's output contract, stored under `docs/opencode/prompts/contracts/`. Each schema defines required fields, response types (success/failure), and field types for its agent.
- `agent-prompt-integration`: Integration of output contract format and behavior into all 8 agent prompt files, including the XML envelope format, success/failure response templates, and instructions to wrap all responses in contracts.
- `orchestrator-validation`: Validation logic enabling the orchestrator to parse the XML envelope, validate the JSON payload against the agent's schema, and handle contract violations (retry, fail, or escalate).

### Modified Capabilities

*(None — this is a new cross-cutting capability with no existing spec-level behavior changes.)*

## Impact

- **Agent prompt files**: All 8 `docs/opencode/prompts/` agent prompts will receive a new required section
- **Build/CI**: No build dependency changes; purely configuration + documentation
- **Performance**: Minimal overhead from XML envelope parsing (microseconds per response)
- **Backward compatibility**: Existing agents continue to work; contracts are additive
- **Repository structure**: New directory `docs/opencode/prompts/contracts/` with 9 JSON schema files
- **Orchestrator logic**: Requires parsing logic but no architectural changes to delegation flow
