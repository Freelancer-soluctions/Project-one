// .opencode/plugins/output-contracts.ts
//
// Output Contract Runtime Validation — Layer 2 of 3-Layer Enforcement Architecture
//
// Layer 1: Prompt Self-Validation (retry-capable, agent-voluntary)
//   → 8 agent prompts, active since Phase 8 of output-contracts-hardening
//
// Layer 2: THIS Plugin (programmatic backstop, always fires)
//   → tool.execute.after for "task" tool
//   → Observes, logs to JSONL, annotates output.metadata — does NOT rewrite output.output
//
// Layer 3: Orchestrator Escalation (coordination-level enforcement)
//   → orchestrator.md SELF-VALIDATION section, reads metadata from Layer 2
//
// ## Why observe-only (no output.output rewriting)
//
// Architectural Verdict 4 of the design evaluation proves that hooks cannot trigger
// agent retry. Tool execution is already complete when this hook fires.
// Self-validation (Layer 1) provides the retry loop: validate → fix → re-validate.
// This plugin catches what Layer 1 misses and provides per-agent telemetry.
//
// output.output is NOT mutated because:
// 1. The validator reports WHAT is wrong but not the CORRECT value
// 2. The <task_result> wrapper must be preserved for parent-agent parsing
// 3. String manipulation of LLM-generated output is fragile
// 4. Layer 1 self-validation handles correction via retry
// 5. Layer 3 orchestrator can re-delegate on metadata.contractValidation signal

import type { Plugin } from '@opencode-ai/plugin';
import { Plugin as PluginV2 } from '@opencode/plugin';
import * as fs from 'node:fs';
import * as path from 'node:path';

// ── Lazy Path Resolution ─────────────────────────────────────────
// Resolved lazily inside plugin factory to avoid import-time crash
// in bun's bundled context (import.meta.url resolves to chunk URL).
interface ResolvedPaths {
  logFilePath: string;
  validatorEntry: string;
}
let resolvedPaths: ResolvedPaths | null = null;

