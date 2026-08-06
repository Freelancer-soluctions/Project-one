# Output Contracts System

## Overview

The Output Contract system provides **structured response formatting** for agent-to-orchestrator communication in the multi-agent orchestration layer. Every agent response is wrapped in an XML envelope containing a JSON payload that conforms to a defined JSON Schema.

**Benefits:**
- Machine-parseable responses for automated validation
- Consistent structure across all agents
- Two-tier validation: JSON Schema (runtime) + prompt template (flexibility)
- Retry and escalation on validation failures
- Graceful degradation when schemas are missing

> **📌 Current State (2026-07-16)**: The output contract system is enforced via a **HYBRID 3-layer architecture** (see §Runtime Enforcement — Architecture below).
> - **Layer 1** — Prompt Self-Validation: Active since `output-contracts-hardening` (archived 2026-07-08). **Reinforced 2026-07-16**: CRITICAL first-line instruction added to all 8 prompts to prevent context-truncation envelope loss.
> - **Layer 2** — Hook Runtime Validation: Active since `output-contracts-hook-migration` (archived 2026-07-16). Runtime-verified: 16 JSONL audit entries (all pre-fix), 0 post-fix entries after envelope-position fix.
> - **Layer 3** — Orchestrator Escalation: Active. Reads `metadata.contractValidation` from Layer 2.
> - All 27/27 OpenSpec tasks completed. Verified by `@reviewer`: 17/17 spec scenarios covered, 8/8 design decisions followed, security PASS.
> - **Envelope-Position Fix (2026-07-16)**: Root cause of persistent "Invalid or missing output-contract envelope" errors was that the `## OUTPUT CONTRACT` section sat in the MIDDLE of each prompt (line 48 for developer.md). Context truncation caused the instruction to be lost. Fix: CRITICAL first-line instruction placed at line 1 of all 8 prompts. Verified via trivial test task to @developer — envelope now produced correctly.
> - **JSON-Payload-Parse Fix (2026-07-16)**: Root cause of "Failed to parse JSON payload" errors was competing output-format sections in 4 prompts (`researcher.md` `## OUTPUT FORMAT`, `spec-manager.md` `# REPORTING FORMAT`, `reviewer.md` `## OUTPUT FORMAT`, `project-manager.md` `# REPORTING FORMAT`) that confused the model into producing markdown/text inside the envelope instead of valid JSON. Fix: converted all 4 competing sections to "JSON Content Guidance" + added `**JSON Escaping Rules**` block to all 8 OUTPUT CONTRACT sections. Affected agents: researcher (2 errors), spec-manager (2 errors). Developer unaffected (no competing section).

---

## Envelope Format

All agent responses use the XML-enveloped JSON format:

```xml
<output-contract agent="developer" version="1">
{
  "agent": "developer",
  "timestamp": "2025-01-15T10:30:00Z",
  "responseType": "success",
  "version": 1,
  "status": "completed",
  "action": "implement-task",
  "filesChanged": ["apps/server/src/auth/middleware.ts"],
  "details": "Created JWT auth middleware with token validation",
  "nextSteps": ["Add protected routes", "Write unit tests"],
  "taskId": "1.2",
  "changeName": "jwt-auth"
}
</output-contract>
```

**XML Attributes:**
| Attribute | Description |
|-----------|-------------|
| `agent` | Agent name (e.g., "developer", "spec-manager") |
| `version` | Contract version (currently `1`) |

---

## Base Fields

Every contract payload includes these base fields (from `base.schema.json`):

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `agent` | string | ✅ | Agent name that produced the response |
| `timestamp` | string (ISO 8601) | ✅ | When the response was generated |
| `responseType` | string | ✅ | Either `"success"` or `"failure"` |
| `version` | integer | ✅ | Contract version (always `1`) |

---

## Per-Agent Schemas

### Developer

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | enum: completed, in-progress, blocked, failed | ✅ | Task execution status |
| `action` | string | ✅ | Action taken (e.g., "implement-task") |
| `filesChanged` | array of strings | ❌ | Files created or modified |
| `details` | string | ✅ | Human-readable description |
| `nextSteps` | array of strings | ❌ | Recommended next steps |
| `taskId` | string | ❌ | Task ID from tasks.md |
| `changeName` | string | ❌ | OpenSpec change name |

### Spec-Manager

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | enum: completed, failed | ✅ | Command execution status |
| `command` | string | ✅ | OpenSpec command executed |
| `changeName` | string | ❌ | Change name |
| `artifactId` | string | ❌ | Artifact created/modified |
| `details` | string | ✅ | Human-readable description |
| `artifactsCreated` | array of strings | ❌ | List of created artifacts |
| `workflowState` | string | ❌ | Current workflow state |

### Git-Manager

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | enum: completed, failed | ✅ | Operation status |
| `operation` | string | ✅ | Git/GitHub operation (e.g., "commit-all") |
| `branch` | string | ❌ | Current branch |
| `commitHash` | string | ❌ | Commit hash |
| `details` | string | ✅ | Human-readable description |
| `filesStaged` | array of strings | ❌ | Staged files |
| `conventionalCommit` | string | ❌ | Conventional commit message |
| `githubResult` | object | ❌ | GitHub API result (for gists, issues, PRs) |

### Reviewer

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | enum: completed, failed | ✅ | Review status |
| `verdict` | enum: APPROVED, NEEDS CHANGES, REJECTED | ✅ | Review verdict |
| `details` | string | ✅ | Human-readable summary |
| `criticalIssues` | array of objects | ❌ | Critical issues found |
| `highPriority` | array of objects | ❌ | High priority issues |
| `mediumPriority` | array of objects | ❌ | Medium priority issues |
| `lowPriority` | array of objects | ❌ | Low priority issues |
| `testCoverage` | object | ❌ | Test coverage assessment |
| `securityAssessment` | string | ❌ | Security assessment result |

