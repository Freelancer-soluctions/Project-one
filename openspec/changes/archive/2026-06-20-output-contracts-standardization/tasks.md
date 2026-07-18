## 1. Schema Foundation

- [x] 1.1 Create `docs/opencode/prompts/contracts/` directory structure
- [x] 1.2 Create common base schema (`base.schema.json`) with shared fields: `agent`, `timestamp`, `responseType`, `version`
- [x] 1.3 Create `developer.schema.json` — define required fields (status, action, filesChanged, details, nextSteps)
- [x] 1.4 Create `spec-manager.schema.json` — define required fields (status, changeName, artifactId, details)
- [x] 1.5 Create `git-manager.schema.json` — define required fields (status, operation, branch, commitHash, details)
- [x] 1.6 Create `reviewer.schema.json` — define required fields (status, findings, passedChecks, failedChecks, summary)
- [x] 1.7 Create `planner.schema.json` — define required fields (verdict, critical_issues, suggestions, task_amendments) — Planner validates and provides feedback on plans, does not track execution status
- [x] 1.8 Create `orchestrator.schema.json` — define required fields (status, delegatedAgent, workflowStep, result)
- [x] 1.9 Define success response structure in each schema with `responseTypes.success` containing agent-specific result fields
- [x] 1.10 Define failure response structure in each schema with `responseTypes.failure` containing `error.code` and `error.message`

## 2. Prompt Integration

- [x] 2.1 Add `## Output Contract` section to `developer.md` with XML envelope template, schema reference, and success/failure examples
- [x] 2.2 Add `## Output Contract` section to `spec-manager.md` with XML envelope template, schema reference, and success/failure examples
- [x] 2.3 Add `## Output Contract` section to `git-manager.md` with XML envelope template, schema reference, and success/failure examples
- [x] 2.4 Add `## Output Contract` section to `reviewer.md` with XML envelope template, schema reference, and success/failure examples
- [x] 2.5 Add `## Output Contract` section to `planner.md` with XML envelope template, schema reference, and success/failure examples
- [x] 2.6 Add `## Output Contract` section to `orchestrator.md` with XML envelope template, schema reference, and success/failure examples
- [x] 2.7 Add `## Output Contract` section to `project-manager.md` and `researcher.md` with respective schema references
- [x] 2.8 Position all `## Output Contract` sections as penultimate (immediately before Tools/Execution Rules) in each prompt
- [x] 2.9 Add instruction in each section: "Wrap ALL responses in `<output-contract>` envelope"
- [x] 2.10 Add `schema-reference` subsection in each section: "See `docs/opencode/prompts/contracts/<agent>.schema.json` for full field definitions"

## 3. Validation Logic

- [x] 3.1 Implement `parseContractEnvelope(response)` — regex-based XML envelope parser extracting `agent`, `version`, and inner JSON
- [x] 3.2 Implement `loadAgentSchema(agentName)` — loads and caches JSON schema from `docs/opencode/prompts/contracts/<agent>.schema.json`
- [x] 3.3 Implement `validatePayload(payload, schema)` — field presence and type checker against schema `required` and `properties`
- [x] 3.4 Implement `validateResponseType(payload)` — checks `responseType` is either `"success"` or `"failure"`
- [x] 3.5 Implement `validateSuccessPayload(payload, schema)` — validates success-specific fields when `responseType === "success"`
- [x] 3.6 Implement `validateFailurePayload(payload, schema)` — validates failure-specific fields (`error.code`, `error.message`) when `responseType === "failure"`
- [x] 3.7 Implement `validateContract(response, agentName)` — orchestrator-level integration that chains parse → load → validate
- [x] 3.8 Implement retry logic — on validation failure, request retry with specific error details (max 2 retries)
- [x] 3.9 Implement escalation — when max retries exceeded, create structured error report with raw response + validation errors
- [x] 3.10 Implement graceful degradation — if no schema file exists for agent, log warning and pass response unvalidated

## 4. Documentation & Verification

- [x] 4.1 Write `docs/opencode/output-contracts.md` explaining the contract system, envelope format, and per-agent schemas
- [x] 4.2 Add contract validation step to the verification workflow (`opsx-verify.md`)
- [x] 4.3 Create unit tests for `parseContractEnvelope()` covering valid envelope, missing envelope, and malformed envelope cases
- [x] 4.4 Create unit tests for `validatePayload()` covering all-required-fields-present, missing-field, and type-mismatch cases
- [x] 4.5 Create unit tests for retry logic covering first-failure-retry, max-retries escalation, and graceful degradation
- [x] 4.6 Verify all 6+ schema files load and validate correctly against their agent prompts
- [x] 4.7 Verify all agent prompts contain the `## Output Contract` section in the correct position
