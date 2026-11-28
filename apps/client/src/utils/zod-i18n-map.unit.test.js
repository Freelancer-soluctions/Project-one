import { afterEach, describe, expect, it } from 'vitest';
import i18n from '@/config/i18n';
import { getZodErrorMessage } from './zod-i18n-map';
import { EmployeeSchema } from '@/modules/employees/utils/schema';

const VALID_EMPLOYEE = {
  name: 'Ana',
  lastName: 'Pérez',
  dni: '12345678',
  email: 'ana@example.com',
  startDate: new Date('2026-01-01T00:00:00.000Z'),
  positionId: 1,
  departmentId: 1,
  salary: '1000',
};

const messageFor = (result, field) =>
  result.error.issues.find((issue) => issue.path[0] === field)?.message;

describe('mensajes de validación de zod', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en');
  });

  it('getZodErrorMessage traduce con el idioma activo en cada llamada', async () => {
    const message = getZodErrorMessage('zod.employees.position.empty');

    await i18n.changeLanguage('es');
    expect(message()).toBe('La posición es obligatoria.');

    await i18n.changeLanguage('en');
    expect(message()).toBe('Position is required.');
  });

  it('el schema retraduce sus mensajes al cambiar de idioma', async () => {
    const invalid = { ...VALID_EMPLOYEE, positionId: null };

    await i18n.changeLanguage('es');
    expect(messageFor(EmployeeSchema.safeParse(invalid), 'positionId')).toBe(
      'La posición es obligatoria.'
    );

    await i18n.changeLanguage('en');
    expect(messageFor(EmployeeSchema.safeParse(invalid), 'positionId')).toBe(
      'Position is required.'
    );
  });
});
