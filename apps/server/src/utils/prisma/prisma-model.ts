import { prisma } from '../../config/db.js';

/* eslint-disable @typescript-eslint/no-explicit-any --
 * EXCEPCIÓN DOCUMENTADA (server-ts-phase3-core, task 5.3): única instancia de `any`
 * permitida en src/ — boundary deliberado para acceso dinámico a modelos Prisma.
 * Prisma's typed client exposes each model as a distinct delegate, so indexing
 * by a runtime table name (tableName) cannot be statically typed. This is the
 * single intentional `any` boundary for dynamic model access; the 14 call
 * sites in dao.ts / service.ts stay any-free by going through this helper. */
export const getModel = (tableName: string): any => (prisma as any)[tableName];
