import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextFunction, Request, Response } from 'express';

vi.mock('../modules/users/service.js', () => ({
  getUserRoleByUserId: vi.fn(),
}));

import { getUserRoleByUserId } from '../modules/users/service.js';
import { requireApprovalPermission } from './requireApprovalPermission.js';
import { ROLESCODES, PERMISSIONCODES } from '../utils/constants/enums.js';

const mockedGetUserRole = vi.mocked(getUserRoleByUserId);

const makeRes = () => {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
  };
  res.status.mockReturnValue(res);
  return res;
};

const run = async (
  status: string | undefined,
  roleCode: string | undefined,
  permissionCodes: string[] = []
) => {
  mockedGetUserRole.mockResolvedValue(
    roleCode
      ? ({
          roles: { code: roleCode },
          permits: permissionCodes.map((code) => ({ permissions: { code } })),
        } as never)
      : (null as never)
  );
  const req = {
    userId: 5,
    body: status === undefined ? {} : { status },
  } as unknown as Request;
  const res = makeRes();
  const next = vi.fn() as unknown as NextFunction;
  await requireApprovalPermission(PERMISSIONCODES.canApproveVacation)(
    req,
    res as unknown as Response,
    next
  );
  return { res, next };
};

describe('requireApprovalPermission (RN-VP-010)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('lets non-approval updates through without looking up permissions', async () => {
    const { next, res } = await run('PENDING', ROLESCODES.USER);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(mockedGetUserRole).not.toHaveBeenCalled();
  });

  it('lets requests without a status through', async () => {
    const { next } = await run(undefined, ROLESCODES.USER);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('lets ADMIN approve without an explicit permission', async () => {
    const { next, res } = await run('APPROVED', ROLESCODES.ADMIN);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('lets a user with canApproveVacation approve', async () => {
    const { next } = await run('APPROVED', ROLESCODES.USER, [
      PERMISSIONCODES.canApproveVacation,
    ]);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('returns 403 to a user without the approve permission (APPROVED)', async () => {
    const { next, res } = await run('APPROVED', ROLESCODES.USER, [
      PERMISSIONCODES.canEditRequestVacation,
    ]);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 403 to a user without the approve permission (REJECTED)', async () => {
    const { next, res } = await run('REJECTED', ROLESCODES.MANAGER, []);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('returns 403 when the user cannot be resolved (fail-closed)', async () => {
    const { next, res } = await run('APPROVED', undefined);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

import { resolveApprovalAccess } from './requireApprovalPermission.js';

describe('resolveApprovalAccess (task 5.4b server support)', () => {
  it('ADMIN can approve both modules', () => {
    expect(
      resolveApprovalAccess({
        roles: { code: ROLESCODES.ADMIN },
        permits: [],
      } as never)
    ).toEqual({ canApproveVacation: true, canApprovePermission: true });
  });

  it('a user only gets the codes actually assigned', () => {
    expect(
      resolveApprovalAccess({
        roles: { code: ROLESCODES.USER },
        permits: [
          { permissions: { code: PERMISSIONCODES.canApprovePermission } },
        ],
      } as never)
    ).toEqual({ canApproveVacation: false, canApprovePermission: true });
  });

  it('an unresolved user gets nothing (fail-closed)', () => {
    expect(resolveApprovalAccess(null)).toEqual({
      canApproveVacation: false,
      canApprovePermission: false,
    });
  });
});

describe('CANCELLED requiere el permiso de aprobación (RN-VP-010)', () => {
  it('returns 403 to a user without the approve permission (CANCELLED)', async () => {
    const { next, res } = await run('CANCELLED', ROLESCODES.USER, []);
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
