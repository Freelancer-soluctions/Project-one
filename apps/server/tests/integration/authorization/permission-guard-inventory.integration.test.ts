import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import app from '../../../src/app.js';
import { prisma } from '../../../src/config/db.js';
import { ROLESCODES } from '../../../src/utils/constants/enums.js';

/**
 * Barrido del inventario de `server-fix-role-permits-authorization` (task 3.2,
 * mitad "nada que DEBÍA seguir cerrado queda abierto") — **BD real, sin mocks**.
 *
 * Se descubren las rutas en el propio código de rutas (mismo criterio AST-lite
 * que el inventario de `tasks.md` §1.2) y se pide cada una con un USER (C02)
 * **sin ningún `userPermit`**. Todas deben responder 403:
 * `Role not authorized for this action` (path 2) o `Insufficient permissions
 * for this operation` (path 3). Si alguna responde 2xx, el fix habría abierto
 * un endpoint que debía seguir cerrado.
 *
 * Descubrir en runtime (en vez de hardcodear las 102 rutas) hace que cualquier
 * ruta nueva con `permissions: [...]` entre al barrido sin tocar el test.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = path.resolve(HERE, '../../..');
const SRC = path.join(SERVER_ROOT, 'src');
const ROUTES_INDEX = path.join(SRC, 'routes/v1/index.ts');

const SECRET = process.env.SECRETKEY as string;
const SWEEP_EMAIL = 'sweep-no-permits@test.local';

type GuardedRoute = {
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  path: string;
};

/** Índice justo después del paréntesis que cierra la llamada abierta en `open`. */
const matchParen = (src: string, open: number): number => {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '(') depth++;
    else if (src[i] === ')') {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return src.length;
};

const walk = (dir: string, acc: string[] = []): string[] => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (/routes\.ts$/.test(entry.name)) acc.push(full);
  }
  return acc;
};

/** Prefijos de montaje leídos de `src/routes/v1/index.ts` (var → `/api/v1/...`). */
const readPrefixes = (): Map<string, string> => {
  const indexSrc = fs.readFileSync(ROUTES_INDEX, 'utf8');
  const imports = new Map<string, string>();
  for (const m of indexSrc.matchAll(
    /^import\s+(\w+)\s+from\s+'\.\.\/\.\.\/modules\/([^'/]+)[^']*';$/gms
  )) {
    const [, varName, moduleDir] = m;
    if (varName && moduleDir) imports.set(varName, moduleDir);
  }
  const prefixes = new Map<string, string>();
  for (const m of indexSrc.matchAll(/router\.use\('([^']+)',\s*(\w+)\)/g)) {
    const [, prefix, varName] = m;
    if (!prefix || !varName) continue;
    const dir = imports.get(varName);
    if (dir) prefixes.set(dir, `/api/v1${prefix === '/' ? '' : prefix}`);
  }
  return prefixes;
};

/** Rutas con `checkRoleAuthOrPermisssion({ ..., permissions: [...] })`. */
const discoverGuardedRoutes = (): GuardedRoute[] => {
  const prefixes = readPrefixes();
  const routes: GuardedRoute[] = [];
  const seen = new Set<string>();

  for (const file of walk(path.join(SRC, 'modules'))) {
    if (file === ROUTES_INDEX) continue;
    const src = fs.readFileSync(file, 'utf8');
    const rel = path
      .relative(path.join(SRC, 'modules'), file)
      .replaceAll('\\', '/');
    const moduleDir = rel.split('/')[0] ?? '';
    let mount = prefixes.get(moduleDir);
    if (!mount) continue;
    if (rel.includes('/attendee/')) mount = `${mount}/attendee`;

    for (const m of src.matchAll(
      /\brouter\.(get|post|put|patch|delete)\(\s*'([^']+)'/g
    )) {
      const open = src.indexOf('(', m.index);
      const callText = src.slice(m.index, matchParen(src, open));
      const authIdx = callText.indexOf('checkRoleAuthOrPermisssion({');
      if (authIdx === -1) continue;
      const options = callText.slice(authIdx);
      // Solo los que exigen permisos: los de solo-rol no cambian con el fix.
      if (!/permissions:\s*\[[^\]]+\]/.test(options)) continue;

      const withParam = `${mount}${m[2] === '/' ? '' : m[2]}`;
      const concrete = withParam.replace(/:[A-Za-z_]\w*/g, '1');
      const key = `${m[1]}:${concrete}`;
      if (seen.has(key)) continue;
      seen.add(key);
      routes.push({
        method: m[1] as GuardedRoute['method'],
        path: concrete,
      });
    }
  }
  return routes;
};

