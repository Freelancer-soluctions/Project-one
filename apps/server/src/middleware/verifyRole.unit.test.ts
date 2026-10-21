import type { NextFunction, Request, Response } from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Regresión de `server-ts-latent-defects`, fix 1 (security) y de
 * `server-fix-role-permits-authorization`.
 *
 * 1. `req.userRole`: AMBAS factories guardaban el rol en una const LOCAL y
 *    nunca lo publicaban. El guard de `GET /events?showDeleted=true` leía
 *    `undefined`, y `undefined !== 'ADMIN'` es `true`: cualquier usuario
 *    autenticado podía pedir eventos borrados. Fijado en los 4 caminos de
 *    éxito (1 de `checkRoleAuth` + 3 de `checkRoleAuthOrPermisssion`).
 *
 * 2. Camino de concesión por permiso: se leía `user.rolePermits`, pero el DAO
 *    devuelve `permits` (relación `userPermits → permissions`), así que
 *    `rolePermissions` era siempre `[]` y TODO no-ADMIN recibía 403 aunque
 *    tuviera el permiso asignado. Los casos del bloque "camino 3" fallan con
 *    el código previo al fix y pasan con `user.permits`.
 */

vi.mock('../modules/users/service.js', () => ({
  getUserRoleByUserId: vi.fn(),
}));

// Solo lo que el controller de events importa del service: el guard debe
// cortar ANTES de llegar aquí en el caso no-ADMIN.
vi.mock('../modules/events/service.js', () => ({
  getAllEvents: vi.fn(),
}));

import { getUserRoleByUserId } from '../modules/users/service.js';
import { getAllEvents as getAllEventsService } from '../modules/events/service.js';
import type { UserWithRoleAndPermits } from '../modules/users/types.js';
import { ROLESCODES, PERMISSIONCODES } from '../utils/constants/enums.js';
import { checkRoleAuth, checkRoleAuthOrPermisssion } from './verifyRole.js';
import { getAllEvents } from '../modules/events/controller.js';

const mockedGetUserRole = vi.mocked(getUserRoleByUserId);
const mockedGetAllEvents = vi.mocked(getAllEventsService);

/** Permiso tal como lo devuelve el include `permits.permissions` del DAO. */
type RolePermit = { permissions: { code: string; id?: number } };

/**
 * Fila mínima con la forma que consume el middleware. El `as unknown as`
 * evita replicar las 20 columnas de `users`: lo único que se lee aquí es
 * `roles.code` y `permits[].permissions.code` — exactamente el include que
 * declara `UserWithRoleAndPermits`.
 *
 * `permits` es opcional para poder simular también la fila sin filas de
 * `userPermits` (`[]`) y el caso defensivo en que el DAO no las incluyera
 * (`undefined`), ambos fail-closed.
 */
const userWithRole = (code: string, permits?: RolePermit[]) =>
  ({
    id: 1,
    roles: { id: 1, code, description: code },
    permits,
  }) as unknown as UserWithRoleAndPermits;

const makeRes = (): Response =>
  ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }) as unknown as Response;

/** `req.userRole` es la única propiedad del contrato que se está fijando. */
const roleOf = (req: Request): string | undefined => req.userRole;

