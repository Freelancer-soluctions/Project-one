import type { Plugin } from "@opencode-ai/plugin";
import * as fs from "node:fs";
import * as path from "node:path";
import {
  validateRules,
  TOOL_RULES,
  GuardrailBlockedError,
  type RuleContext,
} from "../guardrails-rules";

// ── Telemetry Counters (in-memory, reset on plugin reload) ───────
interface ToolTelemetry {
  total: number;
  blocked: number;
}
const toolTelemetry: Record<string, ToolTelemetry> = {};

// ── Logging Helpers ──────────────────────────────────────────────

/**
 * Resolves the audit log file path from the plugin's module URL.
 * Uses try/catch to handle environments where import.meta.url may not
 * resolve correctly (e.g., older OpenCode versions on Windows).
 */
function resolveLogFilePath(): string | null {
  try {
    const logDir = new URL("../logs/", import.meta.url);
    const logFileUrl = new URL("guardrails-audit.jsonl", logDir).href;
    return path.resolve(new URL(logFileUrl).pathname.replace(/^\//, ""));
  } catch {
    return null;
  }
}

/**
 * Ensures the log directory exists before writing.
 */
function ensureLogDir(logFilePath: string | null): void {
  if (!logFilePath) return;
  try {
    const logDirPath = path.dirname(logFilePath);
    if (!fs.existsSync(logDirPath)) {
      fs.mkdirSync(logDirPath, { recursive: true });
    }
  } catch {
    // Fail silently
  }
}

/**
 * Appends a JSONL entry to the guardrails audit log file.
 * Catches and logs any I/O errors via console.error — never crashes the session.
 */
function writeAuditEntry(entry: object, logFilePath: string | null): void {
  if (!logFilePath) return;
  try {
    ensureLogDir(logFilePath);
    fs.appendFileSync(logFilePath, JSON.stringify(entry) + "\n", "utf-8");
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
 */
export function buildContext(input: {
  tool: string;
  args: unknown;
  sessionID: string;
  callID: string;
}): RuleContext | null {
  try {
    const { tool, args, sessionID, callID } = input;
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
    return { tool, args, sessionId: sessionID, callId: callID };
  } catch (err) {
    console.error("[neurosymbolic-guardrails] ERROR building context:", err);
    return null;
  }
}

// ── Rule Lookup ──────────────────────────────────────────────────

/**
 * Looks up applicable rules for a tool from TOOL_RULES registry.
 * Supports exact match and prefix match for composio_COMPOSIO_* tools.
 */
function getRulesForTool(tool: string): typeof TOOL_RULES[string] {
  if (TOOL_RULES[tool]) return TOOL_RULES[tool];
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
 */
export function sanitizeArgs(args: unknown): unknown {
  if (!args || typeof args !== "object") return args;
  const sensitiveKeys = new Set([
    "password", "apiKey", "api_key", "token", "secret",
    "authorization", "cookie", "x-api-key", "x-auth-token",
    "access_token", "refresh_token", "client_secret", "private_key", "passphrase",
  ]);
  if (Array.isArray(args)) return args.map(sanitizeArgs);
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

const plugin: Plugin = async () => {
  // Resolve log file path lazily at runtime (not at module load time)
  // to avoid issues with import.meta.url in older OpenCode versions.
  const logFilePath = resolveLogFilePath();
  if (logFilePath) {
    ensureLogDir(logFilePath);
    const ts = new Date().toISOString();
    console.log(`[${ts}] [neurosymbolic-guardrails] Audit log ready: ${path.dirname(logFilePath)}`);
  } else {
    console.warn("[neurosymbolic-guardrails] Audit log unavailable (import.meta.url resolution failed) — running without audit");
  }

  return {
    "tool.execute.before": async (
      input: { tool: string; sessionID: string; callID: string },
      output: { args: unknown },
    ) => {
      const { tool, sessionID, callID } = input;
      const args = output.args;

      // Build context
      const context = buildContext({ tool, args, sessionID, callID });
      if (!context) return;

      // Look up rules
      const rules = getRulesForTool(tool);
      if (rules.length === 0) return;

      // Validate rules
      try {
        const result = validateRules(rules, args, context);

        if (result.allowed) {
          recordTelemetry(tool, false);
          return;
        }

        // Rules blocked execution — ALWAYS block; audit is best-effort
        recordTelemetry(tool, true);
        const error = new GuardrailBlockedError(result.violations);

        // Best-effort audit logging (never blocks the throw)
        try {
          const auditEntry = {
            timestamp: new Date().toISOString(),
            eventType: "guardrail_blocked",
            tool,
            sessionId: sessionID,
            callId: callID,
            violations: result.violations,
            args: sanitizeArgs(args),
          };
          writeAuditEntry(auditEntry, logFilePath);
          console.warn(
            `[${auditEntry.timestamp}] [neurosymbolic-guardrails] BLOCKED: ${tool} | ` +
            `session=${sessionID} call=${callID} | violations: ${result.violations.length}`,
          );
        } catch {
          console.error("[neurosymbolic-guardrails] Audit write failed — blocking still enforced");
        }

        throw error;
      } catch (err) {
        if (err instanceof GuardrailBlockedError) throw err;
        console.error("[neurosymbolic-guardrails] ERROR in hook (fail-open):", err);
        recordTelemetry(tool, false);
      }
    },
  };
};

export default {
  id: "local.neurosymbolic-guardrails",
  server: plugin,
};
