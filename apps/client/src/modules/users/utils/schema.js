import { z } from 'zod';

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
        message: 'User name is required.',
      }),
      email: z
        .string()
        .email({
          message: 'Invalid email format.',
        })
        .min(1, { message: 'User email is required.' }),
      telephone: z.string().min(1, {
        message: 'Telephone is required.',
      }),
      address: z.string().optional(),
      birthday: z.union([z.date(), z.string()], {
        message: 'Birthday date is required.',
      }),
      startDate: z.union([z.date(), z.string()], {
        message: 'Start date is required.',
      }),

      socialSecurity: z
        .string()
        .min(9, {
          message: 'Social Security must be 9 characters.',
        })
        .max(9, {
          message: 'Social Security must be 9 characters.',
        }),
      zipcode: z.string().min(5).max(9, {
        message: 'Zipcode must be between 5 and 9 characters.',
      }),
      state: z.string().min(1, { message: 'State is required' }),
      city: z.string().min(1, { message: 'City is required' }),
      isAdmin: z.boolean(),
      picture: z.string().optional(),
      document: z.string().optional(),
      status: z.custom((val) => val && val.id, {
        message: 'Status is required',
      }),
      roles: z.custom((val) => val && val.id, {
        message: 'Role is required',
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
      message: 'Invalid email format.',
    })
    .optional(),
  status: z.string().optional(),
});
