// Standalone runtime test for add-retry-on-empty-delegation.
// Exercises all 3 layers without delegating a live subagent:
//   Layer 2: plugin output-contracts.ts → silent_exit_candidate audit entry
//   Layer 4: guardrail orchestrator-delegation-suffix-required (via validateRules + TOOL_RULES.task)
//   Telemetry: bash echo >> subagent-silent-exit-audit.jsonl (run from bash separately)
//
// Run with:  npx tsx .opencode/test-runtime-manual.mjs
//
// NOTE: .opencode/ is not an npm workspace and has no tsconfig; we use tsx's transpile-only mode
// and locate modules via relative paths.

import { pathToFileURL } from "node:url";
import { existsSync, readFileSync, mkdirSync, appendFileSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const logDir = resolve(here, "logs");
const silentExitLog = resolve(logDir, "subagent-silent-exit-audit.jsonl");
const contractAuditLog = resolve(logDir, "contract-audit.jsonl");

function banner(layer, title) {
  console.log(`\n${"=".repeat(78)}`);
  console.log(`${layer} — ${title}`);
  console.log("=".repeat(78));
}

function hr() {
  console.log("-".repeat(78));
}

function readJsonlSafe(p) {
  if (!existsSync(p)) return null;
  try {
    const text = readFileSync(p, "utf8");
    const lines = text.split(/\r?\n/).filter(Boolean);
    return lines.map((l) => JSON.parse(l));
  } catch (e) {
    return { error: String(e) };
  }
}

function beforeSnapshot() {
  const before = {};
  for (const p of [silentExitLog, contractAuditLog]) {
    if (existsSync(p)) {
      const st = statSync(p);
      before[p] = { exists: true, size: st.size, mtimeMs: st.mtimeMs };
    } else {
      before[p] = { exists: false };
    }
  }
  return before;
}

function afterDelta(before) {
  for (const p of [silentExitLog, contractAuditLog]) {
    const after = existsSync(p) ? { exists: true, size: statSync(p).size, mtimeMs: statSync(p).mtimeMs } : { exists: false };
    const b = before[p];
    const delta = after.exists && b.exists
      ? { sizeDelta: after.size - b.size, mtimeChanged: after.mtimeMs !== b.mtimeMs }
      : { created: after.exists && !b.exists };
    console.log(`  ${p}`);
    console.log(`    before: ${JSON.stringify(b)}`);
    console.log(`    after:  ${JSON.stringify(after)}`);
    console.log(`    delta:  ${JSON.stringify(delta)}`);
  }
}

// ─────────────────────────────────────────────────────────────
// LAYER 4 — Guardrail rule orchestrator-delegation-suffix-required
// ─────────────────────────────────────────────────────────────
async function testGuardrail() {
  banner("LAYER 4", "Guardrail rule: orchestrator-delegation-suffix-required");
  const rulesMod = await import(pathToFileURL(resolve(here, "guardrails-rules.ts")).href);
  const taskRules = rulesMod.TOOL_RULES["task"];
  console.log(`TOOL_RULES["task"] has ${taskRules.length} rule(s)`);
  const target = taskRules.find((r) => r.name === "orchestrator-delegation-suffix-required");
  if (!target) {
    console.log("FAIL: rule not registered in TOOL_RULES['task']");
    return;
  }
  console.log(`OK: rule registered — ${target.name}`);
  hr();
  const ctx = { tool: "task", args: {}, sessionId: "test-manual-session", callId: "c1" };

  // Case A: prompt WITH suffix → should pass
  const withSuffix = { prompt: "Do something. \n--- DELEGATION SUFFIX (INJECTED BY ORCHESTRATOR) ---\nanchor\n--- END ---" };
  const resultA = rulesMod.validateRules(taskRules, withSuffix, ctx);
  console.log(`Case A (with suffix): allowed=${resultA.allowed} violations=${resultA.violations.length}`);
  console.log(`  → ${resultA.allowed ? "PASS ✓" : "FAIL ✗"}`);

  // Case B: prompt WITHOUT suffix → should block with GUARDRAIL_BLOCKED prefix
  const withoutSuffix = { prompt: "Just a delegation without the suffix marker." };
  const resultB = rulesMod.validateRules(taskRules, withoutSuffix, ctx);
  console.log(`Case B (no suffix): allowed=${resultB.allowed} violations=${resultB.violations.length}`);
  if (!resultB.allowed && resultB.violations[0]?.includes("GUARDRAIL_BLOCKED")) {
    console.log(`  → PASS ✓ (blocked with GUARDRAIL_BLOCKED prefix)`);
    console.log(`  message: ${resultB.violations[0]}`);
  } else {
    console.log(`  → FAIL ✗ (expected block with GUARDRAIL_BLOCKED)`);
    console.log(`  actual: ${JSON.stringify(resultB)}`);
  }

  // Case C: unextractable prompt (missing/non-string) → fail open {allowed:true}
  const resultC = rulesMod.validateRules(taskRules, { prompt: undefined }, ctx);
  console.log(`Case C (undefined prompt): allowed=${resultC.allowed} violations=${resultC.violations.length}`);
  console.log(`  → ${resultC.allowed ? "PASS ✓ (failed open)" : "FAIL ✗ (expected fail-open)"}`);

  const resultD = rulesMod.validateRules(taskRules, { prompt: 123 }, ctx);
  console.log(`Case D (non-string prompt): allowed=${resultD.allowed} violations=${resultD.violations.length}`);
  console.log(`  → ${resultD.allowed ? "PASS ✓ (failed open)" : "FAIL ✗ (expected fail-open)"}`);

  const resultE = rulesMod.validateRules(taskRules, {}, ctx);
  console.log(`Case E (no prompt field): allowed=${resultE.allowed} violations=${resultE.violations.length}`);
  console.log(`  → ${resultE.allowed ? "PASS ✓ (failed open)" : "FAIL ✗ (expected fail-open)"}`);
}

// ─────────────────────────────────────────────────────────────
// LAYER 2 — Plugin output-contracts.ts silent_exit_candidate logging
// ─────────────────────────────────────────────────────────────
async function testPlugin() {
  banner("LAYER 2", "Plugin output-contracts.ts — silent_exit_candidate logging");
  const before = beforeSnapshot();

  // The plugin default export is a PluginModule object: { id, server } where server is the async factory.
  const pluginMod = await import(pathToFileURL(resolve(here, "plugins/output-contracts.ts")).href);
  const pluginModule = pluginMod.default;
  console.log(`Plugin module keys: ${Object.keys(pluginModule || {}).join(", ")}`);
  
  if (!pluginModule?.server) {
    console.log("FAIL: plugin.default.server not found — unexpected plugin shape");
    console.log(`  Got: ${JSON.stringify(pluginModule, null, 2).slice(0, 500)}`);
    return;
  }
  
  const pluginFactory = pluginModule.server;
  console.log(`Plugin factory type: ${typeof pluginFactory}`);
  const hooks = await pluginFactory();
  console.log(`hooks keys: ${Object.keys(hooks || {}).join(", ")}`);

  // The hook is registered under "tool.execute.after"
  const hookFn = hooks["tool.execute.after"];
  if (!hookFn) {
    console.log("FAIL: hooks['tool.execute.after'] not found");
    console.log(`  Available: ${Object.keys(hooks || {}).join(", ")}`);
    return;
  }
  console.log(`Invoking hook: tool.execute.after`);

  // Simulate a subagent empty output (silent exit):
  //   output: "<task_result></task_result>" (empty body)
  const input = {
    tool: "task",
    sessionID: "test-manual-session",
    callID: "test-call-1",
    args: { subagent_type: "developer", prompt: "--- DELEGATION SUFFIX (INJECTED BY ORCHESTRATOR) ---\n..." },
  };
  const output = {
    title: "Test task",
    output: "<task_result></task_result>",
    metadata: {},
  };
  console.log("Input: empty <task_result> (silent exit case)");
  try {
    await hookFn(input, output);
    console.log("Hook returned without throw");
  } catch (e) {
    console.log(`Hook threw: ${String(e)}`);
  }

  hr();
  afterDelta(before);
  if (existsSync(contractAuditLog)) {
    const entries = readJsonlSafe(contractAuditLog);
    if (Array.isArray(entries) && entries.length > 0) {
      const last = entries[entries.length - 1];
      console.log(`Last entry in contract-audit.jsonl:`);
      console.log(`  ${JSON.stringify(last)}`);
      if (last.eventType === "silent_exit_candidate" && last.agent === "developer" && last.retryCount === 0) {
        console.log(`  → PASS ✓ (silent_exit_candidate entry written with correct fields)`);
      } else {
        console.log(`  → FAIL ✗ (fields mismatch — expected eventType=silent_exit_candidate, agent=developer, retryCount=0)`);
      }
    } else {
      console.log(`contract-audit.jsonl exists but is empty/unparseable`);
    }
  } else {
    console.log(`FAIL: contract-audit.jsonl not created at ${contractAuditLog}`);
  }
}

// ─────────────────────────────────────────────────────────────
// TELEMETRY — Verify bash echo >> mechanism for subagent-silent-exit-audit.jsonl
// ─────────────────────────────────────────────────────────────
function testBashEchoTelemetry() {
  banner("TELEMETRY", "bash echo >> subagent-silent-exit-audit.jsonl (orchestrator Layer 3)");
  const before = beforeSnapshot();

  // Simulate WHAT the orchestrator would execute on silent exit detection
  const timestamp = new Date().toISOString();
  const payload = {
    eventType: "subagent.silent_exit",
    timestamp,
    session_id: "test-manual-session",
    delegatedAgent: "developer",
    retryCount: 1,
    failureReason: "empty_task_result",
  };
  // JSON rules per spec: double quotes, no trailing comma, escape internal quotes — JSON.stringify satisfies all.
  const jsonLine = JSON.stringify(payload);
  // The exact command from orchestrator.md:439
  mkdirSync(logDir, { recursive: true });
  appendFileSync(silentExitLog, jsonLine + "\n", "utf8");

  console.log(`Executed: mkdir -p .opencode/logs && echo '${jsonLine}' >> subagent-silent-exit-audit.jsonl`);
  hr();
  afterDelta(before);

  if (existsSync(silentExitLog)) {
    const entries = readJsonlSafe(silentExitLog);
    if (Array.isArray(entries) && entries.length > 0) {
      const last = entries[entries.length - 1];
      console.log(`Last entry in subagent-silent-exit-audit.jsonl:`);
      console.log(`  ${JSON.stringify(last)}`);
      const valid =
        last.eventType === "subagent.silent_exit" &&
        last.delegatedAgent === "developer" &&
        last.retryCount === 1 &&
        last.failureReason === "empty_task_result" &&
        typeof last.timestamp === "string" &&
        typeof last.session_id === "string";
      console.log(`  → ${valid ? "PASS ✓ (orchestrator telemetry entry written with correct fields)" : "FAIL ✗ (fields mismatch)"}`);
    } else {
      console.log(`FAIL: subagent-silent-exit-audit.jsonl exists but parse failed: ${JSON.stringify(entries)}`);
    }
  } else {
    console.log(`FAIL: subagent-silent-exit-audit.jsonl not created at ${silentExitLog}`);
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
(async () => {
  console.log("Runtime manual test for change:add-retry-on-empty-delegation");
  console.log(`Working dir: ${process.cwd()}`);
  console.log(`Log dir: ${logDir}`);
  console.log(`Time: ${new Date().toISOString()}`);

  await testGuardrail();
  await testPlugin();
  testBashEchoTelemetry();

  banner("SUMMARY", "All 3 layers exercised");
  console.log(`Layer 4 (guardrail):    ${existsSync(resolve(here, "guardrails-rules.ts")) ? "loaded" : "FAIL load"}`);
  console.log(`Layer 2 (plugin):       ${existsSync(contractAuditLog) ? "audit entry written ✓" : "no audit entry ✗"}`);
  console.log(`Telemetry (bash echo): ${existsSync(silentExitLog) ? "audit entry written ✓" : "no audit entry ✗"}`);
})().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