### Planner

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `verdict` | enum: APPROVED, NEEDS CHANGES, NEEDS CLARIFICATION | ✅ | Plan review verdict |
| `criticalIssues` | array of objects | ✅ | Critical issues (can be empty) |
| `suggestions` | array of objects | ❌ | Improvement suggestions |
| `taskAmendments` | array of objects | ❌ | Proposed task changes |
| `details` | string | ✅ | Human-readable summary |
| `designAlignment` | enum: ALIGNED, MISALIGNED, PARTIAL | ❌ | Design alignment |
| `specCompleteness` | enum: COMPLETE, INCOMPLETE, PARTIAL | ❌ | Spec completeness |
| `riskAssessment` | enum: LOW, MEDIUM, HIGH | ❌ | Risk assessment |

### Orchestrator

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | enum: completed, in-progress, blocked, failed | ✅ | Orchestration step status |
| `delegatedAgent` | string | ✅ | Agent delegated to |
| `workflowStep` | enum: exploration, specification, review, implementation, verification, archive | ✅ | Current workflow step |
| `result` | enum: success, partial, failed, retry, escalated | ✅ | Delegation result |
| `details` | string | ✅ | Human-readable description |
| `changeName` | string | ❌ | Change name |
| `validationErrors` | array of objects | ❌ | Contract validation errors |
| `retryCount` | integer | ❌ | Retry attempts |
| `nextSteps` | array of strings | ❌ | Next steps |

### Project-Manager

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | enum: completed, failed | ✅ | Action status |
| `command` | string | ✅ | Trello command executed |
| `details` | string | ✅ | Human-readable description |
| `changeName` | string | ❌ | OpenSpec change name |
| `cardId` | string | ❌ | Trello card ID |
| `cardUrl` | string (URI) | ❌ | Trello card URL |
| `listName` | string | ❌ | Trello list name |
| `workflowState` | enum: backlog, specification, review, in-progress, verification, done | ❌ | Workflow state |

### Researcher

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `status` | enum: completed, partial, failed | ✅ | Research status |
| `topic` | string | ✅ | Topic investigated |
| `findings` | array of strings | ✅ | Key findings |
| `details` | string | ✅ | Human-readable summary |
| `recommendation` | string | ❌ | Primary recommendation |
| `sources` | array of strings | ❌ | Sources consulted |
| `alternatives` | array of {name, reason} | ❌ | Alternatives considered |
| `risks` | array of strings | ❌ | Identified risks |
| `nextSteps` | array of strings | ❌ | Recommended next steps |

---

## Success vs Failure Response Types

### Success Response

```json
{
  "responseType": "success",
  "status": "completed",
  "details": "Task completed successfully",
  "nextSteps": ["Proceed to next task"]
}
```

### Failure Response

```json
{
  "responseType": "failure",
  "status": "failed",
  "details": "Task failed due to missing dependency",
  "error": {
    "code": "SCHEMA_MISSING",
    "message": "User model not defined in Prisma schema",
    "details": "Run prisma migration first"
  }
}
```

**Error structure** (required for all failure responses):
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `error.code` | string | ✅ | Machine-readable error code |
| `error.message` | string | ✅ | Human-readable error message |
| `error.details` | string | ❌ | Additional context |

---

## Validation Module

Location: `docs/opencode/prompts/contracts/contractValidator.js`

**API:**

| Function | Parameters | Returns |
|----------|-----------|---------|
| `parseContractEnvelope(response)` | Raw agent response string | `{agent, version, payload}` or throws `ContractParseError` |
| `loadAgentSchema(agentName)` | Agent name string | Schema object or `null` (if missing); registers with Ajv |
| `validateContract(response, agentName)` | Raw response + agent name | `{valid, agent, version, errors, payload, degraded?}` |
| `withRetry(agentName, response, options?)` | Agent name + response + optional `{maxRetries?, reissue?}` | `Promise<{exhausted, reissueRequired, reissuePossible, validationErrors, retryCount, maxRetries}>` |
| `createEscalationReport(...)` | All params | Escalation report object |
| `isDegraded(agentName)` | Agent name | boolean |
| `clearDegraded(agentName)` | Agent name | void (clears DEGRADED_AGENTS + schemaCache + validatorCache) |

---

### validateContract — 6-Stage Pipeline

`validateContract(response, agentName)` executes 6 sequential stages. Each stage short-circuits on failure:

```
┌──────────────────────────────────────────────────────────────┐
│ validateContract(response, agentName)                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  STAGE 1 — XML Envelope Parsing                              │
│  parseContractEnvelope(response)                              │
│  ├─ Regex: matches <output-contract agent="X" version="Y">   │
│  │   Accepts both orderings (agent first or version first)  │
│  │   Accepts single and double quotes (backreferences)       │
│  │   Allows trailing whitespace before >                     │
│  ├─ Extracts JSON payload between tags                        │
│  └─ JSON.parse the payload                                    │
│  Short-circuit: throws ContractParseError                     │
│                                                              │
│  STAGE 2 — Agent Name Match                                  │
│  Checks envelope's agent attribute matches expected agentName │
│  Short-circuit: {valid:false, errors:[{message:"Agent        │
│                   mismatch: expected X, got Y"}]}            │
│                                                              │
│  STAGE 3 — Payload Type Guard                                │
│  Rejects null (typeof null === 'object' in JS), arrays,       │
│  strings, numbers                                             │
│  Short-circuit: {valid:false, errors:[{message:"Payload      │
│                   must be a JSON object (null/array         │
│                   rejected)"}]}                               │
│                                                              │
│  STAGE 4 — Degraded Mode Check                               │
│  ├─ Fast-path: DEGRADED_AGENTS.has(agentName)?               │
│  │   → return {valid:true, degraded:true, fast-path}          │
│  │   (no disk I/O)                                           │
│  └─ Cold-path: loadAgentSchema(agentName)                    │
│      ├─ File missing → DEGRADED_AGENTS.add + degraded:true   │
│      └─ File found → load + cache + ajv.addSchema             │
│                                                              │
│  STAGE 5 — Ajv Base Validation                               │
│  validateWithAjv(schema, payload)                             │
│  ├─ ajv.compile(schema) → validate function                  │
│  │   (cached by Ajv internals; $ref resolves via             │
│  │    pre-registered base.schema.json)                        │
│  ├─ validate(payload) → {valid, errors}                       │
│  └─ Map Ajv errors to {field, message} format                │
│  Short-circuit: {valid:false, errors:[{field, message}]}     │
│                                                              │
│  STAGE 6 — Sub-Schema Dispatch (responseTypes branching)      │
│  validateSubSchema(schema, payload, agentName)               │
│  ├─ Read payload.responseType ('success' or 'failure')       │
│  ├─ Look up schema.responseTypes[responseType]               │
│  ├─ If exists: compile + validate against sub-schema         │
│  │   (cached under ${agentName}_success / ${agentName}_failure)│
│  └─ If missing: skip (backward compat)                       │
│  Short-circuit: {valid:false, errors:[...baseErrors,         │
│                                        ...subSchemaErrors]}  │
│                                                              │
│  Final: {valid:true, degraded:false}                         │
└──────────────────────────────────────────────────────────────┘
```

