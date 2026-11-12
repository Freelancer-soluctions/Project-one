# Registro de excepciones de calidad (EX-3)

> Toda supresión de un gate de calidad entra aquí con **motivo, responsable y
> caducidad** (capability `quality-governance`, change
> `ci-quality-gates-blocking-hardening`). Una excepción sin entrada es deuda
> invisible; una entrada vencida es un fallo del gate correspondiente.
> Última revisión: 2026-11-12.

## 1. Plantilla EX-3

Copia este bloque al añadir una excepción. El PR que la introduce no mezcla
otros cambios (EX-2) y lo revisa el owner de `.github/CODEOWNERS` del artefacto
afectado.

```markdown
### EX-NNN — <título corto>

| Campo          | Valor                                                                      |
| -------------- | -------------------------------------------------------------------------- |
| Artefacto      | `<ruta>` (baseline / allowlist / eslint-disable / security/exceptions.yml) |
| Gate           | `<job id>`                                                                 |
| Motivo         | Por qué la supresión es necesaria y qué la haría innecesaria               |
| Responsable    | `@usuario` o equipo                                                        |
| Caducidad      | `AAAA-MM-DD` (máximo 90 días para seguridad)                               |
| Referencia     | Issue/PR que justifica la excepción                                        |
| Plan de salida | Acción concreta y fecha para eliminar la excepción                         |
```

Reglas:

1. **Una excepción por PR** (EX-2) y con issue vinculado.
2. La caducidad es una fecha real, no "hasta nuevo aviso".
3. Al vencer: se elimina la supresión en el siguiente PR o el gate falla. Las
   excepciones de seguridad las valida `security-exceptions-check` contra
   `security/exceptions.yml` (`expires <= created + 90`).
4. El responsable poda su entrada al resolver la causa raíz; nunca se "renueva
   por inercia" sin re-evaluar.

## 2. Registro vigente

| ID     | Artefacto                                                   | Gate                                            | Motivo                                                                                                                                                                             | Responsable                          | Caducidad                           | Referencia                                                      |
| ------ | ----------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------- | --------------------------------------------------------------- |
| EX-001 | `.dependency-cruiser-known-violations.json`                 | `client-import-bounds` / `server-import-bounds` | Deuda de arquitectura preexistente congelada para que el gate bloquee solo violaciones nuevas; el baseline se poda al refactorizar                                                 | `@Freelancer-soluctions/architects`  | 2027-01-31                          | change `import-boundaries`                                      |
| EX-002 | `knip.jsonc` (`ignore`/`ignoreDependencies`/`ignoreIssues`) | `client-dead-code` / `server-dead-code`         | Falsos positivos de knip en entrypoints, plugins y tipos de build; cada entrada documentada en el propio config                                                                    | `@Freelancer-soluctions/devops-team` | 2027-01-31                          | change `ci-dead-code-advisory-calibration`                      |
| EX-003 | `.markdownlintignore`                                       | `docs-validation` (advisory)                    | Grandfathering del inventario legacy de docs al adoptar markdownlint; cada fichero sale de la lista al normalizarse                                                                | `@Freelancer-soluctions/core-team`   | 2027-03-31                          | `docs-changelog-validation`                                     |
| EX-004 | `security/exceptions.yml`                                   | `security-exceptions-check`                     | Excepciones de seguridad con caducidad ≤ 90 días; registro canónico y validado por el job                                                                                          | `@Freelancer-soluctions/devops-team` | por entrada (≤ 90 días)             | change `security-exceptions-policy`                             |
| EX-005 | `manifest-allowlist.json`                                   | `root-manifest-guard`                           | Mecanismo de excepción del manifest raíz; hoy vacío (`allow: []`)                                                                                                                  | `@Freelancer-soluctions/devops-team` | 2027-01-31                          | change `ci-quality-gates-blocking-hardening`                    |
| EX-006 | Supresiones `eslint-disable` puntuales                      | `*-lint`                                        | Solo si la regla no aplica al caso y no hay forma de acotarla por `files`/`ignores`; la descripción del `eslint-disable` es obligatoria (`reportUnusedDisableDirectives: 'error'`) | autor del PR                         | caducidad indicada en el comentario | `eslint-suppressions.json` cuando se active la supresión masiva |

## 3. Cómo auditar el registro

```bash
# Excepciones de seguridad vencidas (el job las bloquea)
npm run test:scripts -- scripts/ci/security-exceptions.test.mjs

# Tamaño del baseline de import boundaries (solo debe bajar)
node -e "const f=require('./.dependency-cruiser-known-violations.json');console.log('baseline:',f.length,'entradas')"

# Allowlist del manifest raíz (schema + auditoría)
npm run check:manifest
```
