/**
 * Neurosymbolic Guardrails — Layer 4 of 6-Layer Enforcement Architecture
 *
 * Implements `tool.execute.before` hook to intercept tool calls BEFORE execution.
 * Evaluates tool arguments against static neurosymbolic rules (guardrails-rules.ts).
 * Blocks violations by throwing GuardrailBlockedError — prevents execution entirely.
 *
 * Architecture (6 Layers):
 *   Layer 1: Prompt Self-Validation (agent-level, prompt instructions)
 *   Layer 2: Hook Runtime Validation (output-contracts.ts, tool.execute.after)
 *   Layer 3: Orchestrator Escalation (reads metadata.contractValidation)
 *   Layer 4: Neurosymbolic Guardrails (THIS PLUGIN, tool.execute.before) ← PRE-EXECUTION
 *   Layer 5: OpenCode Permissions (opencode.jsonc, tool-level allow/deny/ask)
 *   Layer 6: OS/Container Sandbox (hardware-enforced boundaries)
 *
 * This plugin is additive: coexists with output-contracts.ts (Layer 2), no shared state.
 *
 * @module neurosymbolic-guardrails
 * @version 1.0.0
 */

import type { Plugin } from "@opencode-ai/plugin";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  validateRules,
  TOOL_RULES,
  GuardrailBlockedError,
  type RuleContext,
} from "./guardrails-rules.ts";

