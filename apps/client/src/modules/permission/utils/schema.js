import { z } from 'zod'

// Define enums based on your backend Joi schemas or Prisma enums
const PermissionTypeEnum = z.enum(['SICK', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'OTHER'])
const PermissionStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED'])

export const PermissionSchema = z
  .object({
    employeeId: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z.number({ required_error: 'Employee is required.' }).int().positive('Employee must be selected.')
    ),
    type: PermissionTypeEnum.refine((val) => val !== undefined, {
      message: "Permission type is required.",
    }),
    startDate: z.date({
      required_error: 'Start date is required.'
    }),
    endDate: z.date({
      required_error: 'End date is required.'
    }),
    reason: z.string().min(1, 'Reason is required.').max(500, 'Reason cannot exceed 500 characters.'),
    status: PermissionStatusEnum.default('PENDING'), // Default to PENDING
    // approvedBy: z.number().int().optional(), // Not typically set via form
    // approvedAt: z.date().optional(), // Not typically set via form
    comments: z.string().max(1000, 'Comments cannot exceed 1000 characters.').optional(),
  })

  .passthrough() // Allows other fields not defined in the schema 