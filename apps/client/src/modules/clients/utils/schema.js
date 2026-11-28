import { z } from 'zod';
import { getZodErrorMessage } from '@/utils/zod-i18n-map';

export const ClientSchema = z
  .object({
    name: z.string().min(1, {
      error: getZodErrorMessage('zod.clients.name.empty'),
    }),
    email: z.string().email({
      error: getZodErrorMessage('zod.clients.email.invalid'),
    }),
    phone: z.string().min(1, {
      error: getZodErrorMessage('zod.clients.phone.empty'),
    }),
    address: z.string().min(1, {
      error: getZodErrorMessage('zod.clients.address.empty'),
    }),
  })
  .passthrough(); // Permite otros campos

export const ClientsFiltersSchema = z.object({
  name: z.string().optional(),
  email: z
    .string()
    .email({
      error: getZodErrorMessage('zod.clients.email.invalid'),
    })
    .optional(),
});
