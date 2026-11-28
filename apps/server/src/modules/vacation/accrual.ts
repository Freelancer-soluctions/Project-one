import type { TxClient } from './balance.js';

/** Días devengados por mes (1.25 ≈ 15 días/año). Política v1. */
export const ACCRUAL_RATE = 1.25;
/** Tope de días devengados por año, sin arrastre (RN-VP-013). */
export const ACCRUAL_CAP = 30;

/**
 * Cantidad a devengar dado el saldo acumulado del año: `min(rate, cap - accrued)`,
 * nunca negativa, con 2 decimales.
 */
export const accrualAmount = (currentAccrued: number): number => {
  const room = Math.max(0, ACCRUAL_CAP - currentAccrued);
  return Math.round(Math.min(ACCRUAL_RATE, room) * 100) / 100;
};

export interface AccrualResult {
  /** Empleados a los que se devengó días en este periodo. */
  accrued: number;
  /** Empleados omitidos (ya devengado en el periodo o tope alcanzado). */
  skipped: number;
}

export interface AccrueMonthlyInput {
  /** Periodo `YYYY-MM`. El año del saldo es el del periodo. */
  period: string;
  userId: number;
  now?: Date;
}

/**
 * Devengo mensual para todos los empleados dentro de una transacción.
 * Idempotente por (employeeId, period, ACCRUAL): reejecutar no duplica días.
 * Nota: no hay flag de empleado activo en el modelo; se devenga a todos los empleados.
 */
export const accrueMonthly = async (
  tx: TxClient,
  { period, userId, now = new Date() }: AccrueMonthlyInput
): Promise<AccrualResult> => {
  const year = Number(period.slice(0, 4));
  const employees = await tx.employees.findMany({ select: { id: true } });

  let accrued = 0;
  let skipped = 0;

  for (const { id: employeeId } of employees) {
    const alreadyAccrued = await tx.vacationAccrualRecord.findUnique({
      where: {
        employeeId_period_type: { employeeId, period, type: 'ACCRUAL' },
      },
    });
    if (alreadyAccrued) {
      skipped++;
      continue;
    }

    let balance = await tx.vacationBalance.findUnique({
      where: { employeeId_year: { employeeId, year } },
    });
    const current = balance ? Number(balance.accrued) : 0;
    const days = accrualAmount(current);
    if (days <= 0) {
      skipped++;
      continue;
    }

    if (!balance) {
      balance = await tx.vacationBalance.create({
        data: {
          employeeId,
          year,
          accrued: 0,
          used: 0,
          remaining: 0,
          createdOn: now,
        },
      });
    }

    await tx.vacationBalance.update({
      where: { id: balance.id },
      data: {
        accrued: { increment: days },
        remaining: { increment: days },
        updatedOn: now,
      },
    });
    await tx.vacationAccrualRecord.create({
      data: {
        employeeId,
        period,
        days,
        type: 'ACCRUAL',
        createdOn: now,
        createdBy: userId,
      },
    });
    accrued++;
  }

  return { accrued, skipped };
};