#### Stage 1 — XML Envelope Parsing

```javascript
// contractValidator.js:72 — regex accepts 4 variations
/<output-contract\s+(?:agent=(["'])([^"']+)\1\s+version=(["'])(\d+)\3|
                                 version=(["'])(\d+)\5\s+agent=(["'])([^"']+)\7)\s*>/
```

The regex uses **backreferences** (`\1`, `\3`, `\5`, `\7`) to enforce matching quote types. `agent="developer'` fails because `\1` requires the closing quote to match the opening quote character.

Closing tag uses `lastIndexOf('</output-contract>')` (not regex) to handle nested content naturally.

#### Stage 4 — Degraded Mode: Fast-path vs Cold-path

| Path | Trigger | Disk I/O? | Return |
|------|---------|-----------|--------|
| **Fast-path** | `DEGRADED_AGENTS.has(agentName)` is true | None | `{valid:true, degraded:true, warning:"...fast-path"}` |
| **Cold-path Entry** | `loadAgentSchema()` returns `null` | `fs.existsSync` → schema missing | Adds to Set, returns degraded |
| **Cold-path Success** | `loadAgentSchema()` returns schema | One `fs.readFileSync` | Continues to Stage 5 |

`loadAgentSchema` also:
1. Strips `$schema` from loaded JSON (to prevent Ajv from attempting meta-schema URI resolution)
2. Stores in `schemaCache` (Map)
3. Registers with Ajv via `ajv.addSchema(schema, '${agentName}.schema.json')` — required for `$ref` resolution

#### Stage 5 — Ajv Validation and Error Mapping

```javascript
// contractValidator.js:105-117 — error field mapping
const errors = validate.errors.map(e => {
  let field;
  if (e.instancePath && e.instancePath !== '') {
    // JSON Pointer "/status/code" → "status.code"
    field = e.instancePath.replace(/^\//, '').replace(/\//g, '.');
  } else if (e.params?.missingProperty) {
    // Required field absent — e.params.missingProperty = "action"
    field = e.params.missingProperty;
  } else if (e.params?.additionalProperty) {
    // Unknown field present — e.params.additionalProperty = "extraField"
    field = e.params.additionalProperty;
  } else {
    field = 'unknown';
  }
  return { field, message: e.message || '' };
});
```

| Ajv error condition | `instancePath` | Result `field` |
|---------------------|----------------|----------------|
| Field at root | `"/status"` | `"status"` |
| Nested field | `"/error/code"` | `"error.code"` |
| Array item | `"/filesChanged/0"` | `"filesChanged/0"` (kept as-is) |
| Missing required | `""` + `params.missingProperty: "action"` | `"action"` |
| Extra field | `""` + `params.additionalProperty: "extra"` | `"extra"` |

#### Stage 6 — Sub-Schema Dispatch

The base schema validates fields common to all agents (from `base.schema.json`). The `responseTypes` sub-schemas validate fields specific to each response type:

```json
// developer.schema.json — responseTypes block
"responseTypes": {
  "success": { "required": ["status"], "properties": { "status": { "const": "completed" } } },
  "failure": { "required": ["status", "error"], "properties": { "status": { "enum": ["blocked", "failed"] }, "error": { "type": "object", "required": ["code", "message"] } } }
}
```

Both sub-schemas are compiled separately with Ajv and cached under `${agentName}_success` / `${agentName}_failure`. Errors from both base validation and sub-schema validation are **aggregated** before returning.

If `responseTypes.success` / `responseTypes.failure` is missing from an agent's schema, sub-schema validation is skipped (backward compatibility).

---

### Return Shapes

```javascript
// STAGE 1 failure — parse error
{
  valid: false, agent: null, version: null,
  errors: [{ field: 'unknown', message: 'Invalid or missing output-contract envelope' }],
  payload: null
}

// STAGE 2 failure — agent mismatch
{
  valid: false, agent: 'developer', version: 1,
  errors: [{ message: 'Agent mismatch: expected reviewer, got developer' }],
  payload: { ... }
}

// STAGE 3 failure — null/array payload
{
  valid: false, agent: 'developer', version: 1,
  errors: [{ message: 'Payload must be a JSON object (null/array rejected)' }],
  payload: null
}

// STAGE 4 — degraded (fast-path or cold-path entry)
{
  valid: true, degraded: true,
  warning: "No schema for agent 'developer', running in degraded mode (fast-path)",
  agent: 'developer', version: 1, errors: [], payload: { ... }
}

// STAGE 5 or 6 — validation errors
{
  valid: false, agent: 'developer', version: 1,
  errors: [
    { field: 'status', message: 'must be enum value' },
    { field: 'error.message', message: 'must be string' }
  ],
  payload: { ... }
}

// Strict success
{
  valid: true, agent: 'developer', version: 1,
  errors: [], payload: { ... }, degraded: false
}
```

