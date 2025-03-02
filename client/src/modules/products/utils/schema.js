
import { z } from "zod";

// export const ProductsSchema = z.object({
//   sku: z.string().max(16, "El SKU no puede tener más de 16 caracteres").nonempty(),
//   name: z.string().max(80, "El nombre no puede tener más de 80 caracteres").nonempty(),
//   category: z.number().int().nonnegative(),
//   type: z.number().int().nonnegative(),
//   price: z.number().positive().multipleOf(0.01),
//   cost: z.number().positive().multipleOf(0.01),
//   stock: z.number().int().min(0, "El stock no puede ser negativo"),
//   description: z.string().max(2000, "La descripción no puede superar los 2000 caracteres").nullable().optional(),
//   status:  z.number().int().nonnegative(),
//   barCode: z.string().max(25, "El código de barras no puede tener más de 25 caracteres").nullable().optional(),
// });

export const ProductsSchema = z.object({
  sku: z.string().max(16).nonempty("El SKU es obligatorio"),
  name: z.string().max(80, "El nombre no puede tener más de 80 caracteres").nonempty("El nombre es obligatorio"),
  // category: z.number({ required_error: "La categoría es obligatoria" })
  //   .int(),

  type: z.number({ required_error: "El tipo de producto es obligatorio" })
    .int(),
  price: z.number({ required_error: "El precio es obligatorio" })
    .positive("El precio debe ser un número positivo")
    .multipleOf(0.01, "El precio debe tener dos decimales"),
  cost: z.number({ required_error: "El costo es obligatorio" })
    .positive("El costo debe ser un número positivo")
    .multipleOf(0.01, "El costo debe tener dos decimales"),
  stock: z.number({ required_error: "El stock es obligatorio" })
    .int("El stock debe ser un número entero")
    .min(0, "El stock no puede ser negativo"),

  status: z.number({ required_error: "El estado del producto es obligatorio" })
    .int("El estado debe ser un número entero")
    .nonnegative("El estado no puede ser negativo"),

});