describe('checkRoleAuth (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('asigna req.userRole y deja pasar cuando el rol está permitido', async () => {
    mockedGetUserRole.mockResolvedValue(userWithRole(ROLESCODES.ADMIN));
    const req = { userId: 1 } as Request;
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    await checkRoleAuth({ allowedRoles: [ROLESCODES.ADMIN] })(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(roleOf(req)).toBe(ROLESCODES.ADMIN);
  });

  it('NO asigna req.userRole cuando el rol no está permitido (403)', async () => {
    mockedGetUserRole.mockResolvedValue(userWithRole(ROLESCODES.USER));
    const req = { userId: 1 } as Request;
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    await checkRoleAuth({ allowedRoles: [ROLESCODES.ADMIN] })(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(roleOf(req)).toBeUndefined();
  });

  it('responde 401 sin llamar al service cuando falta userId', async () => {
    const req = {} as Request;
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    await checkRoleAuth({ allowedRoles: [ROLESCODES.ADMIN] })(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockedGetUserRole).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});

describe('checkRoleAuthOrPermisssion (unit) — 3 caminos de éxito', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('camino 1 (ADMIN short-circuit): asigna req.userRole aunque allowedRoles lo excluya', async () => {
    mockedGetUserRole.mockResolvedValue(userWithRole(ROLESCODES.ADMIN));
    const req = { userId: 1 } as Request;
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    // Sin ADMIN en allowedRoles y con permisos exigidos: el short-circuit del
    // rol de sistema gana, y ese es justo el camino que antes no publicaba nada.
    await checkRoleAuthOrPermisssion({
      allowedRoles: [ROLESCODES.USER],
      permissions: [PERMISSIONCODES.canViewEvents],
    })(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(roleOf(req)).toBe(ROLESCODES.ADMIN);
    expect(mockedGetUserRole).toHaveBeenCalledWith(1);
  });

  it('camino 2 (sin permisos exigidos): asigna req.userRole del rol verificado', async () => {
    mockedGetUserRole.mockResolvedValue(userWithRole(ROLESCODES.USER));
    const req = { userId: 7 } as Request;
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    await checkRoleAuthOrPermisssion({
      allowedRoles: [ROLESCODES.USER, ROLESCODES.ADMIN],
    })(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(roleOf(req)).toBe(ROLESCODES.USER);
  });

  it('camino 3 (permiso concedido): asigna req.userRole junto al permiso válido', async () => {
    mockedGetUserRole.mockResolvedValue(
      userWithRole(ROLESCODES.MANAGER, [
        { permissions: { id: 1, code: PERMISSIONCODES.canViewEvents } },
      ])
    );
    const req = { userId: 3 } as Request;
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    await checkRoleAuthOrPermisssion({
      allowedRoles: [ROLESCODES.MANAGER],
      permissions: [PERMISSIONCODES.canViewEvents],
    })(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(roleOf(req)).toBe(ROLESCODES.MANAGER);
  });

  it('camino 3: concede con UN permiso requerido entre varios asignados', async () => {
    // El orden de `permits` no importa: `hasSomePermission` es un `some`.
    mockedGetUserRole.mockResolvedValue(
      userWithRole(ROLESCODES.USER, [
        { permissions: { id: 2, code: PERMISSIONCODES.canEditEvents } },
        { permissions: { id: 1, code: PERMISSIONCODES.canViewEvents } },
      ])
    );
    const req = { userId: 4 } as Request;
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    await checkRoleAuthOrPermisssion({
      allowedRoles: [ROLESCODES.USER],
      permissions: [PERMISSIONCODES.canViewEvents],
    })(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(roleOf(req)).toBe(ROLESCODES.USER);
  });

  it('camino 3: con permisos asignados pero ninguno requerido → 403 (fail-closed)', async () => {
    mockedGetUserRole.mockResolvedValue(
      userWithRole(ROLESCODES.USER, [
        { permissions: { id: 2, code: PERMISSIONCODES.canEditEvents } },
      ])
    );
    const req = { userId: 5 } as Request;
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    await checkRoleAuthOrPermisssion({
      allowedRoles: [ROLESCODES.USER],
      permissions: [PERMISSIONCODES.canViewEvents],
    })(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Insufficient permissions for this operation',
    });
    expect(next).not.toHaveBeenCalled();
    expect(roleOf(req)).toBeUndefined();
  });

  it('camino 3: sin filas de userPermits ([]) → 403 (fail-closed)', async () => {
    mockedGetUserRole.mockResolvedValue(userWithRole(ROLESCODES.USER, []));
    const req = { userId: 6 } as Request;
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    await checkRoleAuthOrPermisssion({
      allowedRoles: [ROLESCODES.USER],
      permissions: [PERMISSIONCODES.canViewEvents],
    })(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('camino 3: `permits` ausente (undefined) → 403 (fail-closed)', async () => {
    mockedGetUserRole.mockResolvedValue(userWithRole(ROLESCODES.USER));
    const req = { userId: 8 } as Request;
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    await checkRoleAuthOrPermisssion({
      allowedRoles: [ROLESCODES.USER],
      permissions: [PERMISSIONCODES.canViewEvents],
    })(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('rol no permitido: 403 y sin asignar req.userRole', async () => {
    mockedGetUserRole.mockResolvedValue(userWithRole(ROLESCODES.USER));
    const req = { userId: 1 } as Request;
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    await checkRoleAuthOrPermisssion({
      allowedRoles: [ROLESCODES.MANAGER],
    })(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
    expect(roleOf(req)).toBeUndefined();
  });

  it('permiso no concedido: 403 y sin asignar req.userRole', async () => {
    mockedGetUserRole.mockResolvedValue(userWithRole(ROLESCODES.USER, []));
    const req = { userId: 1 } as Request;
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    await checkRoleAuthOrPermisssion({
      allowedRoles: [ROLESCODES.USER],
      permissions: [PERMISSIONCODES.canViewEvents],
    })(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
    expect(roleOf(req)).toBeUndefined();
  });
});

/**
 * Guard de `showDeleted` con el valor que el middleware deja en `req.userRole`.
 *
 * Se ejecuta el CONTROLLER real (no el middleware) porque lo que hay que fijar
 * aquí es la comparación contra el CÓDIGO de rol: con el literal `'ADMIN'` el
 * guard habría rechazado incluso a un ADMIN. El setter del middleware ya está
 * cubierto por los describes de arriba.
 */
describe('events showDeleted guard (unit) — rol verificado, comparación por código', () => {
  const runGetEvents = async (
    userRole: string | undefined,
    query: Record<string, unknown> = { showDeleted: 'true' }
  ) => {
    const req = { userId: 1, userRole, query } as unknown as Request;
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    await getAllEvents(req, res, next);
    return { req, res, next };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAllEvents.mockResolvedValue({ data: [], total: 0 });
  });

  it('ADMIN (C01) con showDeleted=true: llega al service y responde 200', async () => {
    const { res } = await runGetEvents(ROLESCODES.ADMIN);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockedGetAllEvents).toHaveBeenCalledWith(
      expect.objectContaining({ showDeleted: true })
    );
  });

  it('USER (C02) con showDeleted=true: 403 y el service NO se llama', async () => {
    const { res } = await runGetEvents(ROLESCODES.USER);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Access denied: showDeleted requires ADMIN role',
      })
    );
    expect(mockedGetAllEvents).not.toHaveBeenCalled();
  });

  it('USER (C02) sin showDeleted: responde 200 (el guard no se activa)', async () => {
    const { res } = await runGetEvents(ROLESCODES.USER, {});

    expect(res.status).toHaveBeenCalledWith(200);
    expect(mockedGetAllEvents).toHaveBeenCalledWith(
      expect.objectContaining({ showDeleted: false })
    );
  });

  it('rol ausente (undefined) con showDeleted=true: 403 (fail-closed)', async () => {
    const { res } = await runGetEvents(undefined);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(mockedGetAllEvents).not.toHaveBeenCalled();
  });
});