---

### Caching Mechanism

Two caches (both Map):

| Cache | Key | Populated | Cleared by |
|-------|-----|-----------|------------|
| `schemaCache` | `agentName` (e.g., `"developer"`) | On first `loadAgentSchema` call | `clearDegraded(agentName)` |
| `validatorCache` | `agentName`, `${agentName}_success`, `${agentName}_failure` | On first sub-schema compile | `clearDegraded(agentName)` |

`clearDegraded` clears all 3 validatorCache entries (base + success + failure variants).

---

### withRetry Loop

```javascript
async function withRetry(agentName, response, {maxRetries: 2, reissue}) {
  while (retryCount <= maxRetries) {
    const result = validateContract(currentResponse, agentName);
    if (result.valid) return { exhausted: false, validationErrors: [], retryCount, maxRetries };
    retryCount++;
    if (retryCount > maxRetries) {
      return { exhausted: true, reissueRequired: !reissue, reissuePossible: !!reissue,
               validationErrors: result.errors, retryCount, maxRetries };
    }
    if (reissue) {
      // Async-safe: await Promise, use directly if sync
      currentResponse = await reissue();
    } else {
      // No reissue → retrying same broken response is pointless
      return { exhausted: true, reissueRequired: true, reissuePossible: false,
               validationErrors: result.errors, retryCount, maxRetries };
    }
  }
}
```

Key behaviors:
- **No reissue**: short-circuits immediately on first failure — no point retrying the same broken string
- **Async reissue**: `await`ed if it returns a Promise; used directly if sync
- **"Always exhaust"**: `withRetry` never returns a `shouldRetry` flag — it always exhausts the budget internally

---

### Ajv Internals

```javascript
// contractValidator.js:26-41 — module initialization
const ajv = new Ajv({ allErrors: true, strict: 'log' });
addFormats(ajv);  // registers uri, date-time, email, uuid, etc.

// base.schema.json pre-registered for $ref resolution
const { $schema: _baseSchemaRef, ...baseSchema } = baseSchemaRaw;
ajv.addSchema(baseSchema, 'base.schema.json');

// responseTypes is a custom branching keyword — not JSON Schema standard
// Ajv strict:'log' would warn without this; registers as no-op
ajv.addKeyword({ keyword: 'responseTypes', validate: () => true, errors: false });
```

