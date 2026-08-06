import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Mock fs module
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  accessSync: vi.fn(),
  appendFileSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

// Mock import.meta.url for path resolution
const mockImportMetaUrl = 'file:///test/.opencode/plugins/output-contracts.ts';

// We need to test the internal functions, so we'll import the module and test via the plugin hook
// Since the functions are not exported, we'll test the plugin's behavior by invoking the hook

describe('output-contracts plugin - silent_exit_candidate logging', () => {
  let plugin: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;
  let consoleLogSpy: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Setup fs mocks
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.mkdirSync).mockImplementation(() => undefined);
    vi.mocked(fs.accessSync).mockImplementation(() => {});
    vi.mocked(fs.appendFileSync).mockImplementation(() => {});

    // Spy on console methods
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // Import the plugin module
    const mod = await import('./output-contracts.ts');
    plugin = mod.plugin;
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  // Helper to invoke the plugin's tool.execute.after hook
  async function invokeHook(input: any, output: any) {
    const pluginInstance = await plugin();
    if (pluginInstance['tool.execute.after']) {
      await pluginInstance['tool.execute.after'](input, output);
    }
  }

  describe('silent_exit_candidate logging', () => {
    it('Test 1: empty <task_result> writes silent_exit_candidate entry to audit log', async () => {
      const input = {
        tool: 'task',
        sessionID: 'sess_test123',
        callID: 'call_test456',
        args: { subagent_type: 'developer' },
      };
      const output = {
        title: 'Implement JWT middleware',
        output: '<task_result></task_result>',
        metadata: {},
      };

      await invokeHook(input, output);

      // Assert console.warn was called (existing behavior)
      expect(consoleWarnSpy).toHaveBeenCalled();
      const warnCall = consoleWarnSpy.mock.calls.find((c: any[]) => 
        c[0].includes('Could not extract <task_result>')
      );
      expect(warnCall).toBeDefined();

      // Assert silent_exit_candidate entry was written
      expect(fs.appendFileSync).toHaveBeenCalled();
      const writeCall = vi.mocked(fs.appendFileSync).mock.calls.find((c: any[]) => 
        typeof c[1] === 'string' && c[1].includes('silent_exit_candidate')
      );
      expect(writeCall).toBeDefined();

      // Parse the written entry and verify fields
      const writtenJson = JSON.parse((writeCall![1] as string).trim());
      expect(writtenJson.eventType).toBe('silent_exit_candidate');
      expect(writtenJson.agent).toBe('developer');
      expect(writtenJson.sessionId).toBe('sess_test123');
      expect(writtenJson.task).toBe('Implement JWT middleware');
      expect(writtenJson.retryCount).toBe(0);
      expect(writtenJson.timestamp).toBeDefined();
    });

    it('Test 2: missing <task_result> wrapper writes silent_exit_candidate entry', async () => {
      const input = {
        tool: 'task',
        sessionID: 'sess_abc789',
        callID: 'call_def012',
        args: { subagent_type: 'spec-manager' },
      };
      const output = {
        title: 'Create proposal',
        output: 'Just plain text without task_result wrapper',
        metadata: {},
      };

      await invokeHook(input, output);

      // Assert silent_exit_candidate entry was written
      expect(fs.appendFileSync).toHaveBeenCalled();
      const writeCall = vi.mocked(fs.appendFileSync).mock.calls.find((c: any[]) => 
        typeof c[1] === 'string' && c[1].includes('silent_exit_candidate')
      );
      expect(writeCall).toBeDefined();

      const writtenJson = JSON.parse((writeCall![1] as string).trim());
      expect(writtenJson.eventType).toBe('silent_exit_candidate');
      expect(writtenJson.agent).toBe('spec-manager');
      expect(writtenJson.sessionId).toBe('sess_abc789');
      expect(writtenJson.task).toBe('Create proposal');
      expect(writtenJson.retryCount).toBe(0);
    });

    it('Test 3: audit write failure is non-fatal (continues session)', async () => {
      // Make appendFileSync throw on all calls (writeAuditEntry retries up to 3 times)
      vi.mocked(fs.appendFileSync).mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      const input = {
        tool: 'task',
        sessionID: 'sess_fail',
        callID: 'call_fail',
        args: { subagent_type: 'reviewer' },
      };
      const output = {
        title: 'Review code',
        output: '<task_result></task_result>',
        metadata: {},
      };

      // Should not throw - session continues
      await expect(invokeHook(input, output)).resolves.not.toThrow();

      // console.error should be called for the audit write failure (after retries exhausted)
      // The error is logged by writeAuditEntry with "Failed to write audit log after retries:"
      expect(consoleErrorSpy).toHaveBeenCalled();
      const errorCall = consoleErrorSpy.mock.calls.find((c: any[]) => 
        c[0].includes('Failed to write audit log after retries')
      );
      expect(errorCall).toBeDefined();

      // console.warn should still be called (original behavior)
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it('Test 4: valid envelope output does NOT write silent_exit_candidate', async () => {
      const input = {
        tool: 'task',
        sessionID: 'sess_valid',
        callID: 'call_valid',
        args: { subagent_type: 'planner' },
      };
      const output = {
        title: 'Review plan',
        output: `<task_result>
<output-contract agent="planner" version="1">
{"agent":"planner","timestamp":"2025-01-15T10:30:00Z","responseType":"success","version":1,"verdict":"APPROVED","details":"Plan looks good"}
</output-contract>
</task_result>`,
        metadata: {},
      };

      await invokeHook(input, output);

      // Should NOT write silent_exit_candidate
      const silentExitCalls = vi.mocked(fs.appendFileSync).mock.calls.filter((c: any[]) => 
        c[1].includes('silent_exit_candidate')
      );
      expect(silentExitCalls).toHaveLength(0);

      // Should NOT call console.warn about missing task_result
      const warnCalls = consoleWarnSpy.mock.calls.filter((c: any[]) => 
        c[0].includes('Could not extract <task_result>')
      );
      expect(warnCalls).toHaveLength(0);
    });

    it('Test 5: envelope-less response (text without output-contract) does NOT write silent_exit_candidate', async () => {
      // This tests the classification boundary: envelope-less responses produce 
      // "contract-validation" entries, not "silent_exit_candidate"
      const input = {
        tool: 'task',
        sessionID: 'sess_no_envelope',
        callID: 'call_no_envelope',
        args: { subagent_type: 'researcher' },
      };
      const output = {
        title: 'Research topic',
        output: `<task_result>
This is plain text output without an output-contract envelope.
</task_result>`,
        metadata: {},
      };

      await invokeHook(input, output);

      // Should NOT write silent_exit_candidate (extractTaskResult succeeds, but validation fails)
      const silentExitCalls = vi.mocked(fs.appendFileSync).mock.calls.filter((c: any[]) => 
        c[1].includes('silent_exit_candidate')
      );
      expect(silentExitCalls).toHaveLength(0);

      // Should write a contract-validation entry instead (when validation fails)
      // Note: This depends on the validator being loaded. With our mock setup,
      // the validator may not be available, so we just verify no silent_exit_candidate.
    });
  });
});