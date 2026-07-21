/**
 * Guardrails Rules — Layer 4 of 6-Layer Enforcement Architecture
 *
 * Pure TypeScript module defining the Rule interface, validation logic,
 * and the TOOL_RULES registry with 12 neurosymbolic guardrail rules.
 *
 * This file has NO side effects at import time and does NOT register any hooks.
 * Hook registration is handled by neurosymbolic-guardrails.ts (Phase 2).
 *
 * @module guardrails-rules
 * @version 1.0.0
 */

// ── Types ──────────────────────────────────────────────────────────

/**
 * Result of a single rule validation.
 * @interface ValidationResult
 * @property allowed - Whether the tool call is allowed by this rule
 * @property message - Optional human-readable violation message (only when allowed === false)
 */
export interface ValidationResult {
  allowed: boolean;
  message?: string;
}

/**
 * Context provided to rule validators during evaluation.
 * @interface RuleContext
 * @property tool - Name of the tool being called (e.g., "bash", "write", "edit")
 * @property args - Raw arguments passed to the tool
 * @property sessionId - OpenCode session identifier
 * @property callId - Unique identifier for this tool call
 */
export interface RuleContext {
  tool: string;
  args: unknown;
  sessionId: string;
  callId: string;
}

/**
 * A single guardrail rule definition.
 * @interface Rule
 * @property name - Unique identifier in snake_case (e.g., "no_git_force_push")
 * @property description - Human-readable description of what the rule prevents
 * @property tool - Tool name this rule applies to
 * @property validate - Pure function that evaluates the rule against tool args
 */
export interface Rule {
  name: string;
  description: string;
  tool: string;
  validate: (args: unknown, context: RuleContext) => ValidationResult;
}

// ── Helper Functions ───────────────────────────────────────────────

/**
 * Safely extracts a string value from an unknown object by trying multiple field paths.
 * Returns undefined if no field exists or value is not a string.
 *
 * @param args - Unknown arguments object (may have various shapes per tool)
 * @param fields - Array of field names to try in order (e.g., ["command", "cmd"])
 * @returns The string value if found, undefined otherwise
 */
function getString(args: unknown, fields: string[]): string | undefined {
  if (!args || typeof args !== "object") return undefined;
  const obj = args as Record<string, unknown>;
  for (const field of fields) {
    const value = obj[field];
    if (typeof value === "string") return value;
  }
  return undefined;
}

/**
 * Deep scans an object for all string values and concatenates them.
 * Used for composio tools where git commands may be nested in arbitrary fields.
 *
 * @param obj - Any value to scan (object, array, or primitive)
 * @returns Concatenated string of all string values found, or empty string
 */
