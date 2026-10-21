import type { Prisma } from '@prisma/client';

/**
 * Contratos de dominio del módulo `users` — AUTOCONTENIDO.
 * Este módulo es dueño de sus tipos: solo importa de Prisma y primitivas
 * (server-ts-domain-interfaces, design §1-§2). Los códigos de estado viven en
 * `./constants/users.js` y se re-exportan aquí sin moverlos.
 */

export type { UserStatusCode } from './constants/users.js';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Entidades
// ─────────────────────────────────────────────────────────────────────────────

/** Fila de `users`. */
export type User = Prisma.usersGetPayload<object>;

/** Fila de `roles`. */
export type Role = Prisma.rolesGetPayload<object>;

/** Fila de `userStatus`. */
export type UserStatusRow = Prisma.userStatusGetPayload<object>;

/** Fila de `permissions`. */
export type Permission = Prisma.permissionsGetPayload<object>;

/** Fila de `userPermits` (permiso asignado a un usuario). */
export type UserPermit = Prisma.userPermitsGetPayload<object>;

/** `users` con rol, estado y permisos (select de creación / búsqueda por email). */
export type UserWithDetails = Prisma.usersGetPayload<{
  include: { roles: true; userStatus: true; permits: true };
}>;

/** `users` con permisos y el detalle de cada permiso (árbol de autorización). */
export type UserWithRoleAndPermits = Prisma.usersGetPayload<{
  include: { roles: true; permits: { include: { permissions: true } } };
}>;

/** `users` con su rol (chequeo de email registrado). */
export type UserWithRoles = Prisma.usersGetPayload<{
  include: { roles: true };
}>;

/** `users` con sus permisos asignados. */
export type UserWithPermits = Prisma.usersGetPayload<{
  include: { permits: true };
}>;

/** Opción de permiso para el selector de permisos (`select` acotado). */
export type PermissionOption = Prisma.permissionsGetPayload<{
  select: { id: true; description: true; code: true };
}>;

/** Opción de usuario (id + nombre) que consume el frontend como `{ id, label }`. */
export type UserStatusOption = Prisma.usersGetPayload<{
  select: { id: true; name: true };
}>;

/**
 * Fila del listado de usuarios: proyección del `$queryRaw` (usuario + descripciones
 * de estado/rol y nombre del último editor).
 */
export type UserListRow = User & {
  lastUpdatedByName: string | null;
  statusDescription: string | null;
  statusCode: string | null;
  roleDescription: string | null;
  roleCode: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Inputs de escritura — cuerpos validados por Joi (contrato de API)
// ─────────────────────────────────────────────────────────────────────────────

/** Body de `POST /users` (`userCreateSchema`) + autor inyectado por el controller. */
export interface CreateUserInput {
  name: string;
  email: string;
  address?: string;
  birthday: Date;
  city?: string;
  isAdmin?: boolean;
  picture?: string;
  document?: string;
  roleId: number;
  socialSecurity: string;
  startDate: Date;
  state?: string;
  statusId: number;
  telephone: string;
  zipcode: string;
  permissions?: (number | string)[];
  /** Usuario autenticado que crea el registro (viene del token, no del body). */
  lastUpdatedBy: number;
}

/** Body de `PATCH /users/:id` (`userUpdateSchema`) + campos que agrega el service. */
export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  address?: string;
  birthday?: Date;
  city?: string;
  isAdmin?: boolean;
  isManager?: boolean;
  accessNews?: boolean;
  accessConfiguration?: boolean;
  picture?: string;
  document?: string;
  roleId?: number;
  socialSecurity?: string;
  startDate?: Date;
  state?: string;
  statusId?: number;
  telephone?: string;
  zipcode?: string;
  permissions?: (number | string)[];
  lastUpdatedBy?: number;
  lastUpdatedOn?: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Query / filtros — lo que el controller extrae de `req.safeQuery`
// ─────────────────────────────────────────────────────────────────────────────

/** Filtros de `GET /users` (`userFiltersSchema`). */
export interface UserFilters {
  name?: string;
  email?: string;
  status?: string;
  page?: number;
  limit?: number;
}

/** Subconjunto de filtros que llega al dao (sin paginación). */
export type UserDaoFilters = Pick<UserFilters, 'name' | 'email' | 'status'>;

// ─────────────────────────────────────────────────────────────────────────────
// 4. Payloads de persistencia (lo que el dao escribe en Prisma)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Payload de creación del dao: es el input unchecked de Prisma, que exige
 * `password`. El Joi de `POST /users` todavía no declara ese campo (gap
 * preexistente de la ruta), por eso el service castea una sola vez hacia este
 * tipo para no cambiar el comportamiento actual.
 */
export type UserCreateData = Prisma.usersUncheckedCreateInput;

// ─────────────────────────────────────────────────────────────────────────────
// 5. Resultados de service — fronteras públicas del módulo
// ─────────────────────────────────────────────────────────────────────────────

/** Resultado paginado del listado de usuarios. */
export interface UserServiceResult {
  dataList: UserListRow[];
  total: number;
}

/** Resultado de `getAllUserPermits`: catálogo completo + permisos del usuario. */
export interface UserPermitsResult {
  allPermissions: PermissionOption[];
  user: UserWithPermits | null;
}

/** Permiso del catálogo marcado según pertenezca al usuario consultado. */
export type PermissionWithAssignment = PermissionOption & { assigned: boolean };

/** Opción de usuario normalizada para el frontend (`{ id, label }`). */
export interface UserSelectOption {
  id: number;
  label: string;
}
