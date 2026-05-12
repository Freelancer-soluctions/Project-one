import { z } from 'zod';
import { getZodMessage, getZodMinMaxMessage } from '@/utils/zod-i18n-map';

export const ProductsSchema = z
  .object({
    sku: z.string().max(16).min(1, {
      message: getZodMessage('zod.products.sku.empty'),
      path: ['sku']
    }),
    name: z
      .string()
      .max(80, {
        message: getZodMessage('zod.products.name.maxLength'),
        path: ['name']
      })
      .min(1, {
        message: getZodMessage('zod.products.name.empty'),
        path: ['name']
      }),
    category: z.custom((val) => val && val.id, {
      message: getZodMessage('zod.products.category.required'),
    }),
    status: z.custom((val) => val && val.id, {
      message: getZodMessage('zod.products.status.required'),
    }),
    provider: z.custom((val) => val && val.id, {
      message: getZodMessage('zod.products.provider.required'),
    }),
    price: z
      .string()
      .min(1, {
        message: getZodMessage('zod.products.price.empty'),
        path: ['price']
      })
      .transform((val) => Number(val))
      .pipe(
        z
          .number()
          .positive(getZodMessage('zod.products.price.positive'))
          .multipleOf(0.01, getZodMessage('zod.products.price.multipleOf'))
      ),
    cost: z
      .string()
      .min(1, {
        message: getZodMessage('zod.products.cost.empty'),
        path: ['cost']
      })
      .transform((val) => Number(val))
      .pipe(
        z
          .number()
          .positive(getZodMessage('zod.products.cost.positive'))
          .multipleOf(0.01, getZodMessage('zod.products.cost.multipleOf'))
      ),
  })
  .passthrough();

const attributeSchema = z
  .object({
    createdOn: z.date().or(z.string().transform((val) => new Date(val))), // Fecha válida
    name: z
      .string()
      .min(1, {
        message: getZodMessage('zod.products.attributes.name.empty'),
        path: ['name']
      })
      .max(50, {
        message: getZodMessage('zod.products.attributes.name.maxLength'),
        path: ['name']
      }),
    description: z
      .string()
      .min(1, {
        message: getZodMessage('zod.products.attributes.description.empty'),
        path: ['description']
      })
      .max(100, {
        message: getZodMessage('zod.products.attributes.description.maxLength'),
        path: ['description']
      }), // Puede estar vacío
    save: z.boolean().optional(), // `save` es opcional
  })
  .passthrough();

export const attributesSchema = z.object({
  attributes: z
    .array(attributeSchema)
    .min(1, {
  message: getZodMessage('zod.products.attributes.minItems'),
  path: ['attributes']
}),
});
