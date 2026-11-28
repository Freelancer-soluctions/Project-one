import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./dao.js', () => ({
  getAllPermissions: vi.fn(),
  createPermission: vi.fn(),
  updatePermissionById: vi.fn(),
  deletePermissionById: vi.fn(),
}));

import * as dao from './dao.js';
import { createPermission, updatePermissionById } from './service.js';
import {
  permissionCreateSchema,
  permissionUpdateSchema,
} from './schemas/permission.joi.js';

const forged = {
  approvedBy: 99,
  approvedAt: '2026-01-01T00:00:00.000Z',
  rejectedBy: 98,
  rejectedAt: '2026-01-01T00:00:00.000Z',
};

const createBody = {
  employeeId: 1,
  type: 'PERSONAL',
  startDate: '2026-02-01T00:00:00.000Z',
  endDate: '2026-02-03T00:00:00.000Z',
  reason: 'turno médico',
  comments: 'urgente',
  paid: false,
};

describe('permission service — whitelist and persistence (task 3.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dao.createPermission).mockResolvedValue({} as never);
    vi.mocked(dao.updatePermissionById).mockResolvedValue({} as never);
  });

  it('create persists reason, comments and paid, stamps createdBy from the token', async () => {
    await createPermission(createBody as never, 9);

    expect(dao.createPermission).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'turno médico',
        comments: 'urgente',
        paid: false,
        createdBy: 9,
        startDate: new Date(createBody.startDate),
        endDate: new Date(createBody.endDate),
      })
    );
  });

  it('create never forwards approver/rejecter fields from the body', async () => {
    await createPermission({ ...createBody, ...forged } as never, 9);

    const arg = vi.mocked(dao.createPermission).mock
      .calls[0]?.[0] as unknown as Record<string, unknown>;
    expect(arg['approvedBy']).toBeUndefined();
    expect(arg['approvedAt']).toBeUndefined();
    expect(arg['rejectedBy']).toBeUndefined();
    expect(arg['rejectedAt']).toBeUndefined();
  });

  it('patch takes updatedBy from the token, ignoring the body value', async () => {
    await updatePermissionById(
      5,
      { reason: 'nuevo', updatedBy: 1000 } as never,
      7
    );

    const [id, arg] = vi.mocked(dao.updatePermissionById).mock.calls[0] ?? [];
    expect(id).toBe(5);
    expect(arg).toMatchObject({
      reason: 'nuevo',
      updatedBy: 7,
      comments: undefined,
    });
  });

  it('patch strips approver/rejecter fields from the body', async () => {
    await updatePermissionById(5, { comments: 'c', ...forged } as never, 7);

    const arg = vi.mocked(dao.updatePermissionById).mock
      .calls[0]?.[1] as unknown as Record<string, unknown>;
    expect(arg['approvedBy']).toBeUndefined();
    expect(arg['approvedAt']).toBeUndefined();
    expect(arg['rejectedBy']).toBeUndefined();
    expect(arg['rejectedAt']).toBeUndefined();
  });
});

describe('permission approval stamping (RN-VP-001/002, task 3.2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dao.createPermission).mockResolvedValue({} as never);
    vi.mocked(dao.updatePermissionById).mockResolvedValue({} as never);
  });

  it('patch to APPROVED stamps approvedBy from the token and clears rejected', async () => {
    await updatePermissionById(5, { status: 'APPROVED' } as never, 7);

    const arg = vi.mocked(dao.updatePermissionById).mock
      .calls[0]?.[1] as unknown as Record<string, unknown>;
    expect(arg['approvedBy']).toBe(7);
    expect(arg['approvedAt']).toBeInstanceOf(Date);
    expect(arg['rejectedBy']).toBeNull();
    expect(arg['rejectedAt']).toBeNull();
  });

  it('patch to REJECTED stamps rejectedBy from the token and clears approved', async () => {
    await updatePermissionById(5, { status: 'REJECTED' } as never, 7);

    const arg = vi.mocked(dao.updatePermissionById).mock
      .calls[0]?.[1] as unknown as Record<string, unknown>;
    expect(arg['rejectedBy']).toBe(7);
    expect(arg['approvedBy']).toBeNull();
  });

  it('create with status APPROVED stamps approvedBy from the token, not from the body', async () => {
    await createPermission(
      { ...createBody, status: 'APPROVED', approvedBy: 99 } as never,
      9
    );

    const arg = vi.mocked(dao.createPermission).mock
      .calls[0]?.[0] as unknown as Record<string, unknown>;
    expect(arg['approvedBy']).toBe(9);
    expect(arg['approvedAt']).toBeInstanceOf(Date);
  });
});

describe('permission Joi schemas — forgery rejected, reason/comments/paid accepted', () => {
  it('create accepts reason, comments and paid', () => {
    expect(permissionCreateSchema.validate(createBody).error).toBeUndefined();
  });

  it('create rejects client-set approvedBy/approvedAt', () => {
    expect(
      permissionCreateSchema.validate({ ...createBody, approvedBy: 5 }).error
    ).toBeDefined();
    expect(
      permissionCreateSchema.validate({
        ...createBody,
        approvedAt: '2026-01-01',
      }).error
    ).toBeDefined();
  });

  it('update accepts paid but rejects approvedBy/rejectedBy', () => {
    expect(
      permissionUpdateSchema.validate({ paid: true }).error
    ).toBeUndefined();
    expect(
      permissionUpdateSchema.validate({ approvedBy: 5 }).error
    ).toBeDefined();
    expect(
      permissionUpdateSchema.validate({ rejectedBy: 5 }).error
    ).toBeDefined();
  });
});

describe('CANCELLED en Joi de permisos (RN-VP-008)', () => {
  it('update accepts status CANCELLED', () => {
    expect(
      permissionUpdateSchema.validate({ status: 'CANCELLED' }).error
    ).toBeUndefined();
  });
});
