
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

