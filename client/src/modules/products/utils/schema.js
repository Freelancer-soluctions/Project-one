
import { z } from "zod";



export const ProductsSchema = z.object({
  sku: z.string().max(16).nonempty("El SKU es obligatorio"),
  name: z.string().max(80, "El nombre no puede tener más de 80 caracteres").nonempty("El nombre es obligatorio"),
  // category: z.number({ required_error: "La categoría es obligatoria" })
  //   .int(),

  // type: z.number({ required_error: "El tipo de producto es obligatorio" })
  //   .int(),
  category: z
  .object({
    id: z.number(), // No validación de mínimo o máximo
    code: z.string(), // No validación de longitud mínima
    description: z.string(), // No validación de longitud mínima
  }),
  type: z
  .object({
    id: z.number(), // No validación de mínimo o máximo
    code: z.string(), // No validación de longitud mínima
    description: z.string(), // No validación de longitud mínima
  }),
  status: z
  .object({
    id: z.number(), // No validación de mínimo o máximo
    code: z.string(), // No validación de longitud mínima
    description: z.string(), // No validación de longitud mínima
  }),
  price: z
  .string()
  .min(1, "El precio es obligatorio")
  .transform((val) => Number(val))
  .pipe(
    z.number()
      .positive("El precio debe ser un número positivo")
      .multipleOf(0.01, "El precio debe tener dos decimales")
  ),
  cost:z
  .string()
  .min(1, "El precio es obligatorio")
  .transform((val) => Number(val))
  .pipe(
    z.number()
      .positive("El precio debe ser un número positivo")
      .multipleOf(0.01, "El precio debe tener dos decimales")
  ),
  stock: z
  .string()
  .min(1, "El stock es obligatorio")
  .transform((val) => Number(val))
  .pipe(z.number().int().min(0, "El stock no puede ser negativo")),
  // stock: 
  // z.number({ required_error: "El stock es obligatorio" })
  //   .int("El stock debe ser un número entero")
  //   .min(0, "El stock no puede ser negativo"),

  // status: z.number({ required_error: "El estado del producto es obligatorio" })
  //   .int("El estado debe ser un número entero")
  //   .nonnegative("El estado no puede ser negativo"),

}).passthrough();