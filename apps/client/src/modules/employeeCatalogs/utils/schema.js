import { z } from 'zod';
import { getZodErrorMessage } from '@/utils/zod-i18n-map';

/** Catálogo de puestos/departamentos: code (VarChar 20) + name (VarChar 100). */
export const EmployeeCatalogSchema = z
  .object({
    code: z
      .string()
      .min(1, {
        error: getZodErrorMessage('zod.employeeCatalogs.code.empty'),
      })
      .max(20, {
        error: getZodErrorMessage('zod.employeeCatalogs.code.maxLength'),
      }),
    name: z
      .string()
      .min(1, {
        error: getZodErrorMessage('zod.employeeCatalogs.name.empty'),
      })
      .max(100, {
        error: getZodErrorMessage('zod.employeeCatalogs.name.maxLength'),
      }),
    active: z.boolean({
      error: getZodErrorMessage('zod.employeeCatalogs.active.required'),
    }),
  })
  .passthrough();

/** Filtros del listado: el select de estado usa 'all' | 'true' | 'false'. */
export const EmployeeCatalogFiltersSchema = z.object({
  code: z.string().optional(),
  name: z.string().optional(),
  active: z.enum(['all', 'true', 'false']).optional(),
});
