import type { Prisma } from '@prisma/client';

/**
 * Contratos de dominio del módulo `settings` — AUTOCONTENIDO.
 * Este módulo es dueño de sus tipos: solo importa de Prisma y primitivas
 * (server-ts-domain-interfaces, design §1-§2).
 */

// ─────────────────────────────────────────────────────────────────────────────
// 1. Entidades — shape de fila derivado del schema Prisma (fuente de verdad)
// ─────────────────────────────────────────────────────────────────────────────

/** Fila de `settings` (preferencias de idioma/visualización de un usuario). */
export type Setting = Prisma.settingsGetPayload<object>;

/** Fila de `productCategories`. */
export type ProductCategory = Prisma.productCategoriesGetPayload<object>;

// ─────────────────────────────────────────────────────────────────────────────
// 2. Inputs de escritura — body validado por Joi (contrato de API, escrito a mano)
// ─────────────────────────────────────────────────────────────────────────────

/** Opciones de visualización del panel del usuario (sub-objeto de `displayOptions`). */
export interface SettingDisplayOptions {
  displayEvents?: boolean;
  displayNotes?: boolean;
  displayNews?: boolean;
  displayProfile?: boolean;
  displayLanguage?: boolean;
  displayReports?: boolean;
  displayPayroll?: boolean;
  displayStock?: boolean;
}

/** Body de `POST /settings/language` (`SettingsLanguage` en settings.joi.ts). */
export interface SettingLanguageInput {
  /** ID de settings existentes; ausente al crear. */
  id?: number;
  /** Código de idioma (VarChar(2): 'es' | 'en'). */
  language: string;
}

/** Body de `POST /settings/display` (`SettingsDisplay` en settings.joi.ts). */
export interface SettingDisplayInput {
  /** ID de settings existentes; ausente al crear. */
  id?: number;
  displayOptions: SettingDisplayOptions;
}

/** Body de `PATCH /settings/:id` (`SettingsUpdate` en settings.joi.ts). */
export interface UpdateSettingInput {
  language?: string;
  displayOptions?: SettingDisplayOptions;
}

/** Payload de persistencia de idioma (lo que el dao escribe en Prisma). */
export interface SettingLanguageData {
  language: string;
  createdOn?: Date;
  updatedOn?: Date;
}

/** Payload de persistencia de display: flags planos + timestamps. */
export interface SettingDisplayData extends SettingDisplayOptions {
  createdOn?: Date;
  updatedOn?: Date;
}

/**
 * Payload de persistencia de `PATCH /settings/:id`.
 *
 * `setting` NO tiene una columna `displayOptions`: el modelo guarda 8 columnas
 * planas (`displayEvents`…`displayStock`). Por eso el body anidado se aplana en
 * el service antes de llegar al dao — pasar `{ displayOptions }` a
 * `prisma.settings.update` hace fallar el PATCH en runtime (la variable no
 * dispara el excess-property check del compilador).
 */
export interface PatchSettingData extends SettingDisplayOptions {
  language?: string;
}

/** Body de `POST /settings/product/categories` (`SettingsProductCategoryCreate`). */
export interface CreateProductCategoryInput {
  /** Código único de la categoría (VarChar(3)). */
  code: string;
  /** Descripción única de la categoría (VarChar(50)). */
  description: string;
}

/** Body de `PATCH /settings/product/categories/:id` (`SettingsProductCategoryUpdateSchema`). */
export interface UpdateProductCategoryInput {
  code?: string;
  description?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Query / filtros — lo que el controller extrae de `req.safeQuery`
// ─────────────────────────────────────────────────────────────────────────────

/** Filtros de `GET /settings/product/categories` (`SettingsProductCategoryFilters`). */
export interface ProductCategoryFilters {
  description?: string;
  code?: string;
  page?: number;
  limit?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Resultados de service — fronteras públicas del módulo
// ─────────────────────────────────────────────────────────────────────────────

/** Resultado paginado del listado de categorías de producto. */
export interface ProductCategoryServiceResult {
  dataList: ProductCategory[];
  total: number;
}
