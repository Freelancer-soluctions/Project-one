import { describe, expect, it } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadAndValidate, validateExceptions } from './security-exceptions.mjs';

const TODAY = '2026-11-10';

const validEntry = {
  id: 'EXC-2026-001',
  tool: 'zizmor',
  finding: 'self-repository',
  scope: '.github/workflows/ci.yml',
  reason:
    'Regla help-severity sin impacto; sintaxis $/ no soportada por actionlint.',
  owner: 'devops-team',
  created: '2026-11-01',
  expires: '2026-12-01',
  ticket: 'https://github.com/Freelancer-soluctions/Project-one/issues/1',
};

const withEntry = (overrides = {}) => ({
  exceptions: [{ ...validEntry, ...overrides }],
});

describe('validateExceptions', () => {
  it('acepta un fichero sin excepciones', () => {
    expect(validateExceptions({ exceptions: [] }, TODAY)).toEqual([]);
  });

  it('acepta una excepción válida', () => {
    expect(validateExceptions(withEntry(), TODAY)).toEqual([]);
  });

  it('acepta exactamente 90 días de vigencia', () => {
    expect(
      validateExceptions(withEntry({ expires: '2027-01-30' }), TODAY)
    ).toEqual([]);
  });

  it('rechaza una excepción vencida y nombra el id y la fecha', () => {
    const errors = validateExceptions(
      withEntry({ expires: '2026-11-09' }),
      TODAY
    );
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('EXC-2026-001');
    expect(errors[0]).toContain('2026-11-09');
  });

  it('rechaza más de 90 días y menciona el máximo', () => {
    const errors = validateExceptions(
      withEntry({ expires: '2027-02-01' }),
      TODAY
    );
    expect(errors[0]).toContain('90');
  });

  it('rechaza expires anterior a created', () => {
    const errors = validateExceptions(
      withEntry({ created: '2026-11-05', expires: '2026-11-01' }),
      TODAY
    );
    expect(errors[0]).toContain('anterior');
  });

  it('rechaza campos obligatorios ausentes o vacíos', () => {
    const { ticket, ...withoutTicket } = validEntry;
    expect(ticket).toBeTruthy();
    const errors = validateExceptions({ exceptions: [withoutTicket] }, TODAY);
    expect(errors.some((error) => error.includes('ticket'))).toBe(true);
  });

  it('rechaza fechas no ISO y fechas imposibles', () => {
    expect(
      validateExceptions(withEntry({ created: '01/11/2026' }), TODAY)[0]
    ).toContain('created');
    expect(
      validateExceptions(withEntry({ created: '2026-02-30' }), TODAY)[0]
    ).toContain('created');
  });

  it('rechaza ids duplicados', () => {
    const errors = validateExceptions(
      { exceptions: [validEntry, { ...validEntry }] },
      TODAY
    );
    expect(errors.some((error) => error.includes('duplicado'))).toBe(true);
  });

  it('rechaza un documento sin la clave exceptions', () => {
    expect(validateExceptions({}, TODAY)[0]).toContain('exceptions');
  });
});

describe('loadAndValidate', () => {
  it('informa YAML inválido con el fichero', () => {
    const dir = mkdtempSync(join(tmpdir(), 'exceptions-'));
    const file = join(dir, 'exceptions.yml');
    writeFileSync(file, 'exceptions: [\n', 'utf8');
    try {
      const errors = loadAndValidate(file, TODAY);
      expect(errors[0]).toContain('YAML inválido');
      expect(errors[0]).toContain('exceptions.yml');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('devuelve OK para el fichero versionado del repo', () => {
    expect(loadAndValidate('security/exceptions.yml')).toEqual([]);
  });
});
