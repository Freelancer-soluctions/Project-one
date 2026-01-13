import { z } from 'zod';

export const ClientSchema = z
  .object({
    name: z.string().min(1, {
      message: 'Client name is required.',
    }),
    email: z.string().email({
      message: 'Invalid email format.',
    }),
    phone: z.string().min(1, {
      message: 'Phone number is required.',
    }),
    address: z.string().min(1, {
      message: 'Address is required.',
    }),
  })
  .passthrough(); // Permite otros campos

export const ClientsFiltersSchema = z.object({
  name: z.string().optional(),
  email: z
    .string()
    .email({
      message: 'Invalid email format.',
    })
    .optional(),
});