const tokenFor = (userId: number): string =>
  jwt.sign({ id: userId }, SECRET, {
    algorithm: 'HS256',
    expiresIn: '5m',
    issuer: 'mi-api',
    audience: 'mi-front',
  });

const CLOSED_MESSAGES = [
  'Insufficient permissions for this operation',
  'Role not authorized for this action',
];

/**
 * Rutas que el router no registra (path sin '/' inicial): responden 404 aunque
 * lleven el guard. Pre-existentes, fuera del alcance de este change.
 */
const UNREACHABLE_ROUTES = new Set([
  '/api/v1/purchasesdetail/1',
  '/api/v1/salesdetail/1',
]);

describe('inventario de rutas con permissions (integration, BD real) — 3.2', () => {
  const guardedRoutes = discoverGuardedRoutes();
  let userId = 0;
  let token = '';

  beforeAll(async () => {
    const role = await prisma.roles.findUnique({
      where: { code: ROLESCODES.USER },
    });
    const status = await prisma.userStatus.findFirst();
    if (!role || !status) {
      throw new Error('BD de test sin sembrar: faltan roles/userStatus');
    }

    // Usuario propio (no `user2@gmail.com`): cero `userPermits` y sin carreras
    // con otras suites de integration que sí conceden permisos.
    const user = await prisma.users.upsert({
      where: { email: SWEEP_EMAIL },
      create: {
        name: 'Sweep No Permits',
        email: SWEEP_EMAIL,
        password: 'not-a-real-login',
        // Columnas NOT NULL sin default en `users` (schema.prisma).
        birthday: new Date('1990-01-01T00:00:00.000Z'),
        socialSecurity: '000000000',
        state: 'N/A',
        telephone: '0000000000',
        zipcode: '00000',
        roleId: role.id,
        statusId: status.id,
        lastUpdatedBy: 1,
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        isAdmin: false,
      },
      update: { roleId: role.id, statusId: status.id },
    });
    userId = user.id;
    await prisma.userPermits.deleteMany({ where: { userId } });
    token = tokenFor(userId);
  });

  afterAll(async () => {
    await prisma.userPermits.deleteMany({ where: { userId } });
    await prisma.users.deleteMany({ where: { email: SWEEP_EMAIL } });
  });

  it('descubre el inventario completo', () => {
    // 102 montajes con `permissions` − 4 handlers duplicados (mismo módulo +
    // método + path, el segundo inalcanzable) = 98 endpoints distintos hoy.
    // El umbral es laxo a propósito: si se añaden rutas, entran al barrido.
    expect(guardedRoutes.length).toBeGreaterThanOrEqual(98);
  });

  it('ninguna ruta con permissions queda abierta para un USER sin userPermits', async () => {
    const failures: string[] = [];

    for (const route of guardedRoutes) {
      let req = request(app)
        [route.method](route.path)
        .set('Authorization', `Bearer ${token}`);
      if (route.method !== 'get') {
        // CSRF aplica a no-GET: mismo valor en cookie y header.
        req = req
          .set('Cookie', 'csrfToken=sweep-csrf')
          .set('csrf-token', 'sweep-csrf');
      }

      const res = await req;
      const error = (res.body as { error?: string }).error ?? '';

      // Dos DELETE declaran el path literal `detail/:id` (sin '/' inicial) y
      // Express no las registra: responden 404. Son inalcanzables, así que no
      // pueden filtrar nada — se listan explícitamente para que un 404 nuevo
      // en otra ruta sí falle el barrido.
      if (UNREACHABLE_ROUTES.has(route.path)) {
        if (res.status !== 404) {
          failures.push(
            `${route.method.toUpperCase()} ${route.path} → ${res.status} (esperado 404: ruta inalcanzable)`
          );
        }
        continue;
      }

      if (res.status !== 403 || !CLOSED_MESSAGES.includes(error)) {
        failures.push(
          `${route.method.toUpperCase()} ${route.path} → ${res.status} ${JSON.stringify(res.body)}`
        );
      }
    }

    expect(failures).toEqual([]);
  }, 120_000);
});
