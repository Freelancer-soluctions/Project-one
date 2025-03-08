
import { z } from "zod";



export const ProductsSchema = z.object({
  sku: z.string().max(16).nonempty("El SKU es obligatorio"),
  name: z.string().max(80, "El nombre no puede tener más de 80 caracteres").nonempty("El nombre es obligatorio"),
  category: z.custom((val) => val && val.id, {
    message: "Debe seleccionar una categoría",
  }),
  status: z.custom((val) => val && val.id, {
    message: "Debe seleccionar un estado",
  }),
  provider: z.custom((val) => val && val.id, {
    message: "Debe seleccionar un provider",
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

  stock: z.coerce
  .number({ invalid_type_error: "El stock debe ser un número" }) // Asegura que sea un número
  .min(0, "El stock no puede ser negativo"), // No permite valores negativos

}).passthrough();




const attributeSchema = z.object({
  createdOn: z.date().or(z.string().transform((val) => new Date(val))), // Fecha válida
  name: z
    .string()
    .min(1, "El nombre es obligatorio")
    .max(50, "El nombre no puede superar los 50 caracteres"),
  description: z
    .string()
    .min(1, "La descripción es obligatoria")
    .max(100, "La descripción no puede superar los 100 caracteres")
    , // Puede estar vacío
  save: z.boolean().optional(), // `save` es opcional
}).passthrough();

export const attributesSchema = z.object({
  attributes: z.array(attributeSchema).min(1, "Debe haber al menos un atributo"),
});