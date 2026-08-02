import { describe, it, expect, beforeAll } from 'vitest';
import {
  validateRules,
  GuardrailBlockedError,
} from './guardrails-rules.ts';

// ─── Task 6.1: validateRules unit tests ──────────────────────────────

describe('validateRules()', () => {
  const dummyContext = {
    tool: 'bash',
    args: {},
    sessionId: 'test-session',
    callId: 'test-call',
  };

  const alwaysPass = {
    name: 'always_pass',
    description: 'Always allows',
    tool: 'bash',
    validate: () => ({ allowed: true }),
  };

  const alwaysFail = {
    name: 'always_fail',
    description: 'Always blocks',
    tool: 'bash',
    validate: () => ({ allowed: false, message: 'Blocked by test rule' }),
  };

  it('returns allowed=true with empty violations when all rules pass', () => {
    const result = validateRules([alwaysPass, alwaysPass], {}, dummyContext);
    expect(result.allowed).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('returns allowed=false with one violation when one rule fails', () => {
    const result = validateRules([alwaysPass, alwaysFail], {}, dummyContext);
    expect(result.allowed).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0]).toBe('Blocked by test rule');
  });

  it('returns allowed=false with all violations when multiple rules fail', () => {
    const fail2 = { ...alwaysFail, validate: () => ({ allowed: false, message: 'Second failure' }) };
    const result = validateRules([alwaysFail, fail2], {}, dummyContext);
    expect(result.allowed).toBe(false);
    expect(result.violations).toHaveLength(2);
    expect(result.violations).toContain('Blocked by test rule');
    expect(result.violations).toContain('Second failure');
  });

  it('returns allowed=true when rules array is empty', () => {
    const result = validateRules([], {}, dummyContext);
    expect(result.allowed).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('is deterministic — same rules + args always return same result', () => {
    const result1 = validateRules([alwaysFail], {}, dummyContext);
    const result2 = validateRules([alwaysFail], {}, dummyContext);
    expect(result1).toEqual(result2);
  });

  it('skips rules that throw unexpectedly (fail-open at rule level)', () => {
    const throwingRule = {
      name: 'throws',
      description: 'Throws unexpectedly',
      tool: 'bash',
      validate: () => { throw new Error('Unexpected!'); },
    };
    const result = validateRules([throwingRule, alwaysPass], {}, dummyContext);
    // The throwing rule is skipped, the passing rule should still pass
    expect(result.allowed).toBe(true);
    expect(result.violations).toEqual([]);
  });
});

describe('GuardrailBlockedError', () => {
  it('creates error with GUARDRAIL_BLOCKED: prefix', () => {
    const err = new GuardrailBlockedError(['Rule 1 failed', 'Rule 2 failed']);
    expect(err.message).toMatch(/^GUARDRAIL_BLOCKED:/);
    expect(err.message).toContain('Rule 1 failed');
    expect(err.message).toContain('Rule 2 failed');
  });

  it('is instance of Error and GuardrailBlockedError', () => {
    const err = new GuardrailBlockedError(['test']);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(GuardrailBlockedError);
  });

  it('stores violations array', () => {
    const violations = ['Violation 1', 'Violation 2'];
    const err = new GuardrailBlockedError(violations);
    expect(err.violations).toEqual(violations);
  });
});

// ─── Task 6.2: buildContext tests ────────────────────────────────────
// buildContext() is exported from neurosymbolic-guardrails.ts for testing.

describe('buildContext()', () => {
  let buildContext;

  beforeAll(async () => {
    const mod = await import('./plugins/neurosymbolic-guardrails.ts');
    buildContext = mod.buildContext;
  });

  it('returns full context for recognized tool with valid input', () => {
    const input = {
      tool: 'bash',
      args: { command: 'git push' },
      sessionID: 'ses_test123',
      callID: 'call_test456',
    };
    const ctx = buildContext(input);
    expect(ctx).not.toBeNull();
    expect(ctx.tool).toBe('bash');
    expect(ctx.args).toEqual({ command: 'git push' });
    expect(ctx.sessionId).toBe('ses_test123');
    expect(ctx.callId).toBe('call_test456');
  });

  it('returns full context for unrecognized tool (returns same shape)', () => {
    const input = {
      tool: 'unknown_tool_42',
      args: { foo: 'bar' },
      sessionID: 'ses_abc',
      callID: 'call_def',
    };
    const ctx = buildContext(input);
    expect(ctx).not.toBeNull();
    expect(ctx.tool).toBe('unknown_tool_42');
    expect(ctx.args).toEqual({ foo: 'bar' });
    expect(ctx.sessionId).toBe('ses_abc');
    expect(ctx.callId).toBe('call_def');
  });

  it('returns null on parse error (missing tool name)', () => {
    const input = {
      tool: '',
      args: {},
      sessionID: 'ses_test',
      callID: 'call_test',
    };
    const ctx = buildContext(input);
    expect(ctx).toBeNull();
  });

  it('returns null on missing sessionID', () => {
    const input = {
      tool: 'bash',
      args: {},
      sessionID: '',
      callID: 'call_test',
    };
    const ctx = buildContext(input);
    expect(ctx).toBeNull();
  });

  it('returns null on missing callID', () => {
    const input = {
      tool: 'bash',
      args: {},
      sessionID: 'ses_test',
      callID: '',
    };
    const ctx = buildContext(input);
    expect(ctx).toBeNull();
  });
});

// ─── orchestrator-delegation-suffix-required tests ─────────────────────

describe('orchestrator-delegation-suffix-required', () => {
  const dummyContext = {
    tool: 'task',
    args: {},
    sessionId: 'test-session',
    callId: 'test-call',
  };

  it('suffix present in prompt → passes (allowed=true)', async () => {
    const mod = await import('./guardrails-rules.ts');
    const result = mod.validateRules(mod.TOOL_RULES.task, {
      prompt: `Delegation message here
--- DELEGATION SUFFIX (INJECTED BY ORCHESTRATOR) ---
Your final assistant message MUST contain...`,
    }, dummyContext);
    expect(result.allowed).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('suffix missing from prompt → blocks with GUARDRAIL_BLOCKED prefix', async () => {
    const mod = await import('./guardrails-rules.ts');
    const result = mod.validateRules(mod.TOOL_RULES.task, {
      prompt: 'Delegation message without suffix',
    }, dummyContext);
    expect(result.allowed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0]).toMatch(/^GUARDRAIL_BLOCKED:/);
  });

  it('retry hint present in violation message', async () => {
    const mod = await import('./guardrails-rules.ts');
    const result = mod.validateRules(mod.TOOL_RULES.task, {
      prompt: 'Delegation message without suffix',
    }, dummyContext);
    expect(result.allowed).toBe(false);
    expect(result.violations[0]).toContain('Retry hint');
    expect(result.violations[0]).toContain('DELEGATION SUFFIX');
  });

  it('unextractable prompt (missing prompt field) → fails open with allowed=true, NO GUARDRAIL_BLOCKED', async () => {
    const mod = await import('./guardrails-rules.ts');
    const result = mod.validateRules(mod.TOOL_RULES.task, {
      otherField: 'value',
    }, dummyContext);
    expect(result.allowed).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('unextractable prompt (non-string prompt) → fails open with allowed=true, NO GUARDRAIL_BLOCKED', async () => {
    const mod = await import('./guardrails-rules.ts');
    const result = mod.validateRules(mod.TOOL_RULES.task, {
      prompt: 123,
    }, dummyContext);
    expect(result.allowed).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it('unextractable prompt (null prompt) → fails open with allowed=true, NO GUARDRAIL_BLOCKED', async () => {
    const mod = await import('./guardrails-rules.ts');
    const result = mod.validateRules(mod.TOOL_RULES.task, {
      prompt: null,
    }, dummyContext);
    expect(result.allowed).toBe(true);
    expect(result.violations).toEqual([]);
  });
});
