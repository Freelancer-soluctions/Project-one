import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  evaluateCriticalPathCoverage,
  validateCriticalPaths,
} from './coverage-critical-paths.mjs';

const policyFor = (entry, criticalRoots = []) => ({
  version: 1,
  criticalRoots,
  paths: [entry],
});
const now = new Date('2026-10-30T00:00:00.000Z');
const sourceFile = 'src/modules/auth/service.ts';
const floor = { statements: 50, branches: 50, functions: 50, lines: 50 };

describe('coverage-critical-paths policy validation', () => {
  it('rejects an enforced critical path without a configured metric floor', () => {
    const errors = validateCriticalPaths(
      policyFor({
        workspace: 'server',
        path: 'src/modules/auth/service.ts',
        status: 'enforced',
      }),
      {
        workspaceConfigs: {
          server: { test: { coverage: { thresholds: { statements: 60 } } } },
        },
        checkFiles: false,
        now: new Date('2026-10-30T00:00:00.000Z'),
      }
    );

    expect(errors.join('\n')).toContain(
      'src/modules/auth/service.ts is enforced but has no coverage floor'
    );
  });

  it('accepts an exempt path only when reason, owner and future expiry exist', () => {
    const errors = validateCriticalPaths(
      policyFor({
        workspace: 'server',
        path: 'src/modules/auth/service.ts',
        status: 'exempt',
        reason: 'No unit tests exist for this module yet.',
        owner: '@Freelancer-soluctions/backend-team',
        expiresAt: '2027-01-30',
      }),
      {
        workspaceConfigs: {},
        checkFiles: false,
        now: new Date('2026-10-30T00:00:00.000Z'),
      }
    );

    expect(errors).toEqual([]);
  });

  it('rejects an exemption missing its owner', () => {
    const errors = validateCriticalPaths(
      policyFor({
        workspace: 'server',
        path: 'src/modules/auth/service.ts',
        status: 'exempt',
        reason: 'No unit tests exist for this module yet.',
        expiresAt: '2027-01-30',
      }),
      {
        workspaceConfigs: {},
        checkFiles: false,
        now: new Date('2026-10-30T00:00:00.000Z'),
      }
    );

    expect(errors.join('\n')).toContain('owner');
  });

  it('rejects an expired exemption', () => {
    const errors = validateCriticalPaths(
      policyFor({
        workspace: 'server',
        path: sourceFile,
        status: 'exempt',
        reason: 'Coverage work is pending.',
        owner: '@team',
        expiresAt: '2026-10-29',
      }),
      { checkFiles: false, now }
    );

    expect(errors.join('\n')).toContain('expiresAt must be a future');
  });

  it('rejects duplicate policy paths', () => {
    const duplicate = {
      workspace: 'server',
      path: sourceFile,
      status: 'exempt',
      reason: 'Coverage work is pending.',
      owner: '@team',
      expiresAt: '2027-01-30',
    };
    const errors = validateCriticalPaths(
      { version: 1, criticalRoots: [], paths: [duplicate, { ...duplicate }] },
      { checkFiles: false, now }
    );

    expect(errors.join('\n')).toContain('duplicate critical path');
  });

  it('rejects an exact critical-path floor with no policy entry', () => {
    const errors = validateCriticalPaths(
      { version: 1, criticalRoots: [], paths: [] },
      {
        workspaceConfigs: {
          server: {
            test: { coverage: { thresholds: { [sourceFile]: floor } } },
          },
        },
        checkFiles: false,
        now,
      }
    );

    expect(errors.join('\n')).toContain(
      `${sourceFile} has a critical-path floor but no policy entry`
    );
  });

  it('requires new source files under critical modules to enter the policy', () => {
    const workspaceRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'coverage-policy-')
    );
    const newSourcePath = path.join(
      workspaceRoot,
      'src/modules/auth/new-service.ts'
    );
    const existingSourcePath = path.join(workspaceRoot, sourceFile);
    fs.mkdirSync(path.dirname(newSourcePath), { recursive: true });
    fs.mkdirSync(path.dirname(existingSourcePath), { recursive: true });
    fs.writeFileSync(newSourcePath, 'export {};\n');
    fs.writeFileSync(existingSourcePath, 'export {};\n');

    const errors = validateCriticalPaths(
      policyFor(
        {
          workspace: 'server',
          path: sourceFile,
          status: 'exempt',
          reason: 'Coverage work is pending.',
          owner: '@team',
          expiresAt: '2027-01-30',
        },
        [{ workspace: 'server', path: 'src/modules/auth' }]
      ),
      {
        workspaceRoots: { server: workspaceRoot },
        checkFiles: true,
        now,
      }
    );

    expect(errors.join('\n')).toContain(
      'src/modules/auth/new-service.ts is under a critical root but missing from policy'
    );
  });

  it('reports enforced paths missing from the coverage report', () => {
    const breaches = evaluateCriticalPathCoverage({
      policy: {
        paths: [{ workspace: 'server', path: sourceFile, status: 'enforced' }],
      },
      workspace: 'server',
      files: [],
      thresholds: { [sourceFile]: floor },
    });

    expect(breaches).toEqual([
      expect.objectContaining({
        path: sourceFile,
        reason: 'no coverage report entry for enforced critical path',
      }),
    ]);
  });
});
