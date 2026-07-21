import { describe, it, expect, beforeAll } from 'vitest';

describe('Integration: guardrails pipeline', () => {
  let mod;

  beforeAll(async () => {
    mod = await import('./guardrails-rules.ts');
  });

  it('TOOL_RULES has all expected tool keys', () => {
    const { TOOL_RULES } = mod;
    expect(TOOL_RULES.bash).toBeDefined();
    expect(TOOL_RULES.task).toBeDefined();
    expect(TOOL_RULES.write).toBeDefined();
    expect(TOOL_RULES.edit).toBeDefined();
    expect(TOOL_RULES.composio_COMPOSIO_).toBeDefined();
  });

  it('no_git_force_push blocks git push --force', () => {
    const { validateRules, TOOL_RULES } = mod;
    const ctx = { tool: 'bash', args: { command: 'git push --force' }, sessionId: 's', callId: 'c' };
    const r = validateRules(TOOL_RULES.bash, { command: 'git push --force' }, ctx);
    expect(r.allowed).toBe(false);
    expect(r.violations[0]).toMatch(/BLOCKED/);
  });

  it('no_git_force_push allows normal git push', () => {
    const { validateRules, TOOL_RULES } = mod;
    const ctx = { tool: 'bash', args: { command: 'git push origin main' }, sessionId: 's', callId: 'c' };
    const r = validateRules(TOOL_RULES.bash, { command: 'git push origin main' }, ctx);
    expect(r.allowed).toBe(true);
  });

  it('no_git_rewrite_history blocks git rebase', () => {
    const { validateRules, TOOL_RULES } = mod;
    const ctx = { tool: 'bash', args: { command: 'git rebase main' }, sessionId: 's', callId: 'c' };
    const r = validateRules(TOOL_RULES.bash, { command: 'git rebase main' }, ctx);
    expect(r.allowed).toBe(false);
  });

  it('no_prisma_db_push_force_reset blocks prisma db push --force-reset', () => {
    const { validateRules, TOOL_RULES } = mod;
    const ctx = { tool: 'bash', args: { command: 'npx prisma db push --force-reset' }, sessionId: 's', callId: 'c' };
    const r = validateRules(TOOL_RULES.bash, { command: 'npx prisma db push --force-reset' }, ctx);
    expect(r.allowed).toBe(false);
  });

  it('no_write_env_files blocks .env write', () => {
    const { validateRules, TOOL_RULES } = mod;
    const ctx = { tool: 'write', args: { filePath: '.env' }, sessionId: 's', callId: 'c' };
    const r = validateRules(TOOL_RULES.write, { filePath: '.env' }, ctx);
    expect(r.allowed).toBe(false);
  });

  it('no_write_env_files allows .env.example write', () => {
    const { validateRules, TOOL_RULES } = mod;
    const ctx = { tool: 'write', args: { filePath: '.env.example' }, sessionId: 's', callId: 'c' };
    const r = validateRules(TOOL_RULES.write, { filePath: '.env.example' }, ctx);
    expect(r.allowed).toBe(true);
  });

  it('GuardrailBlockedError is throwable with GUARDRAIL_BLOCKED: prefix', () => {
    const { GuardrailBlockedError } = mod;
    const err = new GuardrailBlockedError(['test rule failure']);
    expect(err.message).toBe('GUARDRAIL_BLOCKED: test rule failure');
    expect(err).toBeInstanceOf(Error);
  });
});
