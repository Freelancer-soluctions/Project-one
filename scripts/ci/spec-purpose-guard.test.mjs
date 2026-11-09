import { describe, expect, it } from 'vitest';
import {
  evaluateSpec,
  extractPurpose,
  findMissingReferences,
} from './spec-purpose-guard.mjs';

const spec = (purpose) =>
  `# x Specification\n\n## Purpose\n\n${purpose}\n\n## Requirements\n\n### Requirement: y\n\nz\n`;

describe('spec-purpose-guard', () => {
  it('extracts the Purpose body up to the next level-2 heading', () => {
    expect(extractPurpose(spec('Hace algo concreto y verificable.'))).toBe(
      'Hace algo concreto y verificable.'
    );
    expect(
      extractPurpose(
        '# x\n\n## Purpose\n\nlinea uno\nlinea dos\n\n## Requirements\n'
      )
    ).toBe('linea uno linea dos');
  });

  it('returns null when the section is missing', () => {
    expect(
      extractPurpose('# x\n\n## Requirements\n\n### Requirement: y\n')
    ).toBe(null);
  });

  it('rejects the placeholder text written by openspec archive', () => {
    const result = evaluateSpec({
      id: 'foo',
      markdown: spec(
        'TBD - created by archiving change coverage-merge-gate-hardening. Update Purpose after archive.'
      ),
    });

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatch(/placeholder/);
  });

  it('rejects a bare marker or a stub', () => {
    expect(
      evaluateSpec({ id: 'foo', markdown: spec('TODO') }).errors
    ).toHaveLength(1);
    expect(
      evaluateSpec({ id: 'foo', markdown: spec('Describe aqui.') }).errors[0]
    ).toMatch(/stub/);
  });

  it('rejects a spec with no Purpose section at all', () => {
    const result = evaluateSpec({
      id: 'foo',
      markdown: '# x\n\n## Requirements\n\n### Requirement: y\n\nz\n',
    });

    expect(result.errors[0]).toMatch(/falta la sección/);
  });

  it('accepts a real purpose and only warns when it is short', () => {
    const long = evaluateSpec({
      id: 'foo',
      markdown: spec(
        'Endurece el veredicto del gate de cobertura fusionada: el agregador falla ante jobs cancelados y distingue el skip esperado del inesperado.'
      ),
    });
    expect(long.errors).toHaveLength(0);
    expect(long.warnings).toHaveLength(0);

    const short = evaluateSpec({
      id: 'bar',
      markdown: spec(
        'Enruta mensajes a salas personales por usuario, con auto-limpieza al desconectar.'
      ),
    });
    expect(short.errors).toHaveLength(0);
    expect(short.warnings).toHaveLength(1);
  });

  it('flags repo paths that no longer exist', () => {
    const exists = (token) => token === 'apps/client/vitest.config.js';
    expect(
      findMissingReferences(
        'Configura entry y project en el único `knip.json` del monorepo.',
        exists
      )
    ).toEqual(['knip.json']);
    expect(
      findMissingReferences(
        'Lee la config de `apps/client/vitest.config.js` y aplica el gate.',
        exists
      )
    ).toEqual([]);
  });

  it('resolves bare workflow names against .github/workflows', () => {
    expect(
      findMissingReferences('Corre en `ci.yml` y `no-existe.yml`.')
    ).toEqual(['no-existe.yml']);
  });

  it('exempts references framed as retired or deleted', () => {
    expect(
      findMissingReferences(
        'Registra la retirada de `ci-enterprise.yml` del inventario.'
      )
    ).toEqual([]);
    expect(
      findMissingReferences(
        'Elimina los workflows zombie (`pr-validation.yml`, `lint.yml`).'
      )
    ).toEqual([]);
  });

  it('ignores tokens that are not repo paths', () => {
    expect(
      findMissingReferences(
        'Compara `origin/main` con el comando `vitest run --changed origin/main` y `actions/cache@v5`.'
      )
    ).toEqual([]);
  });

  it('does not mistake Spanish "todo" for a TODO marker', () => {
    const result = evaluateSpec({
      id: 'foo',
      markdown: spec(
        'Aplica a todo el pipeline un unico punto de entrada y documenta cada paso del recorrido completo.'
      ),
    });
    expect(result.errors).toHaveLength(0);
  });
});
