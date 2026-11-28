import { countVacationDays } from '../vacation/balance.js';

/** Rango de un periodo de nómina `YYYY-MM` en UTC (primer y último día, inclusive). */
export const periodBounds = (period: string): { start: Date; end: Date } => {
  const [yearPart, monthPart] = period.split('-');
  const year = Number(yearPart);
  const month = Number(monthPart); // 1-12
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0)); // día 0 del mes siguiente = último día
  return { start, end };
};

export interface LeaveRange {
  startDate: Date;
  endDate: Date;
}

export interface UnpaidLeaveDeduction {
  unpaidDays: number;
  deduction: number;
}

/**
 * Descuento por permisos no retribuidos aprobados dentro del periodo.
 *
 * Fórmula v1: `deduction = round2(baseSalary / 30 × unpaidDays)`, donde `unpaidDays`
 * son los días naturales de cada permiso que caen dentro del periodo (base comercial
 * de 30 días). Los permisos aprobados no deben solaparse entre sí.
 */
export const computeUnpaidLeaveDeduction = (
  baseSalary: number,
  period: string,
  leaves: LeaveRange[]
): UnpaidLeaveDeduction => {
  const { start, end } = periodBounds(period);

  let unpaidDays = 0;
  for (const leave of leaves) {
    const from = leave.startDate > start ? leave.startDate : start;
    const to = leave.endDate < end ? leave.endDate : end;
    if (from <= to) {
      unpaidDays += countVacationDays(from, to);
    }
  }

  const deduction = Math.round((baseSalary / 30) * unpaidDays * 100) / 100;
  return { unpaidDays, deduction };
};
