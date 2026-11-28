import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./dao.js', () => ({
  getAllVacation: vi.fn(),
  createVacation: vi.fn(),
  updateVacationWithBalance: vi.fn(),
  deleteVacationById: vi.fn(),
}));

import * as dao from './dao.js';
import { createVacation, patchVacationById } from './service.js';
import {
  vacationCreateSchema,
  vacationUpdateSchema,
} from './schemas/vacation.joi.js';
import type { VacationInput, VacationUpdateData } from './types.js';

const forged = {
  approvedBy: 99,
  approvedAt: '2026-01-01T00:00:00.000Z',
  rejectedBy: 98,
  rejectedAt: '2026-01-01T00:00:00.000Z',
} as unknown as VacationInput;

describe('vacation service — input whitelist and traceability (task 2.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dao.createVacation).mockResolvedValue({} as never);
    vi.mocked(dao.updateVacationWithBalance).mockResolvedValue({} as never);
  });

  it('persists reason, comments and paid on create and stamps createdBy from the authenticated user', async () => {
    await createVacation(
      {
        employeeId: 1,
        startDate: '2026-01-01',
        endDate: '2026-01-05',
        reason: 'family',
        comments: 'ok',
        paid: false,
      } as VacationInput,
      9
    );

    expect(dao.createVacation).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'family',
        comments: 'ok',
        paid: false,
        createdBy: 9,
      })
    );
  });

  it('never forwards approver/rejecter fields on create', async () => {
    await createVacation(
      {
        employeeId: 1,
        startDate: '2026-01-01',
        endDate: '2026-01-05',
        ...forged,
      },
      9
    );

    const arg = vi.mocked(dao.createVacation).mock.calls[0]?.[0] as object;
    expect(arg).not.toHaveProperty('approvedBy');
    expect(arg).not.toHaveProperty('approvedAt');
    expect(arg).not.toHaveProperty('rejectedBy');
    expect(arg).not.toHaveProperty('rejectedAt');
  });

  it('patch takes updatedBy from the authenticated user, ignoring the body value', async () => {
    await patchVacationById(
      3,
      { status: 'PENDING', updatedBy: 1000, comments: 'x' } as VacationInput,
      7
    );

    const [id, arg] =
      vi.mocked(dao.updateVacationWithBalance).mock.calls[0] ?? [];
    expect(id).toBe(3);
    expect(arg).toMatchObject({
      status: 'PENDING',
      updatedBy: 7,
      comments: 'x',
    });
  });

  it('patch strips approver/rejecter and identity fields from the body', async () => {
    await patchVacationById(
      3,
      { comments: 'c', ...forged, createdBy: 1 } as VacationInput,
      7
    );

    const arg = vi.mocked(dao.updateVacationWithBalance).mock
      .calls[0]?.[1] as VacationUpdateData;
    expect(arg.approvedBy).toBeUndefined();
    expect(arg.rejectedBy).toBeUndefined();
    expect(arg.approvedAt).toBeUndefined();
    expect(arg.rejectedAt).toBeUndefined();
    expect(arg).not.toHaveProperty('createdBy');
  });
});

describe('vacation approval stamping (RN-VP-001, RN-VP-002, task 2.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dao.updateVacationWithBalance).mockResolvedValue({} as never);
  });

  it('APPROVED stamps approvedBy/approvedAt from the actor and clears rejected pair', async () => {
    await patchVacationById(
      3,
      { status: 'APPROVED', ...forged } as VacationInput,
      42
    );

    const arg = vi.mocked(dao.updateVacationWithBalance).mock
      .calls[0]?.[1] as VacationUpdateData;
    expect(arg.approvedBy).toBe(42);
    expect(arg.approvedAt).toBeInstanceOf(Date);
    expect(arg.rejectedBy).toBeNull();
    expect(arg.rejectedAt).toBeNull();
  });

  it('REJECTED stamps rejectedBy/rejectedAt from the actor and clears approved pair', async () => {
    await patchVacationById(
      3,
      { status: 'REJECTED', ...forged } as VacationInput,
      42
    );

    const arg = vi.mocked(dao.updateVacationWithBalance).mock
      .calls[0]?.[1] as VacationUpdateData;
    expect(arg.rejectedBy).toBe(42);
    expect(arg.rejectedAt).toBeInstanceOf(Date);
    expect(arg.approvedBy).toBeNull();
    expect(arg.approvedAt).toBeNull();
  });

  it('PENDING clears both stamp pairs', async () => {
    await patchVacationById(3, { status: 'PENDING' } as VacationInput, 42);

    const arg = vi.mocked(dao.updateVacationWithBalance).mock
      .calls[0]?.[1] as VacationUpdateData;
    expect(arg).toMatchObject({
      approvedBy: null,
      approvedAt: null,
      rejectedBy: null,
      rejectedAt: null,
    });
  });

  it('a patch without status leaves the stamps untouched', async () => {
    await patchVacationById(
      3,
      { comments: 'only comment' } as VacationInput,
      42
    );

    const arg = vi.mocked(dao.updateVacationWithBalance).mock
      .calls[0]?.[1] as VacationUpdateData;
    expect(arg).not.toHaveProperty('approvedBy');
    expect(arg).not.toHaveProperty('rejectedBy');
  });
});

describe('vacation Joi schemas — reason/comments/paid accepted, forgery rejected (RN-VP-003/004/005/012)', () => {
  const base = {
    employeeId: 1,
    startDate: '2026-01-01',
    endDate: '2026-01-05',
  };

  it('create accepts reason, comments and paid', () => {
    const { error } = vacationCreateSchema.validate({
      ...base,
      reason: 'r',
      comments: 'c',
      paid: false,
    });
    expect(error).toBeUndefined();
  });

  it('create rejects client-set approvedBy (forgery)', () => {
    const { error } = vacationCreateSchema.validate({ ...base, approvedBy: 5 });
    expect(error).toBeDefined();
  });

  it('update accepts comments and paid but rejects approvedBy', () => {
    expect(
      vacationUpdateSchema.validate({ comments: 'c', paid: true }).error
    ).toBeUndefined();
    expect(
      vacationUpdateSchema.validate({ rejectedBy: 5 }).error
    ).toBeDefined();
  });

  it('create rejects reason longer than 500 chars and comments longer than 1000', () => {
    expect(
      vacationCreateSchema.validate({ ...base, reason: 'a'.repeat(501) }).error
    ).toBeDefined();
    expect(
      vacationCreateSchema.validate({ ...base, comments: 'a'.repeat(1001) })
        .error
    ).toBeDefined();
  });
});

describe('CANCELLED en Joi (RN-VP-008)', () => {
  it('update accepts status CANCELLED', () => {
    expect(
      vacationUpdateSchema.validate({ status: 'CANCELLED' }).error
    ).toBeUndefined();
  });
});
