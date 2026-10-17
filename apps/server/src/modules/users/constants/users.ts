export const USER_STATUS_CODE = {
  C01: 'ACTIVE' as const,
  C02: 'INACTIVE' as const,
} as const;

export type UserStatusCode = keyof typeof USER_STATUS_CODE;
