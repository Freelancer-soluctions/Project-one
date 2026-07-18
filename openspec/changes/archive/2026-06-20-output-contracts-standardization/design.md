## Context

The OpenSpec agent ecosystem consists of 8 agents (developer, spec-manager, git-manager, reviewer, project-manager, planner, orchestrator, and researcher) that communicate via natural language responses. Currently, each agent returns unstructured markdown/text, forcing the orchestrator to use brittle pattern matching to extract status, decisions, errors, and next steps.

This design introduces a lightweight XML-enveloped JSON contract layer — not replacing natural language, but wrapping it with structured metadata. The orchestrator can parse the envelope, validate the payload against per-agent JSON schemas, and handle violations predictably.

**Constraints:**
- Must be additive — existing agents work without changes during migration
- Minimal overhead — XML envelope + JSON schema validation should add <1ms per response
- Self-documenting — schemas live alongside prompt files in `docs/opencode/prompts/contracts/`
- No new runtime dependencies — validation uses lightweight JSON schema comparison, not a full schema validator library

## Goals / Non-Goals

**Goals:**
- Define a standard XML-enveloped JSON output format for all agent responses
- Create per-agent JSON schemas at `docs/opencode/prompts/contracts/<agent>.schema.json`
- Integrate output contract instructions into all 8 agent prompt files
- Enable orchestrator to parse, validate, and handle violations
- Define success/failure response formats per agent
- Keep migration path: agents can adopt contracts incrementally

**Non-Goals:**
- No changes to the agent execution engine or tool-calling infrastructure
- No runtime JSON Schema validator library — validation uses simple field-presence checks (schema defines the contract; orchestrator checks required fields exist with correct types)
- No wire protocol changes — contracts apply at the response level, not transport
- No breaking changes to existing agent behavior — natural language content continues as-is inside the JSON payload

## Decisions

### Decision 1: XML envelope over pure JSON
**Choice:** `<output-contract agent="[name]" version="1"> { JSON payload } </output-contract>`
**Rationale:** 
- XML tags are visually distinct and easy for LLMs to generate reliably (closing tags are explicit)
- The envelope can be detected via simple regex: `<output-contract[\s\S]*?</output-contract>`
- Pure JSON is harder to delimit in free-form text responses — LLMs sometimes embed JSON inside code blocks with varying syntax
- **Alternatives considered:** 
  - Pure JSON-in-markdown: Rejected — inconsistent code block fencing across LLM providers
  - YAML front matter: Rejected — less machine-parseable and harder to nest structured data
  - Custom markdown extensions: Rejected — too complex and non-standard

### Decision 2: JSON Schema Draft 2020-12 format for schemas
**Choice:** Define schemas using JSON Schema Draft 2020-12 format with `allOf` composition and `$ref` to a shared base schema
**Rationale:**
- JSON Schema Draft 2020-12 is the standard format — enables tooling validation and IDE autocomplete
- `allOf` + `$ref: base.schema.json` provides DRY composition (shared fields defined once)
- Custom `responseTypes` extension defines success/failure-specific field requirements
- No runtime validator library needed — the orchestrator uses simple field-presence + type checks against the schema structure
- **Alternatives considered:**
  - Simplified custom schema format: Initially considered but rejected — lacked tooling support, required custom parser, no ecosystem benefits
  - Plain TypeScript types: Rejected — not runtime-accessible without compilation
  - Plain markdown tables: Rejected — not machine-parseable

### Decision 3: Schemas co-located in `docs/opencode/prompts/contracts/`
**Choice:** All agent schemas live under `docs/opencode/prompts/contracts/<agent>.schema.json`
**Rationale:**
- Keeps contracts alongside agent prompts in the `docs/opencode/` documentation hierarchy
- Single directory makes it easy to validate all contracts with a single glob
- `docs/` is version-controlled but not deployed — no risk of leaking to production
- **Alternatives considered:**
  - `.opencode/contracts/`: Initially considered but moved to `docs/` for better project documentation structure
  - `openspec/contracts/`: Rejected — OpenSpec is for change management, not agent config

### Decision 4: Validation at orchestrator delegation boundary
**Choice:** The orchestrator validates the contract envelope immediately after receiving a response from a subagent, before processing the payload
**Rationale:**
- Early validation catches malformed responses before they cause cascading errors
- The orchestrator can request a retry with clear feedback on what was missing
- Validation is lightweight (field presence check) so it adds negligible latency
- **Alternatives considered:**
  - Post-hoc validation during workflow steps: Rejected — errors surface too late
  - Agent self-validation: Rejected — unreliable (the malformed agent would validate its own malformed output)

## Output Contracts Architecture

### 1. Why XML Envelopes?
- **Explanation:** They provide a reliable delimiter for parsing structured output in a free-form text world, enabling deterministic extraction of JSON payloads even when surrounded by descriptive text.
- **Why not pure JSON?** Pure JSON is easily corrupted by surrounding prose; XML tags are more tolerant of surrounding text.

### 2. Envelope Format
- Use `<output-contract agent="[AGENT_NAME]" version="1">` ... `</output-contract>` to wrap the JSON payload.
- **Rationale:** Tags are unambiguous, survive preamble/caveman, and can be parsed with simple regex.

### 3. Caveman Mode Handling
- **Delegation level:** Full flow (caveman still allowed)
- **Response level:** Encloses JSON payload in envelope
- **Encoding:** Use minimal field names in caveman mode (e.g., `s` for status, `cs` for critical_issues) but keep the envelope tags intact.
- **Example compressed envelope:**
  ```
  <output-contract a="reviewer" v="1">
  {"v":"ok","c":["SQLi"]}
  </output-contract>
  ```
- When delegate is in caveman mode, the orchestrator still expects the response to end with the envelope.
- Subagent must output compressed JSON within envelope, but can truncate field names to single letters if needed.
- The orchestrator performs parsing regardless of mode.

### 4. Schema Usage
- Each agent's response is validated against its JSON schema located at `docs/opencode/prompts/contracts/<agent>.schema.json`
- Validation includes: presence, type, enum constraints
- Schema validation is optional but recommended for high-stakes agents

## Risks / Trade-offs

- **[Risk] LLMs may forget the XML envelope format** → Mitigation: Include the exact template in every agent prompt's Output Contract section with explicit instruction to use it
- **[Risk] Schema drift** — contracts may fall out of sync with actual agent behavior → Mitigation: Include contract validation in the verification workflow and add a simple `openspec validate-contracts` command
- **[Risk] Agent prompt bloat** — adding contract sections increases token usage → Mitigation: Keep schemas external (referenced by path, not inlined) and contract prose to <50 lines per agent
- **[Trade-off] Simplified schemas vs standard JSON Schema** — simplified schemas can't express complex constraints (enums, pattern matching, conditional requirements) → Accepted: agent responses are simple enough that field presence + type checking covers 95% of validation needs
