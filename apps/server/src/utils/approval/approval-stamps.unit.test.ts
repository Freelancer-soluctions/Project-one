import { describe, it, expect } from 'vitest';
import { buildApprovalStamps } from './approval-stamps.js';

const NOW = new Date('2026-05-01T10:00:00.000Z');

describe('buildApprovalStamps (RN-VP-001, RN-VP-002)', () => {
  it('APPROVED stamps the approver and clears the rejected pair', () => {
    expect(buildApprovalStamps('APPROVED', 42, NOW)).toEqual({
      approvedBy: 42,
      approvedAt: NOW,
      rejectedBy: null,
      rejectedAt: null,
    });
  });

  it('REJECTED stamps the rejecter and clears the approved pair', () => {
    expect(buildApprovalStamps('REJECTED', 42, NOW)).toEqual({
      approvedBy: null,
      approvedAt: null,
      rejectedBy: 42,
      rejectedAt: NOW,
    });
  });

  it('PENDING clears both pairs', () => {
    expect(buildApprovalStamps('PENDING', 42, NOW)).toEqual({
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
    });
  });

  it('returns no fields when status is absent (stamps untouched)', () => {
    expect(buildApprovalStamps(undefined, 42, NOW)).toEqual({});
  });

  it('stores null when the actor is unknown instead of a bogus id', () => {
    expect(buildApprovalStamps('APPROVED', undefined, NOW)).toMatchObject({
      approvedBy: null,
      approvedAt: NOW,
    });
  });
});

describe('CANCELLED (RN-VP-008: cancelación cuenta como rechazo para la trazabilidad)', () => {
  it('CANCELLED stamps the actor in the rejected pair and clears the approved pair', () => {
    expect(buildApprovalStamps('CANCELLED', 42, NOW)).toEqual({
      approvedBy: null,
      approvedAt: null,
      rejectedBy: 42,
      rejectedAt: NOW,
    });
  });
});
