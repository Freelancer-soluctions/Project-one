import type { Prisma } from '@prisma/client';

/**
 * Contratos de dominio del módulo `auth` — AUTOCONTENIDO.
 * Este módulo es dueño de sus tipos: solo importa de Prisma y primitivas
 * (server-ts-domain-interfaces, design §1-§2). El payload del token se alinea
 * con `src/utils/jwt/createToken.ts` (`createToken({ id, rol? })`).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. Entidades
// ─────────────────────────────────────────────────────────────────────────────

/** Fila de `refreshToken`. */
export type RefreshTokenRecord = Prisma.refreshTokenGetPayload<object>;

/**
 * Fila de `users` tal como la devuelven los helpers genéricos del dao de auth.
 * `firstName` y `role` los lee el service aunque el modelo no los declare
 * (en runtime llegan `undefined`); `roles` es la relación que incluyen
 * `signIn`/`session`/`getUserById`.
 */
export type AuthUserRecord = Prisma.usersGetPayload<object> & {
  firstName?: string | null;
  role?: number | null;
  roles?: {
    id: number;
    code: string;
    description: string;
  } | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Inputs de escritura — cuerpos validados por Joi (contrato de API)
// ─────────────────────────────────────────────────────────────────────────────

/** Body de `POST /auth/signup` (`SignUpSchema`) + campos que agrega el service. */
export interface SignUpInput {
  firstName: string;
  lastName: string;
  birthday: Date;
  email: string;
  password: string;
  /** Rol asignado por el service (`ROLESCODES.USER`), no viene del body. */
  roleId?: number;
}

/** Body de `POST /auth/signin` (`SignInSchema`). */
export interface SignInInput {
  email: string;
  password: string;
}

/** Cookies de la request que consume el flujo de refresh/logout. */
export interface AuthCookies {
  jwt?: string;
}

/** Datos que viajan firmados en el access token (`utils/jwt/createToken.ts`). */
export interface AuthTokenPayload {
  id: number;
  rol?: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Payloads de persistencia (lo que el dao escribe en Prisma)
// ─────────────────────────────────────────────────────────────────────────────

/** Alta de refresh token en `refreshToken` (rotado por el service). */
export interface StoreRefreshTokenInput {
  token: string;
  userId: number;
  /** `Date.now()` del momento de emisión. */
  issuedAt: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Resultados de service — fronteras públicas del módulo
// ─────────────────────────────────────────────────────────────────────────────

/** Datos de usuario que devuelve auth (espeja lo que consume el frontend). */
export interface AuthUserPayload {
  id: number;
  firstName?: string | null;
  picture?: string | null;
  role?: number | null;
  roleId?: number | null;
  roleName?: string | null;
}

/** Resultado de `signUp`: solo access token. */
export interface SignUpResult {
  accessToken: string;
  user: AuthUserPayload;
}

/** Resultado de `signIn`: access + refresh + csrf (el controller borra los dos últimos). */
export interface SignInResult {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  user: AuthUserPayload;
}

/** Resultado de `refreshToken`: par rotado de tokens. */
export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
}

/** Resultado de `session`: datos mínimos del usuario autenticado. */
export interface SessionResult {
  user: {
    name: string;
    picture: string | null;
    role: number | null;
    id: number | null;
  };
}
