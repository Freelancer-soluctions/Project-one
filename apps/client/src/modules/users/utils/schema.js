import { z } from 'zod';
import { getZodMessage, getZodMinMaxMessage } from '@/utils/zod-i18n-map';

const permissionSchema = z.object({
  id: z.number(),
  code: z.string(),
  description: z.string().optional(),
  assigned: z.boolean().default(false),
});

export const UserSchema = z.object({
  user: z
    .object({
      name: z.string().min(1, {
        message: getZodMessage('zod.users.name.empty'),
      }),
      email: z
        .string()
        .email({
          message: getZodMessage('zod.users.email.invalid'),
        })
        .min(1, { message: getZodMessage('zod.users.email.empty') }),
      telephone: z.string().min(1, {
        message: getZodMessage('zod.users.telephone.empty'),
      }),
      address: z.string().optional(),
      birthday: z.union([z.date(), z.string()], {
        message: getZodMessage('zod.users.birthday.required'),
      }),
      startDate: z.union([z.date(), z.string()], {
        message: getZodMessage('zod.users.startDate.required'),
      }),

      socialSecurity: z
        .string()
        .min(9, {
          message: getZodMessage('zod.users.socialSecurity.minLength'),
        })
        .max(9, {
          message: getZodMessage('zod.users.socialSecurity.maxLength'),
        }),
      zipcode: z.string().min(5).max(9, {
        message: getZodMessage('zod.users.zipcode.invalid'),
      }),
      state: z.string().min(1, { message: getZodMessage('zod.users.state.empty') }),
      city: z.string().min(1, { message: getZodMessage('zod.users.city.empty') }),
      isAdmin: z.boolean(),
      picture: z.string().optional(),
      document: z.string().optional(),
      status: z.custom((val) => val && val.id, {
        message: getZodMessage('zod.users.status.required'),
      }),
      roles: z.custom((val) => val && val.id, {
        message: getZodMessage('zod.users.roles.required'),
      }),
    })
    .passthrough(), // Permite otros campos

  permissions: z.array(permissionSchema),
});

export const UsersFiltersSchema = z.object({
  name: z.string().optional(),
  email: z
    .string()
    .email({
      message: getZodMessage('zod.users.email.invalid'),
    })
    .optional(),
  status: z.string().optional(),
});
