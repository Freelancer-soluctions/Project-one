import { z } from 'zod';
import { getZodMessage } from '@/utils/zod-i18n-map';

export const ClientSchema = z
  .object({
    name: z.string().min(1, {
      message: getZodMessage('zod.clients.name.empty'),
    }),
    email: z.string().email({
      message: getZodMessage('zod.clients.email.invalid'),
    }),
    phone: z.string().min(1, {
      message: getZodMessage('zod.clients.phone.empty'),
    }),
    address: z.string().min(1, {
      message: getZodMessage('zod.clients.address.empty'),
    }),
  })
  .passthrough(); // Permite otros campos

export const ClientsFiltersSchema = z.object({
  name: z.string().optional(),
  email: z
    .string()
    .email({
      message: getZodMessage('zod.clients.email.invalid'),
    })
    .optional(),
});
