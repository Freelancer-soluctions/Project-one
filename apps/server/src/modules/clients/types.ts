import type { Prisma } from '@prisma/client';

/**
 * Contratos de dominio del módulo `clients` — AUTOCONTENIDO.
 * Este módulo es dueño de sus tipos: solo importa de Prisma y primitivas
 * (server-ts-domain-interfaces, design §1-§2).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. Entidades
// ─────────────────────────────────────────────────────────────────────────────

/** Fila de `clients`. */
export type Client = Prisma.clientsGetPayload<object>;

/**
 * Fila del listado: proyección del `$queryRaw` (cliente + nombres de los usuarios
 * que lo crearon/actualizaron).
 */
export type ClientListRow = Client & {
  userClientCreatedName: string | null;
  userClientUpdatedName: string | null;
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Inputs de escritura — cuerpos validados por Joi (contrato de API)
// ─────────────────────────────────────────────────────────────────────────────

/** Body de `POST /clients` + autor inyectado por el controller. */
export interface CreateClientInput {
  name: string;
  email: string;
  phone: string;
  address?: string;
  /** Usuario autenticado que crea el registro (viene del token). */
  createdBy: number;
}

/** Body de `PATCH /clients/:id` + autor inyectado por el controller. */
export interface UpdateClientInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  /** Usuario autenticado que actualiza el registro (viene del token). */
  updatedBy?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Query / filtros — lo que el controller extrae de `req.safeQuery`
// ─────────────────────────────────────────────────────────────────────────────

/** Filtros de `GET /clients`. */
export interface ClientFilters {
  name?: string;
  email?: string;
  phone?: string;
  page?: number;
  limit?: number;
}

/** Subconjunto de filtros que llega al dao (sin paginación). */
export type ClientDaoFilters = Pick<ClientFilters, 'name' | 'email' | 'phone'>;

// ─────────────────────────────────────────────────────────────────────────────
// 4. Payloads de persistencia (lo que el dao escribe en Prisma)
// ─────────────────────────────────────────────────────────────────────────────

/** Datos de creación ya normalizados por el service (timestamp). */
export type CreateClientData = CreateClientInput & { createdOn: Date };

/** Datos de actualización ya normalizados por el service (timestamp). */
export type UpdateClientData = UpdateClientInput & { updatedOn: Date };

// ─────────────────────────────────────────────────────────────────────────────
// 5. Resultados de service — fronteras públicas del módulo
// ─────────────────────────────────────────────────────────────────────────────

/** Resultado paginado del listado de clientes. */
export interface ClientServiceResult {
  dataList: ClientListRow[];
  total: number;
}
