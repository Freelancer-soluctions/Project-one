import { describe, it, expect } from 'vitest';
import { auditWorkflowText } from './toolchain-audit.mjs';

// Change ci-mise-toolchain-parity (task 2.7): auditoría grep-based de workflows.
// Una herramienta de lint/seguridad gestionada por Mise NO puede ejecutarse vía
// docker://, docker run ni uvx: debe resolverse con `mise exec -- <tool>`.

describe('toolchain-audit — detecta invocaciones fuera de Mise', () => {
  it('marca `uses: docker://` de una herramienta gestionada por Mise', () => {
    const text = [
      'steps:',
      '  - name: Gitleaks',
      '    uses: docker://zricethezav/gitleaks:v8.30.1',
    ].join('\n');
    const v = auditWorkflowText('release.yml', text);
    expect(v).toHaveLength(1);
    expect(v[0]).toMatchObject({
      file: 'release.yml',
      line: 3,
      rule: 'docker-uses',
    });
  });

  it('marca `uvx` para zizmor (sustituido por mise exec)', () => {
    const text =
      '      run: uvx zizmor@1.30.1 --format=sarif .github/workflows/';
    const v = auditWorkflowText('scheduled-security.yml', text);
    expect(v.map((x) => x.rule)).toEqual(['uvx']);
  });

  it('marca `docker run` de una imagen de herramienta gestionada por Mise', () => {
    const text =
      '          docker run --rm -v "$PWD":/io bridgecrew/checkov:3 --directory /io';
    const v = auditWorkflowText('scheduled-security.yml', text);
    expect(v.map((x) => x.rule)).toEqual(['docker-run-tool']);
  });

  it('marca `uses:` de action de herramienta gestionada por Mise (p. ej. checkov-action)', () => {
    const text = '      - uses: bridgecrewio/checkov-action@v12';
    const v = auditWorkflowText('ci.yml', text);
    expect(v.map((x) => x.rule)).toEqual(['tool-action']);
  });
});

describe('toolchain-audit — no marca lo correcto', () => {
  it('acepta `mise exec -- <tool>`', () => {
    const text = '          mise exec -- gitleaks git --redact --verbose';
    expect(auditWorkflowText('ci.yml', text)).toEqual([]);
  });

  it('ignora líneas de comentario que mencionan la migración', () => {
    const text = [
      '  # Migrado de docker://zricethezav/gitleaks:v8.30.1 al binario de mise',
      '        # antes uvx zizmor@1.30.1',
    ].join('\n');
    expect(auditWorkflowText('ci.yml', text)).toEqual([]);
  });

  it('acepta docker run de una imagen que NO es herramienta de Mise (playwright, nginx)', () => {
    const text =
      '          docker run -d --name nginx-smoke -p 8080:80 nginx:alpine';
    expect(auditWorkflowText('build.yml', text)).toEqual([]);
  });

  it('acepta gitleaks-action (excepción documentada: licencia opcional)', () => {
    const text =
      '      - uses: gitleaks/gitleaks-action@e0c47f4f8be36e29cdc102c57e68cb5cbf0e8d1e # v3';
    expect(auditWorkflowText('ci.yml', text)).toEqual([]);
  });
});
