import { z } from 'zod';
import { getZodMessage } from '@/utils/zod-i18n-map';

// Define enums based on your backend Joi schemas or Prisma enums
const PermissionTypeEnum = z.enum([
  'SICK',
  'PERSONAL',
  'MATERNITY',
  'PATERNITY',
  'OTHER',
]);
const PermissionStatusEnum = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

export const PermissionSchema = z
  .object({
    employeeId: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({ required_error: getZodMessage('zod.permission.employeeId.required') })
        .int()
        .positive(getZodMessage('zod.permission.employeeId.positive'))
    ),
    type: PermissionTypeEnum.refine((val) => val !== undefined, {
      message: getZodMessage('zod.permission.type.required'),
    }),
    startDate: z.date({
      required_error: getZodMessage('zod.permission.startDate.required'),
    }),
    endDate: z.date({
      required_error: getZodMessage('zod.permission.endDate.required'),
    }),
    reason: z
      .string()
      .min(1, getZodMessage('zod.permission.reason.empty'))
      .max(500, getZodMessage('zod.permission.reason.maxLength')),
    status: PermissionStatusEnum.default('PENDING'), // Default to PENDING
    // approvedBy: z.number().int().optional(), // Not typically set via form
    // approvedAt: z.date().optional(), // Not typically set via form
    comments: z
      .string()
      .max(1000, getZodMessage('zod.permission.comments.maxLength'))
      .optional(),
  })

  .passthrough(); // Allows other fields not defined in the schema
