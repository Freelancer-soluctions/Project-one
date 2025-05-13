import { z } from 'zod'

export const UserSchema = z
  .object({
    name: z.string().min(1, {
      message: 'User name is required.'
    }),
    email: z.string().email({
      message: 'Invalid email format.'
    }),
    telephone: z.string().min(1, {
      message: 'Telephone is required.'
    }),
    address: z.string().optional(),
    birthday: z.string().optional(),
    startDate: z.string().optional(),
    socialSecurity: z.string().min(9).max(9,{
      message: 'Social Security must be 9 characters.'
    }),
    zipcode: z.string().min(5).max(9,{
      message: 'Zipcode must be between 5 and 9 characters.'
    }),
    state: z.string().optional(),
    city: z.string().optional(),
    isAdmin: z.boolean().optional(),
    picture: z.string().optional(),
    document: z.string().optional(),
    roleId: z.string().optional(),
    statusId: z.string().optional(),
    userPermitId: z.string().optional()
  })
  .passthrough() // Permite otros campos 

  export const UsersFiltersSchema = z.object({
    name: z.string().optional(),
    email: z.string().email({
      message: 'Invalid email format.'
    }).optional()
  })