// ── Audit Log Configuration ──────────────────────────────────────
// Log file: .opencode/logs/guardrails-audit.jsonl
// Format: JSON Lines (one JSON object per line)
// Fields: timestamp, eventType, tool, sessionId, callId, violations, args
const LOG_DIR = new URL("../logs/", import.meta.url);
const LOG_FILE_URL = new URL("guardrails-audit.jsonl", LOG_DIR).href;
const LOG_FILE_PATH = path.resolve(new URL(LOG_FILE_URL).pathname.replace(/^\//, ""));

// ── Telemetry Counters (in-memory, reset on plugin reload) ───────
interface ToolTelemetry {
  total: number;   // Total tool calls evaluated
  blocked: number; // Blocked tool calls
}
const toolTelemetry: Record<string, ToolTelemetry> = {};

// ── Logging Helpers ──────────────────────────────────────────────
let logDirChecked = false;

/**
 * Checks if the log directory exists and is writable.
 * Called once on plugin load to warn early about permission issues.
 */
function checkLogDirOnLoad(): void {
  try {
    const logDirPath = path.dirname(LOG_FILE_PATH);
    if (!fs.existsSync(logDirPath)) {
      fs.mkdirSync(logDirPath, { recursive: true });
    }
    fs.accessSync(logDirPath, fs.constants.W_OK);
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [neurosymbolic-guardrails] Audit log directory ready: ${logDirPath}`);
  } catch (err) {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [neurosymbolic-guardrails] WARN: Audit log directory not writable: ${err}`);
  }
}

/**
 * Ensures the log directory exists before writing.
 * Called lazily inside writeAuditEntry to avoid creating empty dirs.
 */
function ensureLogDir(): void {
  try {
    const logDirPath = path.dirname(LOG_FILE_PATH);
    if (!fs.existsSync(logDirPath)) {
      fs.mkdirSync(logDirPath, { recursive: true });
    }
  } catch (err) {
    // Fail silently — writeAuditEntry will catch the subsequent write error
    console.error("[neurosymbolic-guardrails] ensureLogDir failed:", err);
  }
}

/**
 * Appends a JSONL entry to the guardrails audit log file.
 * Catches and logs any I/O errors via console.error — never crashes the session.
 */
function writeAuditEntry(entry: object): void {
  try {
    ensureLogDir();
    fs.appendFileSync(LOG_FILE_PATH, JSON.stringify(entry) + "\n", "utf-8");
  } catch (err) {
    console.error("[neurosymbolic-guardrails] Failed to write audit log:", err);
  }
}

/**
 * Increments telemetry counters for a tool.
 */
function recordTelemetry(toolName: string, blocked: boolean): void {
  if (!toolTelemetry[toolName]) {
    toolTelemetry[toolName] = { total: 0, blocked: 0 };
  }
  toolTelemetry[toolName].total++;
  if (blocked) {
    toolTelemetry[toolName].blocked++;
  }
}

// ── Context Builder ──────────────────────────────────────────────

/**
 * Builds a RuleContext from the tool execution input.
 * Handles different tool argument shapes and unknown tools gracefully.
 *
 * @param input - The hook input from OpenCode (tool, args, sessionID, callID)
 * @returns RuleContext with extracted fields, or null if parsing fails
 */
function buildContext(input: {
  tool: string;
  args: unknown;
  sessionID: string;
  callID: string;
}): RuleContext | null {
  try {
    const { tool, args, sessionID, callID } = input;

    // Validate required fields
    if (!tool || typeof tool !== "string") {
      console.warn("[neurosymbolic-guardrails] WARN: Missing or invalid tool name in hook input");
      return null;
    }
    if (!sessionID || typeof sessionID !== "string") {
      console.warn("[neurosymbolic-guardrails] WARN: Missing or invalid sessionID in hook input");
      return null;
    }
    if (!callID || typeof callID !== "string") {
      console.warn("[neurosymbolic-guardrails] WARN: Missing or invalid callID in hook input");
      return null;
    }

    return {
      tool,
      args,
      sessionId: sessionID,
      callId: callID,
    };
  } catch (err) {
    // Fail-safe: on any parse error, return null to allow execution
    console.error("[neurosymbolic-guardrails] ERROR building context:", err);
    return null;
  }
}

// ── Rule Lookup ──────────────────────────────────────────────────

/**
 * Looks up applicable rules for a tool from TOOL_RULES registry.
 * Supports exact match and prefix match for composio_COMPOSIO_* tools.
 *
 * @param tool - Tool name from the hook input
 * @returns Array of rules for this tool, or empty array if none
 */
function getRulesForTool(tool: string): typeof TOOL_RULES[string] {
  // Exact match first
  if (TOOL_RULES[tool]) {
    return TOOL_RULES[tool];
  }

  // Prefix match for composio_COMPOSIO_* tools
  for (const key of Object.keys(TOOL_RULES)) {
    if (key.endsWith("_") && tool.startsWith(key)) {
      return TOOL_RULES[key];
    }
  }

  return [];
}

// ── Sanitization for Audit Log ───────────────────────────────────

/**
 * Redacts sensitive fields from args before writing to audit log.
 * Protects passwords, API keys, tokens, secrets, and auth headers.
 *
 * @param args - Raw tool arguments
 * @returns Sanitized copy safe for logging
 */
function sanitizeArgs(args: unknown): unknown {
  if (!args || typeof args !== "object") return args;

  const sensitiveKeys = new Set([
    "password",
    "apiKey",
    "api_key",
    "token",
    "secret",
    "authorization",
    "cookie",
    "x-api-key",
    "x-auth-token",
    "access_token",
    "refresh_token",
    "client_secret",
    "private_key",
    "passphrase",
  ]);

  if (Array.isArray(args)) {
    return args.map(sanitizeArgs);
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(args as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.has(lowerKey)) {
      sanitized[key] = "[REDACTED]";
    } else if (value && typeof value === "object") {
      sanitized[key] = sanitizeArgs(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

// ── Plugin Export ────────────────────────────────────────────────
// Uses named export `plugin` (Plugin type) — matches OpenCode plugin loading convention.
// Also adds default export for maximum compatibility.
export const plugin: Plugin = async () => {
  // Runtime check: verify log directory is writable on plugin load
  checkLogDirOnLoad();

  return {
    // ── Hook: tool.execute.before ──────────────────────────────
    // Fires BEFORE every tool execution. We intercept and can cancel
    // by throwing an Error. OpenCode catches the error and aborts the tool call.
    // Can also modify output.args to transform arguments before execution.
    //
    // Shape (per @opencode-ai/plugin hooks interface):
    //   input:  { tool: string, sessionID: string, callID: string }
    //   output: { args: any }
    //
    // For "before" hooks, args are in output.args (mutable for transformation).
    // We read output.args for validation and can modify it if needed.
    //
    // Winner-takes-all: This is the ONLY plugin registering tool.execute.before.
    // If another plugin registers this hook, they execute in registration order
    // (per hooks.md §4.3). This design is safe because:
    // 1. output-contracts.ts uses tool.execute.after (no conflict)
    // 2. This plugin is the sole consumer of tool.execute.before
    "tool.execute.before": async (
      input: { tool: string; sessionID: string; callID: string },
      output: { args: unknown },
    ) => {
      const { tool, sessionID, callID } = input;
      const args = output.args;

      // ── Build context ──
      const context = buildContext({ tool, args, sessionID, callID });
      if (!context) {
        // Context build failed (parse error, missing fields) — fail-open, allow execution
        return;
      }

      // ── Look up rules for this tool ──
      const rules = getRulesForTool(tool);
      if (rules.length === 0) {
        // No rules for this tool — allow execution
        return;
      }

      // ── Validate rules ──
      try {
        const result = validateRules(rules, args, context);

        if (result.allowed) {
          // All rules passed — record telemetry and allow
          recordTelemetry(tool, false);
          return;
        }

        // ── RULES BLOCKED EXECUTION ──
        // Throw GuardrailBlockedError to cancel tool execution.
        // OpenCode catches this and presents the error to the agent.
        recordTelemetry(tool, true);

        // Write audit log entry for blocked call
        const auditEntry = {
          timestamp: new Date().toISOString(),
          eventType: "guardrail_blocked",
          tool,
          sessionId: sessionID,
          callId: callID,
          violations: result.violations,
          args: sanitizeArgs(args),
        };
        writeAuditEntry(auditEntry);

        // Log to console for immediate visibility
        console.warn(
          `[${auditEntry.timestamp}] [neurosymbolic-guardrails] BLOCKED: ${tool} | ` +
          `session=${sessionID} call=${callID} | violations: ${result.violations.length}`,
        );

        throw new GuardrailBlockedError(result.violations);
      } catch (err) {
        // ── Error Handling (Decision 4: fail-open for unexpected errors) ──
        // GuardrailBlockedError is intentional — re-throw to block execution
        if (err instanceof GuardrailBlockedError) {
          throw err;
        }

        // Unexpected error (TypeError, ReferenceError, etc.) — LOG AND ALLOW
        // A bug in guardrails should NOT block the developer's work.
        // This follows the fail-open principle from Strands and Decision 4.
        console.error("[neurosymbolic-guardrails] ERROR in hook (fail-open):", err);
        recordTelemetry(tool, false);
        return;
      }
    },
  };
};

// Default export for plugin loaders that prefer `export default`
export default plugin;