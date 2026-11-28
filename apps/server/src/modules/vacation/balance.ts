import type { Prisma } from '@prisma/client';
import ClientError from '../../utils/responses&Errors/errors.js';

/** Cliente transaccional de Prisma (solo se usa dentro de `$transaction`). */
export type TxClient = Prisma.TransactionClient;

interface BalanceRow {
  id: number;
  remaining: Prisma.Decimal | number | string;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Días de vacaciones inclusivos (inicio y fin cuentan). Se calcula sobre la fecha
 * UTC de cada extremo para no depender de la zona horaria del servidor.
 *
 * Nota: se cuentan días corridos, no hábiles (política v1).
 */
export const countVacationDays = (start: Date, end: Date): number => {
  const startUtc = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate()
  );
  const endUtc = Date.UTC(
    end.getUTCFullYear(),
    end.getUTCMonth(),
    end.getUTCDate()
  );
  return Math.round((endUtc - startUtc) / MS_PER_DAY) + 1;
};

/**
 * Bloquea (FOR UPDATE) el saldo del empleado para el año de inicio del permiso.
 * El bloqueo serializa aprobaciones concurrentes sobre el mismo saldo (R1).
 */
const lockBalance = async (
  tx: TxClient,
  employeeId: number,
  year: number
): Promise<BalanceRow | undefined> => {
  const rows = await tx.$queryRaw<BalanceRow[]>`
    SELECT id, remaining FROM "vacationBalance"
    WHERE "employeeId" = ${employeeId} AND year = ${year}
    FOR UPDATE
  `;
  return rows[0];
};

/**
 * Descuenta los días del permiso del saldo del empleado. Debe ejecutarse dentro de
 * una transacción. Lanza 400 si no hay saldo suficiente (RN-VP-006).
 *
 * @returns Días descontados.
 */
export const deductVacationBalance = async (
  tx: TxClient,
  employeeId: number,
  startDate: Date,
  endDate: Date
): Promise<number> => {
  const days = countVacationDays(startDate, endDate);
  const balance = await lockBalance(tx, employeeId, startDate.getUTCFullYear());

  if (!balance || Number(balance.remaining) < days) {
    throw new ClientError('Insufficient vacation balance', 400);
  }

  await tx.vacationBalance.update({
    where: { id: balance.id },
    data: {
      used: { increment: days },
      remaining: { decrement: days },
      updatedOn: new Date(),
    },
  });
  return days;
};

/**
 * Devuelve al saldo los días de un permiso previamente aprobado (RN-VP-008).
 * Si no existe fila de saldo para el año, no hace nada.
 */
export const restoreVacationBalance = async (
  tx: TxClient,
  employeeId: number,
  startDate: Date,
  endDate: Date
): Promise<void> => {
  const days = countVacationDays(startDate, endDate);
  const balance = await lockBalance(tx, employeeId, startDate.getUTCFullYear());
  if (!balance) return;

  await tx.vacationBalance.update({
    where: { id: balance.id },
    data: {
      used: { decrement: days },
      remaining: { increment: days },
      updatedOn: new Date(),
    },
  });
};