function resolvePaths(): ResolvedPaths | null {
  if (resolvedPaths) return resolvedPaths;
  try {
    const logDir = new URL('../logs/', import.meta.url);
    const logFileUrl = new URL('contract-audit.jsonl', logDir).href;
    const logFilePath = path.resolve(
      new URL(logFileUrl).pathname.replace(/^\//, '')
    );
    const vDir = new URL(
      '../../docs/opencode/prompts/contracts/',
      import.meta.url
    );
    const validatorEntry = new URL('contractValidator.js', vDir).href;
    resolvedPaths = { logFilePath, validatorEntry };
    return resolvedPaths;
  } catch (err) {
    console.warn(
      '[output-contracts] WARN: import.meta.url resolution failed — running without paths'
    );
    return null;
  }
}

// ── Retry Configuration ──────────────────────────────────────────
const MAX_WRITE_RETRIES = 2;
const RETRY_DELAY_MS = 50;

// ── Telemetry Counters (in-memory, reset on plugin reload) ──────
// Keyed by agent name (e.g., "developer", "spec-manager", "orchestrator").
// Reset when OpenCode restarts or plugins are hot-reloaded.
// Persistent record is the JSONL audit log (not reset).
interface AgentTelemetry {
  total: number; // Total task tool invocations for this agent
  failed: number; // Failed contract validations for this agent
}
const telemetry: Record<string, AgentTelemetry> = {};

// ── Logging Helpers ──────────────────────────────────────────────
let logDirChecked = false;

/**
 * Checks if the log directory exists and is writable.
 * Called once on plugin load to warn early about permission issues.
 */
function checkLogDirOnLoad(): void {
  const paths = resolvePaths();
  if (!paths) return;
  try {
    const logDirPath = path.dirname(paths.logFilePath);
    if (!fs.existsSync(logDirPath)) {
      fs.mkdirSync(logDirPath, { recursive: true });
    }
    // Test write access
    fs.accessSync(logDirPath, fs.constants.W_OK);
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] [output-contracts] Audit log directory ready: ${logDirPath}`
    );
  } catch (err) {
    const timestamp = new Date().toISOString();
    console.warn(
      `[${timestamp}] [output-contracts] WARN: Audit log directory not writable: ${err}`
    );
  }
}

/**
 * Ensures the log directory exists before writing.
 * Called lazily inside writeAuditEntry to avoid creating empty dirs on sessions
 * that never fail validation. Uses recursive mkdir so it works even if intermediate
 * .opencode/ dir doesn't exist yet.
 */
function ensureLogDir(): boolean {
  const paths = resolvePaths();
  if (!paths) return false;
  try {
    const logDirPath = path.dirname(paths.logFilePath);
    if (!fs.existsSync(logDirPath)) {
      fs.mkdirSync(logDirPath, { recursive: true });
    }
    return true;
  } catch (err) {
    // Fail silently — writeAuditEntry will catch the subsequent write error
    console.error('[output-contracts] ensureLogDir failed:', err);
    return false;
  }
}

/**
 * Appends a JSONL entry to the audit log file.
 * Catches and logs any I/O errors via console.error — never crashes the session.
 * Includes a simple retry for transient write failures.
 */
function writeAuditEntry(entry: object): void {
  const paths = resolvePaths();
  if (!paths) return;
  let attempt = 0;
  while (attempt <= MAX_WRITE_RETRIES) {
    try {
      ensureLogDir();
      fs.appendFileSync(
        paths.logFilePath,
        JSON.stringify(entry) + '\n',
        'utf-8'
      );
      return; // Success
    } catch (err) {
      attempt++;
      if (attempt > MAX_WRITE_RETRIES) {
        // Final failure after retries
        console.error(
          '[output-contracts] Failed to write audit log after retries:',
          err
        );
        return;
      }
      // Brief delay before retry
      try {
        const start = Date.now();
        while (Date.now() - start < RETRY_DELAY_MS) {
          // busy-wait for short delay (avoids async in sync context)
        }
      } catch {
        // Ignore delay errors
      }
    }
  }
}

/**
 * Increments telemetry counters for an agent.
 */
function recordTelemetry(agentName: string, success: boolean): void {
  if (!telemetry[agentName]) {
    telemetry[agentName] = { total: 0, failed: 0 };
  }
  telemetry[agentName].total++;
  if (!success) {
    telemetry[agentName].failed++;
  }
}

// ── Output Parser ────────────────────────────────────────────────
// The "task" tool wraps the subagent's final message in:
//
//   task_id: <session-id> (for resuming)
//
//   <task_result>
//   <output-contract agent="X" version="1">
//   {... payload ...}
//   </output-contract>
//   </task_result>
//
// This function extracts the text between <task_result> and </task_result> tags.
// Returns null if the wrapper format is unexpected (which signals upstream format change).
// Per Spec Scenario "Task_result format change causes graceful fallback", null-return
// causes the hook to log a console.warn and skip validation.
function extractTaskResult(rawOutput: string): string | null {
  const match = rawOutput.match(/<task_result>([\s\S]*)<\/task_result>/);
  if (!match || !match[1]) return null;
  const content = match[1].trim();
  if (content.length === 0) return null;
  return content;
}

// ── Shared Hook Logic (V1 server() + V2 setup()) ─────────────────
// Single implementation of the tool.execute.after contract-validation guard,
// shared by the V1 server() entrypoint and the V2 setup() entrypoint below.
// Preserved behavior 1:1: filter non-"task" tools → agent via
// input.args.subagent_type → extractTaskResult → lazy validator (graceful
// no-op fallback valid:true degraded:true) → telemetry → audit JSONL write +
// output.metadata.contractValidation annotation + console.warn on failure.
// Observe-only: output.output is NEVER mutated.
interface ContractVerdict {
  valid: boolean;
  agent: string | null;
  version: number | null;
  errors: Array<{ field?: string; message?: string }>;
  payload: unknown;
  degraded?: boolean;
  warning?: string;
}
interface ValidatorModule {
  validateContract: (response: string, agentName: string) => ContractVerdict;
}
let validatorModule: ValidatorModule | null = null;

// Lazy-load the validator module on first hook invocation.
// This avoids startup delay and potential import errors at plugin registration time.
// Wrapped in try/catch with graceful fallback to no-op validator (returns valid:true degraded:true)
// per Spec Scenario "Validator import failure is non-fatal".
async function loadValidator(): Promise<ValidatorModule | null> {
  if (!validatorModule) {
    const paths = resolvePaths();
    if (!paths) {
      // Graceful fallback: no-op validator
      validatorModule = {
        validateContract: () => ({
          valid: true,
          degraded: true,
          warning: 'Paths not available — import.meta.url resolution failed',
          agent: null,
          version: null,
          errors: [],
          payload: null,
        }),
      };
      return validatorModule;
    }
    try {
      const mod = await import(paths.validatorEntry);
      validatorModule = mod;
    } catch (err) {
      console.error(
        `[output-contracts] FATAL: Failed to load contractValidator.js:`,
        err
      );
      validatorModule = {
        validateContract: () => ({
          valid: true,
          degraded: true,
          warning:
            'Validator module failed to load — check .opencode/package.json dependencies',
          agent: null,
          version: null,
          errors: [],
          payload: null,
        }),
      };
    }
  }
  return validatorModule;
}

/**
 * Shared tool.execute.after handler using V1 (input, output) shapes:
 *   input:  { tool: string, sessionID: string, callID: string, args: any }
 *   output: { title: string, output: string, metadata: any }
 * (per @opencode-ai/plugin v1.3.17 Hooks interface).
 * The V1 entrypoint passes its hook args straight through; the V2 setup()
 * entrypoint adapts the V2 execute.after event into these shapes.
 *
 * For the "task" tool:
 *   - input.args.subagent_type → agent name (e.g., "developer", "spec-manager")
 *   - output.output → subagent's final message wrapped in <task_result>...</task_result>
 *   - output.metadata → { sessionId: childSessionId, model: ... }
 *
 * Per Design Decision 4: agent identification via input.args.subagent_type
 * (no session-lookup hack required).
 */
async function handleToolExecuteAfter(
  input: { tool: string; sessionID: string; callID: string; args: any },
  output: { title?: string; output?: string; metadata?: any }
): Promise<void> {
  // ── Filter: Only subagent completions ─────────────────
  // Per Spec Scenario "Hook ignores non-task tools".
  if (input.tool !== 'task') return;

  // ── Extract agent name ───────────────────────────────
  const agentName = input.args?.subagent_type as string | undefined;
  if (!agentName) {
    // Should never happen — task tool requires subagent_type in its Parameters schema.
    // Per defensive design: log a warning and skip validation.
    const timestamp = new Date().toISOString();
    console.warn(
      `[${timestamp}] [output-contracts] WARN: 'task' tool invoked without subagent_type in args — skipping validation`
    );
    return;
  }

  // ── Extract the output contract from <task_result> wrapper ───
  const rawOutput = (output as { output?: string }).output ?? '';
  const subagentMessage = extractTaskResult(rawOutput);
  if (!subagentMessage) {
    // The <task_result> wrapper was not found or was empty. Per Spec Scenario
    // "Task_result format change causes graceful fallback": log warning + skip.
    // Additionally, log as silent_exit_candidate for observability.
    const timestamp = new Date().toISOString();
    console.warn(
      `[${timestamp}] [output-contracts] WARN: Could not extract <task_result> from task tool output for @${agentName} | ` +
        `This may indicate an OpenCode format change | Validation skipped — session continues`
    );

    // Task 4.1: Log silent_exit_candidate for observability (empty/unparseable <task_result>)
    try {
      const silentExitEntry = {
        eventType: 'silent_exit_candidate',
        timestamp,
        agent: agentName,
        sessionId: input.sessionID,
        task: (output as { title?: string }).title ?? '(unknown task)',
        retryCount: 0,
      };
      writeAuditEntry(silentExitEntry);
    } catch (auditErr) {
      // Non-fatal: audit write failure should not crash the session
      console.error(
        '[output-contracts] Failed to write silent_exit_candidate audit entry:',
        auditErr
      );
    }

    return;
  }

  // ── Load validator (lazy, cached after first call) ───
  const mod = await loadValidator();

  // loadValidator() always returns a validator (real or fallback), never null
  // but TypeScript needs assurance — assert non-null
  if (!mod) return;

  // ── Run validation ───────────────────────────────────
  const verdict = mod.validateContract(subagentMessage, agentName);

  // ── Record telemetry (always — both success and failure) ──
  recordTelemetry(agentName, verdict.valid);

  // ── Handle validation result ─────────────────────────
  if (verdict.valid) {
    // Per Spec Scenario "Valid contract": no audit log, no metadata annotation.
    // Telemetry `total++` already incremented; `failed` NOT incremented.
    // Skip writing to audit log on success — keep file focused on failures.
    return;
  }

  // ── VALIDATION FAILED ────────────────────────────────
  // The subagent produced a malformed output contract that Layer 1 (self-validation) missed.
  // Per Spec Scenario "Audit log entry written" + "Metadata set on failure":
  // 1. Write JSONL audit log entry
  // 2. Set output.metadata.contractValidation for Layer 3
  // 3. Emit console.warn summary

  // 1. ── Audit Log (per Spec Scenario "Audit log entry written") ───
  const auditEntry = {
    timestamp: new Date().toISOString(),
    agent: agentName,
    task: (output as { title?: string }).title ?? '(unknown task)',
    sessionId: input.sessionID,
    callId: input.callID,
    validationErrors: (verdict.errors ?? []).map((e) => ({
      field: e.field ?? 'unknown',
      message: e.message ?? 'Unknown validation error',
    })),
    retryCount: 0, // No retry from hook — Layer 1 handles retries
    degraded: verdict.degraded ?? false,
  };
  writeAuditEntry(auditEntry);

  // 2. ── Metadata Annotation (per Spec Scenario "Metadata set on failure") ───
  // Enables Layer 3 (orchestrator.md) to programmatically read the failure signal
  // and decide whether to re-delegate. Issue #3574 confirms metadata propagation works
  // for native tools (task is native, not MCP). If propagation breaks in practice,
  // the audit log is still written — falls back to JSONL-only mode per the Spec
  // Scenario "Metadata propagation fallback mode".
  const outputAny = output as { metadata?: any };
  if (!outputAny.metadata) {
    outputAny.metadata = {};
  }
  outputAny.metadata.contractValidation = {
    valid: false,
    agent: verdict.agent,
    version: verdict.version,
    errors: (verdict.errors ?? []).map((e) => ({
      field: e.field ?? 'unknown',
      message: e.message ?? 'Unknown validation error',
    })),
    degraded: verdict.degraded ?? false,
  };

  // 3. ── Console warning (per Spec Scenario "Audit log entry written") ───
  const timestamp = new Date().toISOString();
  console.warn(
    `[${timestamp}] [output-contracts] FAILED: @${agentName} returned malformed output contract | ` +
      `errors: ${verdict.errors?.length ?? 0} | ` +
      `task: "${(output as { title?: string }).title ?? '(unknown)'}" | ` +
      `audit: .opencode/logs/contract-audit.jsonl`
  );

  // NOTE (per Spec Scenario "Output Non-Mutation"):
  // We deliberately do NOT mutate output.output. Observe-only layer.
  // Comment block at top of this file documents the rationale (4 reasons).
  // The audit log entry and metadata annotation are the ONLY side effects.
}

// ── V1 Entrypoint (OpenCode V1: server() → hooks map) ────────────
// Uses a named export `plugin` (Plugin type) — this matches the default OpenCode
// plugin loading convention that also accepts `export default plugin`.

export const plugin: Plugin = async () => {
  // Runtime check: verify log directory is writable on plugin load
  checkLogDirOnLoad();

  return {
    'tool.execute.after': async (input, output) => {
      await handleToolExecuteAfter(
        input as { tool: string; sessionID: string; callID: string; args: any },
        output as { title?: string; output?: string; metadata?: any }
      );
    },
  };
};

// ── V2 Entrypoint (OpenCode V2: id + setup()) ─────────────────────
// V2 registers hooks per-domain in setup(). The execute.after event is a
// single object: { tool, sessionID, agent, messageID, id, input, status,
// result?, error? } where result = { output?, content?, metadata? }.
// V1 names map as: callID ← event.id, args ← event.input,
// title ← event.input.description (V2 has no title field),
// rawOutput ← result.output (string) ?? result.content (string/text parts).
// Error-status events carry no result — they flow through with empty output,
// mirroring the V1 `?? ""` fallback (extractTaskResult → null → warn + skip).
// Metadata annotation mutates event.result.metadata in place via a
// getter/setter facade so the write propagates back to the V2 event.

async function setup(ctx: PluginV2.Context): Promise<void> {
  checkLogDirOnLoad();

  await ctx.tool.hook('execute.after', async (event) => {
    if (event.tool !== 'task') return;
    const args = event.input as {
      subagent_type?: string;
      description?: string;
    };
    const title =
      (typeof args?.description === 'string' && args.description) ||
      '(unknown task)';
    let rawOutput = '';
    let outputFacade: { title?: string; output?: string; metadata?: any };
    if (
      event.status === 'completed' &&
      event.result &&
      typeof event.result === 'object'
    ) {
      const result = event.result as {
        output?: unknown;
        content?: unknown;
        metadata?: any;
      };
      if (typeof result.output === 'string') {
        rawOutput = result.output;
      } else if (typeof result.content === 'string') {
        rawOutput = result.content;
      } else if (Array.isArray(result.content)) {
        rawOutput = result.content
          .map((c) =>
            typeof c === 'string' ? c : ((c as { text?: unknown }).text ?? '')
          )
          .filter((t) => typeof t === 'string')
          .join('\n');
      } else if (typeof result.output !== 'undefined') {
        rawOutput = String(result.output);
      }
      const resultAny = result as any;
      if (!resultAny.metadata) resultAny.metadata = {};
      outputFacade = {
        title,
        output: rawOutput,
        get metadata() {
          return resultAny.metadata;
        },
        set metadata(v: any) {
          resultAny.metadata = v;
        },
      };
    } else {
      outputFacade = { title, output: rawOutput, metadata: {} };
    }
    await handleToolExecuteAfter(
      { tool: event.tool, sessionID: event.sessionID, callID: event.id, args },
      outputFacade
    );
  });
}

// Dual shape: V2 reads id + setup() (ignores server); V1 reads server().
// PluginV2.define() is identity at runtime — the loader schema only checks
// that id + setup (or effect) keys are present on the default export.
export default {
  ...PluginV2.define({
    id: 'local.output-contracts',
    setup,
  }),
  server: plugin,
};