| Ajv option | Value | Effect |
|------------|-------|--------|
| `allErrors` | `true` | Collect **all** validation errors in one pass, not just the first |
| `strict` | `'log'` | Warn (don't throw) on unknown keywords or schema issues — required because `responseTypes` is not JSON Schema standard |
| `ajv-formats` | `addFormats(ajv)` | Validates `format: "uri"` and `format: "date-time"` per RFC 3339 / RFC 3986 |
| `$schema` stripping | `{ $schema: _, ...schema }` | Prevents Ajv from resolving the meta-schema URI; uses Ajv's built-in draft-2020-12 validator |

---

**Note:** The validation uses Ajv JSON Schema validator internally. Hand-rolled functions (checkRequiredFields, checkTypes, validateObjectFields, FORMAT_VALIDATORS, validatePayload, validateResponseType, validateSuccessPayload, validateFailurePayload) have been removed. All validation now routes through `validateContract` which uses Ajv with `allErrors: true` and `ajv-formats` for uri/date-time validation.

---

## Schema Files Location

All JSON Schema files are at `docs/opencode/prompts/contracts/`:

```
docs/opencode/prompts/contracts/
├── package.json                  # Local npm manifest (ajv ^8.17.1, ajv-formats ^3.0.1)
├── vitest.config.js              # Vitest config for local test runner
├── base.schema.json              # Shared base fields (agent, timestamp, responseType, version)
├── developer.schema.json         # Developer agent (allOf + base.$ref + properties)
├── spec-manager.schema.json      # Spec-manager agent
├── git-manager.schema.json       # Git-manager agent
├── reviewer.schema.json          # Reviewer agent
├── planner.schema.json           # Planner agent
├── orchestrator.schema.json      # Orchestrator agent
├── project-manager.schema.json   # Project-manager agent
├── researcher.schema.json        # Researcher agent
├── contractValidator.js          # Ajv-powered validation module (339 lines)
└── contractValidator.test.js     # 35 test cases (430 lines)
```

### Schema Composition

Agent schemas use `allOf` to combine `base.schema.json` with agent-specific fields:

```jsonc
// developer.schema.json — structure
{
  "allOf": [
    { "$ref": "base.schema.json" },   // inherits agent, timestamp, responseType, version
    {
      "type": "object",
      "required": ["status", "action", "details"],
      "properties": {
        "status": { "type": "string", "enum": ["completed", "in-progress", "blocked", "failed"] },
        "action": { "type": "string" },
        "filesChanged": { "type": "array", "items": { "type": "string" } },
        "details": { "type": "string" },
        // ...
      }
    }
  ],
  "responseTypes": {       // success/failure sub-schemas for Stage 6 dispatch
    "success": { ... },
    "failure": { ... }
  }
}
```

```jsonc
// base.schema.json — always required on every agent payload
{
  "type": "object",
  "required": ["agent", "timestamp", "responseType", "version"],
  "properties": {
    "agent":      { "type": "string", "enum": ["developer", "spec-manager", ...] },
    "timestamp":  { "type": "string", "format": "date-time" },
    "responseType": { "type": "string", "enum": ["success", "failure"] },
    "version":   { "type": "integer", "const": 1 }
  }
}
```

`$schema` fields are stripped at load time (`contractValidator.js:32, 180`) before registering with Ajv, preventing meta-schema URI resolution issues.

---

## Degraded Mode

When an agent's `*.schema.json` file is missing or fails to load, `validateContract` enters **degraded mode** rather than failing the validation. This is a transitional state for early agent onboarding.

### Lifecycle

| Phase | Trigger | Behavior | Exit |
|-------|---------|----------|------|
| **Entry** | `loadAgentSchema(agentName)` returns `null` (schema file absent) | `validateContract` returns `{valid:true, degraded:true, warning:'No schema for agent X, running in degraded mode', agent, version, errors:[], payload}`. The agent is added to the exported `DEGRADED_AGENTS` set. | n/a |
| **Steady-state** | Subsequent calls for the same agent | Returns the same `degraded:true` shape — fast-path via the `DEGRADED_AGENTS` set membership check (no disk hit). | n/a |
| **Exit** | Deploy the missing schema file, then call `clearDegraded(agentName)` | `clearDegraded` removes the agent from `DEGRADED_AGENTS` AND deletes its entry from the `schemaCache`, forcing a fresh load on the next `validateContract` call. | Switches to full validation. |

### Usage Pattern

```js
import { validateContract, clearDegraded, isDegraded } from './contractValidator.js';

// 1. Validate as usual. Missing schema returns degraded:true but doesn't block.
const verdict = validateContract(rawResponse, 'newagent');
if (verdict.degraded) {
  console.warn(verdict.warning);
  // proceed if degraded is acceptable during onboarding
}

// 2. After deploying newagent.schema.json, recover graceful validation:
clearDegraded('newagent');
const verdict2 = validateContract(rawResponse, 'newagent'); // now strict
```

### Production rule

For both **runtime enforcement** (Phase 7, see `docs/opencode/prompts/orchestrator.md` Runtime Validation Hook) and **test/CI gating**, degraded mode should be treated as FAIL during production runs. Use `isDegraded(agentName)` to detect it before propagating responses:

```js
if (verdict.degraded) {
  throw new Error(`Agent ${agentName} is degraded — schema file missing in production.`);
}
```

The Coverage Gate (see `## Verification Workflow Integration`) checks that every long-lived agent has a schema file, so degraded mode should never persist beyond transient build windows.

---

## Verification Workflow Integration

When running `openspec-verify-change` (Phase 5 of SDD), add this **Contract Validation** step to the Coherence dimension. The three Coverage Gate checks are part of the change `output-contracts-hardening` and must pass before any change can be archived.

1. **Schema Presence Check** (Coverage Gate a): Verify each declared agent has a corresponding `*.schema.json` file at `docs/opencode/prompts/contracts/`.
   - **Expected**: 8 files matching the names in `## Schema Files Location`.
   - **On missing file**: Fail with `Agent X has no schema — deploying would be unsafe (degraded mode would persist)`.

2. **Prompt Section Check** (Coverage Gate b): Verify each agent prompt contains `## OUTPUT CONTRACT` BEFORE the `## REMEMBER` section (which MUST be h2-level, not h1-level).
   - **Expected**: `## OUTPUT CONTRACT` precedes `## REMEMBER` in all 8 agent prompts at `docs/opencode/prompts/<agent>.md`.
   - **On invalid ordering or wrong heading level**: Fail listing every offending file.

3. **Example Parity Check** (Coverage Gate c): Extract the `## OUTPUT CONTRACT` example JSON payload from each agent prompt, run `validateContract(payload, <agentName>)`, assert `{valid:true}` (and `{degraded:false}` after schemas are deployed).
   - **Expected**: All 8 example payloads validate strictly.
   - **On validation failure**: Fail with the exact error and provide a fix suggestion matching the schema.

4. **Test Suite Check**: Verify `contractValidator.test.js` passes via `npm test` from `docs/opencode/prompts/contracts/` (per the local `package.json` defined in `openchange = output-contracts-hardening` Phase 7.2). Coverage ≥90% for `contractValidator.js` is the goal.

**Verification Criteria:**
- All 8 agent schemas exist and are valid JSON Schema
- All 8 agent prompts have `## OUTPUT CONTRACT` immediately before `## REMEMBER` (which is h2-level, not h1-level)
- All 8 example payloads validate `strict` (not degraded)
- Unit tests pass with no regressions
- Coverage ≥90% on `contractValidator.js`

---

## Runtime Enforcement — Architecture

The output contract system uses three enforcement layers:

1. **Prompt Self-Validation (Layer 1 — active)**: Each agent self-validates its envelope before emitting.
   - Triggered by `## SELF-VALIDATION` sections in all 8 agent prompts.
   - Covers 90-95% of cases: the agent catches its own malformed output.
   - No architectural dependency — works today.

2. **Hook Runtime Validation (Layer 2 — active, archived 2026-07-16)**: Programmatic backstop via OpenCode `tool.execute.after` hook. OpenSpec change: `output-contracts-hook-migration` archived at `openspec/changes/archive/2026-07-16-output-contracts-hook-migration/`.
   - Plugin: `.opencode/plugins/output-contracts.ts`
   - Hook: `tool.execute.after` filtered to `task` tool (subagent completions)
   - Audit log: `.opencode/logs/contract-audit.jsonl` (JSONL, one entry per validation failure)
   - Telemetry: In-memory per-agent counters `{ total, failed }` (reset on plugin reload)
   - **Observe-only**: Does NOT mutate `output.output` — see [Architectural Rationale](#why-observe-only-no-outputoutput-rewriting) below.
   - On failure: writes JSONL audit entry, sets `output.metadata.contractValidation`, emits `console.warn`
   - Validator: Lazy-loads `docs/opencode/prompts/contracts/contractValidator.js` with graceful fallback
   - Audit log directory (`.opencode/logs/`) created lazily on first failure (see plugin's `ensureLogDir()`)

3. **Orchestrator Escalation (Layer 3 — coordination-level)**: Orchestrator reads `metadata.contractValidation` from subagent task results.
   - Documented in `docs/opencode/prompts/orchestrator.md` SELF-VALIDATION section.
   - On `contractValidation.valid === false`: orchestrator may re-delegate or escalate.

**Migration path**: Complete.
- **2026-07-08**: `output-contracts-hardening` archived. Layer 1 (self-validation) active in 8 agent prompts.
- **2026-07-15**: `output-contracts-hook-migration` archived (UTC date 2026-07-16). Layer 2 (hook plugin) active. Runtime evidence: 7 audit log entries captured during the same day at `.opencode/logs/contract-audit.jsonl`, proving the hook fires for `task` tool invocations by subagents (`spec-manager`, `reviewer`, `developer`, `researcher`).
- Layer 3 (orchestrator escalation) always available — reads `metadata.contractValidation` from Layer 2 when present.

The original premise blocker (Issue #25918) was invalidated by external research: `tool.execute.after` has always fired for native `task` tool calls in OpenCode v1.18.1+. See archived `proposal.md` Why section for the full invalidation chain.

**Issue #25918 correction**: The original design doc noted Issue #25918 as a blocker for hook-based validation. External research confirmed this was a **false alarm** — `tool.execute.after` has always fired for native `task` tool calls in OpenCode v1.18.1+. The blocker was invalid.

**Verification status (post-archive)**:
- Spec coverage: 17/17 scenarios in `output-contracts-hook-migration/specs/output-contract-validation/spec.md` covered by the plugin code at `.opencode/plugins/output-contracts.ts`. See per-scenario implementation line references in the archived `proposal.md` Why section.
- Main spec updated: `openspec/specs/output-contract-validation/spec.md` now contains 82 total scenarios (65 original + 17 new from Layer 2 plugin delta spec). All original scenarios preserved verbatim, no modifications.
- @reviewer code review verdict: 1 minor SUGGESTION (`fileURLToPath` more idiomatic than `pathname.replace` for Windows path normalization) at `output-contracts.ts:54`. Non-blocking.
- npm test: 35/35 existing contractValidator tests pass (no regression from Layer 2 plugin code).

---

## Layer 2: Hook Runtime Validation

### Plugin Location
`.opencode/plugins/output-contracts.ts`

### Hook Registration
```typescript
"tool.execute.after": async (input, output) => { ... }
```

The hook fires after **every** tool execution. The plugin filters to only process `input.tool === "task"` (subagent completions). Native tool executions (bash, read, write, edit, glob, grep, etc.) are ignored.

### Agent Identification
Agent name extracted from `input.args.subagent_type` (e.g., `"developer"`, `"spec-manager"`, `"orchestrator"`). This works because the `task` tool's Parameters schema requires `subagent_type` — no session-lookup hack needed (OpenCode PR #15412 not required).

### Output Extraction
The `task` tool wraps the subagent's final message in:
```xml
task_id: <session-id>

<task_result>
<output-contract agent="X" version="1">
{... payload ...}
</output-contract>
</task_result>
```

The plugin extracts content between `<task_result>` and `</task_result>` tags via regex. If extraction fails (format change), logs `console.warn` and skips validation (graceful fallback).

### Validation Call
```typescript
const verdict = mod.validateContract(subagentMessage, agentName);
```
Uses `contractValidator.js` `validateContract()` — same function agents call in Layer 1 self-validation.

### Audit Log (JSONL)
**Path**: `.opencode/logs/contract-audit.jsonl` (not committed — `.gitignore` excludes `.opencode/logs/`)

**Schema** (one JSON object per line):
```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "agent": "developer",
  "task": "Implement JWT middleware",
  "sessionId": "sess_abc123",
  "callId": "call_xyz789",
  "validationErrors": [
    { "field": "status", "message": "must be one of: completed, in-progress, blocked, failed" }
  ],
  "retryCount": 0,
  "degraded": false
}
```

- `retryCount` is always `0` — hook doesn't retry; Layer 1 self-validation handles retries.
- `degraded` reflects validator's degraded mode (schema missing).
- Directory created lazily via `fs.mkdirSync(dirname, { recursive: true })` on first write.

### Telemetry Counters (In-Memory)
Per-agent counters reset on plugin reload (OpenCode restart or hot-reload):
```typescript
telemetry[agentName] = { total: number, failed: number };
```
- `total`: all `task` tool invocations for this agent
- `failed`: validation failures
- Persistent record is the JSONL audit log.

### Metadata Annotation (Layer 3 Bridge)
On validation failure, the plugin annotates:
```typescript
output.metadata.contractValidation = {
  valid: false,
  agent: verdict.agent,
  version: verdict.version,
  errors: [...],
  degraded: verdict.degraded
};
```
This enables Layer 3 (orchestrator) to programmatically detect failures and decide whether to re-delegate.

If metadata propagation fails (MCP/native boundary issue), the audit log still captures the failure — falls back to JSONL-only mode.

### Why Observe-Only (No output.output Rewriting)

1. **Validator reports WHAT is wrong, not the CORRECT value** — cannot synthesize valid payload.
2. **`<task_result>` wrapper must be preserved** — parent agent parsing depends on it.
3. **String manipulation of LLM output is fragile** — regex/replace on generated text is error-prone.
4. **Layer 1 handles correction via retry** — self-validation loop: validate → fix → re-validate.
5. **Layer 3 can re-delegate** — orchestrator reads `metadata.contractValidation` and acts.

This is Architectural Verdict 4 from the design evaluation: hooks cannot trigger agent retry because tool execution is already complete when the hook fires.

---

## SELF-VALIDATION Sections Unchanged

The `## SELF-VALIDATION` sections in all 8 agent prompts (`docs/opencode/prompts/*.md`) remain **unchanged**. Layer 1 self-validation continues to handle retry loops; Layer 2 hook provides programmatic backstop + telemetry.

---

## Subagent Silent Exit Audit

### Overview

The Subagent Silent Exit Audit system captures and logs instances where a subagent completes its internal tool calls but produces no output or an output without a valid `<output-contract>` envelope. This is a known failure mode (AI SDK v6 maps finish reason `'other'` to terminal success, causing empty `<task_result>` serialization).

Two log files capture complementary views of this problem:

1. **Layer 2 (Plugin) — `contract-audit.jsonl`**: Marks **candidates** for silent exit detection at the validation layer
2. **Layer 3 (Orchestrator) — `subagent-silent-exit-audit.jsonl`**: Records **recovery outcomes** from the orchestrator's retry protocol

### Layer 2: Plugin Candidate Detection (`silent_exit_candidate`)

**File**: `.opencode/logs/contract-audit.jsonl`

**Trigger**: The `extractTaskResult()` function in `.opencode/plugins/output-contracts.ts` returns `null` (empty `<task_result>` body or missing wrapper).

**Entry Schema**:
```json
{
  "eventType": "silent_exit_candidate",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "agent": "developer",
  "sessionId": "sess_abc123",
  "task": "Implement JWT middleware",
  "retryCount": 0
}
```

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `eventType` | string | Always `"silent_exit_candidate"` |
| `timestamp` | ISO 8601 | When the candidate was detected |
| `agent` | string | Subagent name from `input.args.subagent_type` |
| `sessionId` | string | OpenCode session ID from `input.sessionID` |
| `task` | string | Task title from `output.title` or `"(unknown task)"` |
| `retryCount` | integer | Always `0` — this is detection, not recovery |

**Behavior**: 
- Logged in addition to the existing `console.warn`
- Write failure is non-fatal (caught + `console.error`, session continues)
- **Does not** fire for envelope-less responses (text without `<output-contract>` envelope) — those produce a `"contract-validation"` entry instead

### Layer 3: Orchestrator Recovery (`subagent.silent_exit`)

**File**: `.opencode/logs/subagent-silent-exit-audit.jsonl`

**Trigger**: Orchestrator detects silent exit per the `orchestrator-retry-protocol` spec (Layer-3 Retry Protocol section in `orchestrator.md`).

**Entry Schema**:
```json
{
  "eventType": "subagent.silent_exit",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "session_id": "sess_abc123",
  "delegatedAgent": "developer",
  "retryCount": 1,
  "failureReason": "empty_task_result"
}
```

**Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `eventType` | string | Always `"subagent.silent_exit"` |
| `timestamp` | ISO 8601 | When the silent exit was detected |
| `session_id` | string | OpenCode session ID |
| `delegatedAgent` | string | Target subagent name |
| `retryCount` | integer | Retry attempt number (1, 2, or 3) |
| `failureReason` | enum | `"empty_task_result"` \| `"missing_envelope"` |

**Write Mechanism**: Bash append via `mkdir -p .opencode/logs && echo '<JSON>' >> .opencode/logs/subagent-silent-exit-audit.jsonl`

### Relationship Between Layers

| Aspect | Layer 2 (Plugin) | Layer 3 (Orchestrator) |
|--------|------------------|------------------------|
| **Timing** | Immediately on hook fire (after tool execution) | After parsing `<task_result>` in orchestrator prompt |
| **Ownership** | Validator observes empty extraction | Orchestrator recovers via re-delegation |
| **Log File** | `contract-audit.jsonl` | `subagent-silent-exit-audit.jsonl` |
| **Retry Context** | `retryCount: 0` (detection only) | `retryCount: 1..3` (recovery attempt) |

### Classification Boundary (Important)

**Envelope-less responses** (raw text output without `<output-contract>` XML envelope):
- **Plugin (Layer 2)**: Produces a `"contract-validation"` entry (validation failure on missing envelope) — **NOT** `"silent_exit_candidate"`
- **Orchestrator (Layer 3)**: Treats as silent exit per `orchestrator-retry-protocol` spec — parses `<task_result>`, finds no envelope, classifies as silent exit, triggers retry protocol

This boundary exists because the plugin's `extractTaskResult()` successfully extracts the text content (it's not empty), but the validator rejects it for missing envelope. The orchestrator, however, sees the same empty-envelope condition and treats it as silent exit.

---

## Related OpenSpec Changes

| Change | Status | Description |
|--------|--------|-------------|
| `output-contracts-hardening` | Archived 2026-07-08 | Original 12-stage validator hardening, 47 scenarios in main spec. Established Layer 1 prompt self-validation in 8 agent prompts. Archive path: `openspec/changes/archive/2026-07-08-output-contracts-hardening/` |
| `output-contracts-ajv` | Archived 2026-07-12 | Migration from hand-rolled validation functions to Ajv JSON Schema validator. |
| `output-contracts-hook-migration` | Archived 2026-07-16 (UTC) | Layer 2 hook plugin activation. +7 requirements, +17 scenarios merged into main spec. Archive path: `openspec/changes/archive/2026-07-16-output-contracts-hook-migration/` |

For task-level detail, audit log schema, and per-scenario implementation evidence, see the archived `tasks.md` and `proposal.md` files.

---

## Envelope-Position Fix (2026-07-16)

### Problem
Audit log `.opencode/logs/contract-audit.jsonl` showed persistent "Invalid or missing output-contract envelope" errors across all subagent tasks (developer, spec-manager, reviewer, researcher). The `## OUTPUT CONTRACT` section existed in all 8 prompts, but subagents were not producing the envelope.

### Root Cause
The `## OUTPUT CONTRACT` section sat in the **MIDDLE** of each prompt file:
- `developer.md` line 48 of 137
- `orchestrator.md` line 370 of 475
- `spec-manager.md` line 273 of 374
- Other agents: similar mid-file positions

When context windows filled or models didn't fully process the prompt, the envelope instruction was lost. Subagents produced raw output without the required `<output-contract>` wrapper.

### Fix
Added a **CRITICAL first-line instruction** to the TOP of all 8 agent prompts:

```markdown
> **CRITICAL**: You MUST wrap EVERY response in `<output-contract agent="{agent}" version="1">{...}</output-contract>`. Failure to do so causes validation errors. See full contract spec in the `## OUTPUT CONTRACT` section below.
```

This line survives context truncation because it's at position 1 of the system prompt. The existing `## OUTPUT CONTRACT` section (with the full envelope template, schema reference, and examples) remains in its current mid-file location as the detailed spec.

### Verification
- **Pre-fix audit log**: 16 entries with "Invalid or missing output-contract envelope" (all from 2026-07-15 to 2026-07-16 before the fix)
- **Post-fix audit log**: 0 new error entries
- **Runtime test**: Trivial task delegated to @developer (`read .gitignore`) produced a valid `<output-contract>` envelope — the hook validated it successfully and did NOT log an audit entry

### Files Changed
| File | Change |
|------|--------|
| `docs/opencode/prompts/orchestrator.md` | +2 lines (critical instruction at line 1) |
| `docs/opencode/prompts/developer.md` | +2 lines |
| `docs/opencode/prompts/spec-manager.md` | +2 lines |
| `docs/opencode/prompts/reviewer.md` | +2 lines |
| `docs/opencode/prompts/planner.md` | +2 lines |
| `docs/opencode/prompts/researcher.md` | +2 lines |
| `docs/opencode/prompts/git-manager.md` | +2 lines |
| `docs/opencode/prompts/project-manager.md` | +2 lines |
| `.opencode/plugins/output-contracts.ts` | Hardened: mkdir recursive, retry logic, timestamped warns, load-time dir check |

### Key Takeaway
**Prompt position matters.** Critical instructions must be placed at line 1 of the system prompt to survive context truncation. Instructions in the middle of the prompt get lost when the context window fills. The Layer 2 hook plugin detects missing envelopes but cannot fix them — the fix must be in Layer 1 (prompt instructions) so agents produce valid envelopes in the first place.

---

## JSON-Payload-Parse Fix (2026-07-16)

### Problem
Audit log `.opencode/logs/contract-audit.jsonl` showed "Failed to parse JSON payload" errors from `researcher` (2 occurrences) and `spec-manager` (2 occurrences). The `contractValidator.js` Stage 1 (`parseContractEnvelope`) successfully matched the `<output-contract>` XML envelope, but `JSON.parse()` (line 86) failed on the content between the tags.

### Root Cause
Four agent prompts had **competing output-format sections** that conflicted with the `## OUTPUT CONTRACT` JSON requirement:

| Agent | Conflicting Section | Lines | Format |
|-------|---------------------|-------|--------|
| `researcher.md` | `## OUTPUT FORMAT` | 24-60 | Markdown template (headings, code blocks, bullet lists) |
| `spec-manager.md` | `# REPORTING FORMAT` | 174-204 | Text template with ✅/❌ emoji prefixes |
| `reviewer.md` | `## OUTPUT FORMAT` | 104-143 | Markdown template (APPROVED/NEEDS CHANGES, severity lists) |
| `project-manager.md` | `# REPORTING FORMAT` | 111-141 | Text template with ✅/❌ emoji prefixes |

The model (deepseek-v4-flash-free) tried to obey BOTH the `## OUTPUT CONTRACT` (JSON in XML envelope) AND the competing format section, producing malformed JSON inside the envelope:
- Markdown headings inside JSON values
- Unescaped newlines in strings
- Trailing commas
- JavaScript comments (`//`)
- ```` ```json ```` code block wrappers inside the envelope

### Fix
1. **Converted all 4 competing sections** to "JSON Content Guidance" — they now describe what content goes in which JSON field, not a standalone output template.
2. **Added `**JSON Escaping Rules** block** to all 8 OUTPUT CONTRACT sections. The block explicitly forbids:
   - Trailing commas
   - Single quotes
   - JavaScript comments (`//` or `/* */`)
   - Markdown code block wrappers (```` ```json ````) inside the envelope
   - Unescaped newlines (use `\n`)
   - Unescaped double quotes (use `\"`)

### Verification
- Pre-fix audit log: 4 entries with "Failed to parse JSON payload" (researcher: 2, spec-manager: 2)
- Post-fix audit log: pending runtime test (run a trivial delegation to @researcher and @spec-manager to confirm)
- Developer unaffected by this error class (no competing format section, uses different model)

### Files Changed
| File | Change |
|------|--------|
| `docs/opencode/prompts/researcher.md` | `## OUTPUT FORMAT` → `## OUTPUT FORMAT — JSON Content Guidance` |
| `docs/opencode/prompts/spec-manager.md` | `# REPORTING FORMAT` → `## REPORTING FORMAT — JSON Content Guidance` |
| `docs/opencode/prompts/reviewer.md` | `## OUTPUT FORMAT` → `## OUTPUT FORMAT — JSON Content Guidance` |
| `docs/opencode/prompts/project-manager.md` | `# REPORTING FORMAT` → `## REPORTING FORMAT — JSON Content Guidance` |
| All 8 prompts | Added `**JSON Escaping Rules**` block to `## OUTPUT CONTRACT` section |

### Key Takeaway
**One output format per agent.** Competing format sections (markdown templates, emoji-prefix text templates) confuse the model into producing hybrid output that fails JSON parsing. The `## OUTPUT CONTRACT` section must be the ONLY authority on response format. Content guidance sections should describe what goes IN the JSON fields, not alternative response templates.
