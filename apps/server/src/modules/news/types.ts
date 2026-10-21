import type { Prisma } from '@prisma/client';

/**
 * Contratos de dominio del módulo `news` — AUTOCONTENIDO.
 * Este módulo es dueño de sus tipos: solo importa de Prisma y primitivas
 * (server-ts-domain-interfaces, design §1-§2).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. Entidades
// ─────────────────────────────────────────────────────────────────────────────

/** Fila de `news`. */
export type News = Prisma.newsGetPayload<object>;

/** Fila de `newsStatus`. */
export type NewsStatus = Prisma.newsStatusGetPayload<object>;

/**
 * Fila del listado: `news` + las relaciones que `getAllNews` incluye
 * (status, creador y usuarios de pending/closed). Derivado de Prisma para que
 * quitar o agregar un `include` rompa el contrato en compilación.
 */
export type NewsListItem = Prisma.newsGetPayload<{
  include: {
    status: { select: { id: true; code: true; description: true } };
    userNewsCreated: { select: { name: true } };
    userNewsClosed: { select: { name: true } };
    userNewsPending: { select: { name: true } };
  };
}>;

// ─────────────────────────────────────────────────────────────────────────────
// 2. Inputs de escritura — cuerpos validados por Joi (contrato de API)
// ─────────────────────────────────────────────────────────────────────────────

/** Body de `POST /news` (`NewsCreateSchema`). */
export interface CreateNewsInput {
  description: string;
  statusId: number;
  /** Código de estado (VarChar(3)); decide si la fila nace PENDING. */
  statusCode: string;
  document?: string;
}

/**
 * Body de `PATCH /news/:id` (`NewsUpdate`). El service agrega los campos de
 * cierre/pending, por eso también viven en el contrato de entrada.
 */
export interface UpdateNewsInput {
  description?: string;
  statusId?: number;
  statusCode?: string;
  document?: string;
  closedBy?: number;
  closedOn?: Date;
  pendingBy?: number;
  pendingOn?: Date;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Query / filtros — lo que el controller extrae de `req.safeQuery`
// ─────────────────────────────────────────────────────────────────────────────

/** Filtros de `GET /news` (`NewsFilters`). */
export interface NewsFilters {
  description?: string;
  fromDate?: Date;
  toDate?: Date;
  statusCode?: string;
  page?: number;
  limit?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Payloads de persistencia (lo que el dao escribe en Prisma)
// ─────────────────────────────────────────────────────────────────────────────

/** Datos de creación ya normalizados por el service (timestamps + autor). */
export interface CreateNewsData {
  description: string;
  statusId: number;
  createdBy: number;
  createdOn: Date;
  document?: string | null;
  documentId?: string | null;
  pendingBy?: number | null;
  pendingOn?: Date | null;
}

/** Datos de actualización ya normalizados por el service. */
export interface UpdateNewsData {
  description?: string;
  statusId?: number;
  document?: string | null;
  documentId?: string | null;
  closedBy?: number | null;
  closedOn?: Date | null;
  pendingBy?: number | null;
  pendingOn?: Date | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Resultados de service — fronteras públicas del módulo
// ─────────────────────────────────────────────────────────────────────────────

/** Resultado paginado del listado de noticias (espeja la respuesta real del dao). */
export interface NewsServiceResult {
  dataList: NewsListItem[];
  total: number;
}
