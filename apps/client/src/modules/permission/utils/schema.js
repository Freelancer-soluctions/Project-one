import { z } from 'zod';
import { getZodErrorMessage } from '@/utils/zod-i18n-map';

// Define enums based on your backend Joi schemas or Prisma enums
const PermissionTypeEnum = z.enum([
  'SICK',
  'PERSONAL',
  'MATERNITY',
  'PATERNITY',
  'OTHER',
]);
const PermissionStatusEnum = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
]);

export const PermissionSchema = z
  .object({
    employeeId: z.preprocess(
      (val) => (val === '' ? undefined : Number(val)),
      z
        .number({
          error: getZodErrorMessage('zod.permission.employeeId.required'),
        })
        .int()
        .positive({
          error: getZodErrorMessage('zod.permission.employeeId.positive'),
        })
    ),
    type: PermissionTypeEnum.refine((val) => val !== undefined, {
      error: getZodErrorMessage('zod.permission.type.required'),
    }),
    startDate: z.date({
      error: getZodErrorMessage('zod.permission.startDate.required'),
    }),
    endDate: z.date({
      error: getZodErrorMessage('zod.permission.endDate.required'),
    }),
    reason: z
      .string()
      .min(1, { error: getZodErrorMessage('zod.permission.reason.empty') })
      .max(500, {
        error: getZodErrorMessage('zod.permission.reason.maxLength'),
      }),
    status: PermissionStatusEnum.default('PENDING'), // Default to PENDING
    // approvedBy: z.number().int().optional(), // Not typically set via form
    // approvedAt: z.date().optional(), // Not typically set via form
    comments: z
      .string()
      .max(1000, {
        error: getZodErrorMessage('zod.permission.comments.maxLength'),
      })
      .optional(),
    paid: z.boolean().default(true),
  })

  .passthrough(); // Allows other fields not defined in the schema