function deepScanStringFields(obj: unknown): string {
  const strings: string[] = [];

  function walk(value: unknown): void {
    if (value === null || value === undefined) return;
    if (typeof value === "string") {
      strings.push(value);
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    if (typeof value === "object") {
      for (const key of Object.keys(value as Record<string, unknown>)) {
        walk((value as Record<string, unknown>)[key]);
      }
      return;
    }
  }

  walk(obj);
  return strings.join(" ");
}

/**
 * Checks if a command contains an allowlisted path that should bypass the rule.
 * Handles path normalization and `..` traversal detection.
 *
 * @param command - The bash command string to check
 * @param allowlist - Array of path substrings that are allowed (e.g., ["/tmp/", "node_modules/.cache/"])
 * @returns true if command contains an allowlisted path, false otherwise
 */
function isAllowlistedPath(command: string, allowlist: string[]): boolean {
  // Reject commands with path traversal (`..`) as a safety measure
  if (command.includes("..")) return false;

  const lowerCommand = command.toLowerCase();
  for (const allowed of allowlist) {
    if (lowerCommand.includes(allowed.toLowerCase())) return true;
  }
  return false;
}

// ── Rule Validators ────────────────────────────────────────────────

/**
 * Rule: no_git_force_push
 * Blocks git push with --force or -f flags (including --force-with-lease).
 * Severity: CRITICAL
 */
function validateNoGitForcePush(args: unknown, _context: RuleContext): ValidationResult {
  const command = getString(args, ["command"]);
  if (!command) return { allowed: true };

  // Matches: git push --force, git push -f, git push --force-with-lease
  const regex = /\bgit\b.*\bpush\b.*(--force|-f)/i;
  if (regex.test(command)) {
    return {
      allowed: false,
      message:
        "BLOCKED: git push --force destruye el historial compartido. Usa git push sin --force o coordina con el equipo via PR.",
    };
  }
  return { allowed: true };
}

/**
 * Rule: no_git_rewrite_history
 * Blocks git commands that rewrite history (rebase, reset --hard, commit --amend, filter-branch, reflog delete).
 * Severity: CRITICAL
 */
function validateNoGitRewriteHistory(args: unknown, _context: RuleContext): ValidationResult {
  const command = getString(args, ["command"]);
  if (!command) return { allowed: true };

  // Matches: git rebase, git reset --hard, git commit --amend, git filter-branch, git reflog delete
  const regex = /\bgit\b.*(\brebase\b|\breset\b.*--hard|\bcommit\b.*--amend|\bfilter-branch\b|\breflog\b.*\bdelete\b)/i;
  if (regex.test(command)) {
    return {
      allowed: false,
      message: "BLOCKED: Reescritura de historial de git detectada. Usa git revert para deshacer cambios.",
    };
  }
  return { allowed: true };
}

/**
 * Rule: no_git_no_verify
 * Blocks git commit/push with --no-verify flag.
 * Does NOT match -n short flag (false positive with commit messages like "fix: n/a").
 * Severity: CRITICAL
 */
function validateNoGitNoVerify(args: unknown, _context: RuleContext): ValidationResult {
  const command = getString(args, ["command"]);
  if (!command) return { allowed: true };

  // Matches: git commit --no-verify, git push --no-verify
  // Does NOT match -n (short flag) to avoid false positives
  const regex = /\bgit\b.*\bcommit\b.*--no-verify|\bgit\b.*\bpush\b.*--no-verify/i;
  if (regex.test(command)) {
    return {
      allowed: false,
      message:
        "BLOCKED: --no-verify salta los hooks de pre-commit (lint, format, Semgrep, Gitleaks). Los hooks son obligatorios.",
    };
  }
  return { allowed: true };
}

/**
 * Rule: no_prisma_db_push_force_reset
 * Blocks destructive Prisma database operations.
 * Severity: HIGH
 */
function validateNoPrismaDbPushForceReset(args: unknown, _context: RuleContext): ValidationResult {
  const command = getString(args, ["command"]);
  if (!command) return { allowed: true };

  // Matches: prisma db push --force-reset, prisma migrate reset, prisma db push --accept-data-loss
  const regex =
    /\bprisma\b.*\bdb\b.*\bpush\b.*--force-reset|\bprisma\b.*\bmigrate\b.*\breset\b|\bprisma\b.*\bdb\b.*\bpush\b.*--accept-data-loss/i;
  if (regex.test(command)) {
    return {
      allowed: false,
      message:
        "BLOCKED: Operación destructiva de base de datos. Usa 'prisma migrate dev' para desarrollo o 'prisma migrate deploy' para producción.",
    };
  }
  return { allowed: true };
}

/**
 * Rule: no_destructive_rm
 * Blocks rm -rf/-fr on critical project paths (.git, node_modules, dist, build, prisma/).
 * Allowlist: /tmp/, node_modules/.cache/
 * Rejects commands with `..` path traversal.
 * Severity: HIGH
 */
function validateNoDestructiveRm(args: unknown, _context: RuleContext): ValidationResult {
  const command = getString(args, ["command"]);
  if (!command) return { allowed: true };

  // Allowlist check first — if path is allowlisted, permit regardless of regex
  const allowlist = ["/tmp/", "node_modules/.cache/"];
  if (isAllowlistedPath(command, allowlist)) {
    return { allowed: true };
  }

  // Matches: rm -rf .git, rm -fr node_modules, rm -rf dist, rm -fr build, rm -rf prisma/
  const regex = /\brm\b.*(-rf|-fr).*(\.git|node_modules|dist|build|prisma\/)/i;
  if (regex.test(command)) {
    return {
      allowed: false,
      message:
        "BLOCKED: rm -rf destruye rutas críticas del proyecto (.git, node_modules, dist, build, prisma/). Usa eliminación selectiva de archivos.",
    };
  }
  return { allowed: true };
}

/**
 * Rule: no_delete_env
 * Blocks rm/del/rmdir commands targeting .env files.
 * Severity: CRITICAL
 */
function validateNoDeleteEnv(args: unknown, _context: RuleContext): ValidationResult {
  const command = getString(args, ["command"]);
  if (!command) return { allowed: true };

  // Matches: rm .env, rm .env.production, del .env.local, rmdir .env
  const regex = /\brm\b.*\.env|\bdel\b.*\.env|\brmdir\b.*\.env/i;
  if (regex.test(command)) {
    return {
      allowed: false,
      message: "BLOCKED: Archivos .env contienen credenciales. No eliminar.",
    };
  }
  return { allowed: true };
}

/**
 * Rule: no_dev_bash_nonstandard
 * Blocks non-standard execution patterns in bash (python -c, perl -e, ruby -e, npm exec, npx -y, curl ... | sh, wget -O -).
 * Allowlist exclusions for common project commands.
 * Severity: HIGH
 */
function validateNoDevBashNonstandard(args: unknown, _context: RuleContext): ValidationResult {
  const command = getString(args, ["command"]);
  if (!command) return { allowed: true };

  // Allowlist — if command contains any of these, ALLOW
  const allowlist = [
    "node_modules/.bin/",
    "scripts/",
    "npx jest",
    "npx vitest",
    "npm run",
    "npx prisma",
    "git",
    "npx playwright",
    "npx turbo",
    "npx storybook",
    "npx nx",
    "npx tsx",
    "npx eslint",
    "npx prettier",
  ];

  const lowerCommand = command.toLowerCase();
  for (const allowed of allowlist) {
    if (lowerCommand.includes(allowed.toLowerCase())) {
      return { allowed: true };
    }
  }

  // Matches: python -c, perl -e, ruby -e, npm exec, npx -y, wget -O -, curl ... sh
  const regex =
    /\bpython\b.*-c|\bperl\b.*-e|\bruby\b.*-e|\bnpm\b.*\bexec\b|\bnpx\b.*-y|\bwget\b.*-O\s+-\s*|\bcurl\b.*\bsh\b/i;
  if (regex.test(command)) {
    return {
      allowed: false,
      message:
        "BLOCKED: Ejecución no convencional detectada. Usa scripts npm estándar o comandos del proyecto.",
    };
  }
  return { allowed: true };
}

/**
 * Rule: no_direct_trello
 * Blocks direct HTTP calls to Trello/Slack APIs via curl/wget.
 * Severity: CRITICAL
 */
function validateNoDirectTrello(args: unknown, _context: RuleContext): ValidationResult {
  const command = getString(args, ["command"]);
  if (!command) return { allowed: true };

  // Matches: api.trello.com, api.slack.com, trello.com/1/
  const regex = /api\.trello\.com|api\.slack\.com|trello\.com.*\/1\//i;
  if (regex.test(command)) {
    return {
      allowed: false,
      message: "BLOCKED: Ningún agente llama Trello/Slack directamente. Debe delegar a @project-manager.",
    };
  }
  return { allowed: true };
}

/**
 * Rule: no_write_env_files
 * Blocks write tool targeting .env files (except .env.example).
 * Severity: HIGH
 */
function validateNoWriteEnvFiles(args: unknown, _context: RuleContext): ValidationResult {
  const filePath = getString(args, ["filePath"]);
  if (!filePath) return { allowed: true };

  // Match .env, .env.*, .ENV, .Env etc. but exclude .env.example
  const isEnvFile = /\.env(\.|$)/i.test(filePath);
  const isExample = /\.env\.example$/i.test(filePath);

  if (isEnvFile && !isExample) {
    return {
      allowed: false,
      message: "BLOCKED: No modificar .env directamente. Las variables se configuran via .env.example.",
    };
  }
  return { allowed: true };
}

/**
 * Rule: no_planner_write_specs
 * Blocks write tool targeting paths containing openspec/ or specs/.
 * Severity: HIGH
 */
function validateNoPlannerWriteSpecs(args: unknown, _context: RuleContext): ValidationResult {
  const filePath = getString(args, ["filePath"]);
  if (!filePath) return { allowed: true };

  // Case-insensitive match for /openspec/ or /specs/ in path
  if (/\/openspec\//i.test(filePath) || /\/specs\//i.test(filePath)) {
    return {
      allowed: false,
      message: "BLOCKED: Los archivos de specs se crean via OpenSpec CLI (/opsx-new, /opsx-propose). No escribir manualmente.",
    };
  }
  return { allowed: true };
}

/**
 * Rule: no_edit_gitignore_security
 * Blocks edit tool removing security patterns from .gitignore.
 * Checks if oldString contains sensitive patterns and newString removes them.
 * Severity: MEDIUM
 */
function validateNoEditGitignoreSecurity(args: unknown, _context: RuleContext): ValidationResult {
  const filePath = getString(args, ["filePath"]);
  const oldString = getString(args, ["oldString"]);
  const newString = getString(args, ["newString"]);

  if (!filePath || !oldString || newString === undefined) return { allowed: true };

  // Only apply to .gitignore files
  if (!filePath.endsWith(".gitignore")) return { allowed: true };

  // Patterns that should never be removed from .gitignore
  const securityPatterns = [/\.env/, /\.log/, /credentials/, /\.opencode\/logs\//];
  const matchedPatterns: string[] = [];

  for (const pattern of securityPatterns) {
    // If oldString contains the pattern but newString does not, it's being removed
    if (pattern.test(oldString) && !pattern.test(newString)) {
      // Extract the matched substring for the error message
      const match = oldString.match(pattern);
      if (match) matchedPatterns.push(match[0]);
    }
  }

  if (matchedPatterns.length > 0) {
    return {
      allowed: false,
      message: `BLOCKED: No eliminar '${matchedPatterns.join("', '")}' de .gitignore. Expone información sensible.`,
    };
  }
  return { allowed: true };
}

/**
 * Rule: no_composio_git_ops
 * Blocks Composio tools from executing git operations.
 * Deep scans all string fields in args for git command patterns.
 * Severity: CRITICAL
 */
function validateNoComposioGitOps(args: unknown, _context: RuleContext): ValidationResult {
  // Deep scan all string values in the args object
  const allStrings = deepScanStringFields(args);

  // Matches: git push, git pull, git commit, git reset, git rebase, git merge, git branch, git clone, git fetch, git stash
  const regex = /\bgit\b.*\b(push|pull|commit|reset|rebase|merge|branch|clone|fetch|stash)\b/i;
  if (regex.test(allStrings)) {
    return {
      allowed: false,
      message:
        "BLOCKED: Operaciones git vía Composio prohibidas. Git se maneja exclusivamente via git-manager con comandos git nativos.",
    };
  }
  return { allowed: true };
}

// ── Pure Validation Function ──────────────────────────────────────

/**
 * Evaluates an array of rules against tool arguments.
 * Pure function — no side effects, deterministic.
 *
 * @param rules - Array of Rule objects to evaluate
 * @param args - Tool arguments to validate
 * @param context - RuleContext with tool, sessionId, callId
 * @returns ValidationResult with allowed boolean and violations array
 */
export function validateRules(
  rules: Rule[],
  args: unknown,
  context: RuleContext,
): { allowed: boolean; violations: string[] } {
  const violations: string[] = [];

  for (const rule of rules) {
    try {
      const result = rule.validate(args, context);
      if (!result.allowed && result.message) {
        violations.push(result.message);
      }
    } catch {
      // Fail-open at rule level: if a rule throws unexpectedly, skip it
      // This prevents a buggy rule from blocking all tool execution
      // Logged in the hook layer for observability
    }
  }

  if (violations.length === 0) {
    return { allowed: true, violations: [] };
  }
  return { allowed: false, violations };
}

// ── TOOL_RULES Registry ───────────────────────────────────────────

/**
 * Registry mapping tool names to their applicable guardrail rules.
 * Keys are OpenCode tool names; values are arrays of Rule objects.
 * Unknown tools return undefined from this registry (no validation occurs).
 *
 * @constant
 * @type {Record<string, Rule[]>}
 */
// ── Shared Bash Rules ───────────────────────────────────────────
// Architecture note (discovered 2026-07-18):
//   `tool.execute.before` fires for ALL tool types at the orchestrator/framework level.
//   However, when a subagent runs `bash`, the bash command is encapsulated inside
//   a `task` tool call — the hook sees `tool="task"` with `output.args.command=...`.
//   Direct `bash` tool calls (orchestrator level) also fire the hook.
//   Therefore bash rules register on BOTH `bash` (direct use) AND `task` (subagent path).
//
// Write/edit rules (no_write_env_files, no_planner_write_specs, no_edit_gitignore_security)
// remain on `write`/`edit` only — they check `filePath`/`oldString`/`newString` fields not
// present in task args. Future enhancement: add command-pattern checks for bash-equivalent
// operations (echo >, sed -i, etc.).
const BASH_RULES: Rule[] = [
  {
    name: "no_git_force_push",
    description: "Blocks git push with --force or -f flags including --force-with-lease",
    tool: "bash",
    validate: validateNoGitForcePush,
  },
  {
    name: "no_git_rewrite_history",
    description: "Blocks git history rewriting commands (rebase, reset --hard, commit --amend, filter-branch, reflog delete)",
    tool: "bash",
    validate: validateNoGitRewriteHistory,
  },
  {
    name: "no_git_no_verify",
    description: "Blocks git commit/push with --no-verify flag (does not match -n short flag)",
    tool: "bash",
    validate: validateNoGitNoVerify,
  },
  {
    name: "no_prisma_db_push_force_reset",
    description: "Blocks destructive Prisma database operations (db push --force-reset, migrate reset, --accept-data-loss)",
    tool: "bash",
    validate: validateNoPrismaDbPushForceReset,
  },
  {
    name: "no_destructive_rm",
    description: "Blocks rm -rf/-fr on critical paths (.git, node_modules, dist, build, prisma/) with allowlist for /tmp/ and node_modules/.cache/",
    tool: "bash",
    validate: validateNoDestructiveRm,
  },
  {
    name: "no_delete_env",
    description: "Blocks rm/del/rmdir commands targeting .env files",
    tool: "bash",
    validate: validateNoDeleteEnv,
  },
  {
    name: "no_dev_bash_nonstandard",
    description: "Blocks non-standard execution patterns (python -c, perl -e, npm exec, curl | sh, etc.) with project command allowlist",
    tool: "bash",
    validate: validateNoDevBashNonstandard,
  },
  {
    name: "no_direct_trello",
    description: "Blocks direct HTTP calls to Trello/Slack APIs",
    tool: "bash",
    validate: validateNoDirectTrello,
  },
];

export const TOOL_RULES: Record<string, Rule[]> = {
  // bash rules fire on `task` tool (actual execution path) AND `bash` (future-proof)
  task: BASH_RULES,
  bash: BASH_RULES,
  write: [
    {
      name: "no_write_env_files",
      description: "Blocks writing to .env files (allows .env.example)",
      tool: "write",
      validate: validateNoWriteEnvFiles,
    },
    {
      name: "no_planner_write_specs",
      description: "Blocks writing to openspec/ or specs/ directories",
      tool: "write",
      validate: validateNoPlannerWriteSpecs,
    },
  ],
  edit: [
    {
      name: "no_edit_gitignore_security",
      description: "Blocks removing security patterns (.env, *.log, credentials, .opencode/logs/) from .gitignore",
      tool: "edit",
      validate: validateNoEditGitignoreSecurity,
    },
  ],
  // Pattern for all Composio MCP tools (composio_COMPOSIO_*)
  // The hook will match this key via prefix matching
  composio_COMPOSIO_: [
    {
      name: "no_composio_git_ops",
      description: "Blocks Composio tools from executing git operations (push, pull, commit, reset, rebase, merge, branch, clone, fetch, stash)",
      tool: "composio_COMPOSIO_*",
      validate: validateNoComposioGitOps,
    },
  ],
};

// ── GuardrailBlockedError ─────────────────────────────────────────

/**
 * Error thrown when a guardrail rule blocks a tool execution.
 * Extends Error and includes the violations array in the message.
 *
 * @class GuardrailBlockedError
 * @extends Error
 */
export class GuardrailBlockedError extends Error {
  public readonly violations: string[];

  /**
   * Creates a GuardrailBlockedError.
   * @param violations - Array of violation messages from failed rules
   */
  constructor(violations: string[]) {
    const message = `GUARDRAIL_BLOCKED: ${violations.join("; ")}`;
    super(message);
    this.name = "GuardrailBlockedError";
    this.violations = violations;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, GuardrailBlockedError.prototype);
  }
}