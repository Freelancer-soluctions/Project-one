# Spec Delta

> **Delta sobre `openspec/specs/pre-commit-lint-staged/spec.md` (33 líneas leídas, 2 requirements).** Solo cambia
> `### Requirement: lint-staged runs in pre-commit` (spec original líneas **9-23**), copiado aquí con su bloque
> completo y sus dos scenarios con los títulos intactos. El otro requirement, `### Requirement: Cross-platform
lint-staged execution` (líneas **25-33**), **no cambia** y por eso no se repite: la invocación
> `npm exec lint-staged` y el shebang `#!/usr/bin/env sh` se conservan tal cual. El `## Purpose` de la capability
> menciona "before the existing SAST and secret scanning checks" y queda desactualizado: según la instrucción del
> CLI, un delta sobre una capability existente **no lleva `## Purpose`** (se ignora), así que su corrección se
> registra como tarea explícita de documentación en `tasks.md` (edición directa de
> `openspec/specs/pre-commit-lint-staged/spec.md`).
>
> **Qué cambia y por qué.** El bloque bloqueante del hook pasa de `lint-staged` → `SAST` + `secrets` en paralelo a
> `lint-staged` → `secrets` staged, y después las capas advisory. SAST sale del `pre-commit` (capability
> `sast-diff-scanning` lo reubica en `pre-push`, donde existe un baseline con el que hacer el escaneo
> diff-scoped); el escaneo de secretos, en cambio, se queda porque un secreto commiteado obliga a reescribir
> historia. El paralelismo desaparece porque queda un único scan bloqueante de esa clase.

## MODIFIED Requirements

### Requirement: lint-staged runs in pre-commit

The `.husky/pre-commit` hook SHALL execute `npm exec lint-staged` at the start, before the staged secret scan (SAST
no longer runs in this hook — it moved to `pre-push`). `lint-staged` remains the first blocking stage of the
hook.

#### Scenario: Pre-commit invokes lint-staged

- **WHEN** a commit is created
- **THEN** `.husky/pre-commit` runs `npm exec lint-staged` first
- **AND** ESLint + Prettier autofix is applied to staged files before the staged secret scan runs
- **AND** no Semgrep process is started by this hook

#### Scenario: lint-staged failure blocks commit

- **WHEN** `npm exec lint-staged` fails
- **THEN** the pre-commit hook exits non-zero
- **AND** the commit is blocked
