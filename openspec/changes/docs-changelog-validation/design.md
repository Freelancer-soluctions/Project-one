# Design

## Context

La motivación y el inventario de investigación están en `docs/learning/docs-changelog-validation.md` (ver proposal.md - Why). Estado relevante:

- `docs/changelog.md` (129 líneas, Keep-a-Changelog, tablas con pipes) existe; **no hay `CHANGELOG.md` en la raíz** — cualquier glob `'CHANGELOG.md'` en scripts o CI fallaría o pass over el archivo real.
- `package.json`: `lint-staged` = `prettier --write` sobre `*.{...,md}` + `eslint --fix` sobre JS; sin scripts `docs:*`; sin `markdownlint-cli`.
- `ci.yml`: substage 2B (línea ~421) con jobs `needs: repo-discovery`; agregador `prebuild-quality-complete` con lista `needs` explícita (14 jobs); `zombie-workflow-guard` prohíbe workflows sueltos.
- Prettier ya formatea `.md` con `proseWrap: preserve` → no choca con `MD013` (que pasa a ser la única validación de longitud de párrafos).

## Goals / Non-Goals

**Goals:**

- Una sola fuente de verdad por herramienta: `.markdownlint.json` (estructura) y `.vale.ini` (prosa), usada igual en local, pre-commit y CI.
- Shifting-left: `lint-staged` valida Markdown staged antes del push; CI puerta en PR.
- Zero workflow suelto: todo dentro de `ci.yml`.

**Non-Goals:**

- Reformatear docs existentes (solo se corrige lo que el gate exija).
- Validar código fuente (ya cubierto por ESLint/Prettier) ni prose en inglés con paquetes `Google`/`Microsoft` (anglocéntricos).
- Publicar vale como devDep npm (paquete huérfano desde 2023).

## Decisions

### D1 — Config en un solo archivo: `.markdownlint.json` + `.vale.ini` en raíz

`.markdownlint.json` con `default: true` y overrides de reglas (MD013 `line_length: 120`, `heading_line_length: 120`, `code_block_line_length: 120`, `tables: false`; MD033 `allowed_elements: [br, img, div, span, sub, sup]`; MD049/MD014/MD024/MD036/MD044/MD052 en `false`) + `.markdownlintignore` para artefactos generados.

`.vale.ini` con `StylesPath = .github/styles`, `MinAlertLevel = warning`, secciones `[*]`, `[*.{md,mdx}]`, `[docs/learning/*.md]`, `[docs/changelog.md]` y `[*.*.md]`, con `BasedOnStyles = Vale, MiEstiloES` para prosa española (`MiEstiloES` definido en `.github/styles/MiEstiloES/` + vocabulario `config/vocabularies/Base/`).

- **Alternativa A**: `markdownlint-cli2` + `.markdownlint-cli2.jsonc` → descartada: no soporta `.markdownlintignore` (habría que duplicar ignores en `ignores: [...]`).
- **Alternativa B**: configs por workspace → descartada: el docs es de repo completo, duplicaría la fuente de verdad.
- Local y CI leen el MISMO archivo → paridad de umbrales (mismo principio que `eslint.config.js` como single source of truth).

### D2 — Overrides del changelog: `docs/changelog.md` (no `CHANGELOG.md`)

El archivo real es `docs/changelog.md`. Sus tablas Keep-a-Changelog exceden 120 chars → `overrides` en `.markdownlint.json` (`"files": ["docs/changelog.md"], "MD013": { "tables": false }`, refuerzo de reglas de tabla MD055/MD056/MD058/MD059/MD060 y `MD047` fin de archivo) y sección `[docs/changelog.md]` en `.vale.ini` con `BasedOnStyles = Vale` (solo ortografía/consistencia; el changelog es estructura, no prosa).

- **Corrección respecto de la research**: `docs/learning/docs-changelog-validation.md` cita `CHANGELOG.md` en scripts/globs — inexistente en raíz. Los scripts, el glob de lint-staged y el job CI apuntan a `docs/changelog.md` + `docs/**/*.md` + `*.md` raíz; el task 4 actualiza esa cita.
- **Alternativa**: crear `CHANGELOG.md` raíz que enlace a `docs/changelog.md` → descartada: introduce un segundo changelog (drift garantizado).

### D3 — CI: job `docs-validation` dentro de substage 2B + `needs` del agregador

Job en `.github/workflows/ci.yml`, sección SUBSTAGE 2B (junto a `actionlint`):

```yaml
docs-validation:
  name: 'Quality: Docs Validation'
  needs: repo-discovery
  if: github.event_name == 'pull_request'
  runs-on: ubuntu-latest
  timeout-minutes: 5
  steps:
    - uses: actions/checkout@v5
      with: { fetch-depth: 0 }
    - uses: ./.github/actions/setup-monorepo
    - name: markdownlint
      run: npm run docs:check
    - name: vale
      run: npm run docs:vale
```

y `- docs-validation` añadido al `needs` de `prebuild-quality-complete` (agregador existente, `if: ${{ vars.CI_MINIMAL != 'true' && always() }}` que ya propaga `failure`), de modo que `ci-complete` (que necesita al agregador) queda bloqueado por docs rotos.

- **Por qué 2B y no substage propio**: es "code quality" documental; un substage nuevo requeriría otro agregador + `ci-complete.needs` → más superficie para el mismo efecto.
- **Por qué NO workflow suelto `docs-validation.yml`**: `zombie-workflow-guard` lo rechaza.
- **Por qué no `vale-action`**: añade dependencia de anotación de PR; el script `npm run docs:vale` es reproducible en local y CI. `vale sync` solo si se usan `Packages` externos (con `BasedOnStyles = Vale, MiEstiloES` locales no hace falta en CI).
- **Adopción incremental**: Fase 0 configs locales → Fase 1 `docs:check` sin `needs` (reporte) → Fase 2 gate con todo el árbol limpio. Este change habilita Fase 2 (gate real en `needs`) solo si `npm run docs:check` pasa en limpio; si no, el job nace con `continue-on-error: true` y la task 8 deja la remoción pendiente. Decisión verificable en tasks.

### D4 — Shifting-left: `lint-staged` + doc como referencia

`lint-staged` gana la entrada:

```json
"*.{md,mdx}": ["prettier --write", "markdownlint --fix", "vale --minAlertLevel=warning --output=line"]
```

(orden: prettier formatea → markdownlint repara reglas fixables → vale solo reporta, no tiene `--fix`). El `*.md` actual con solo prettier se reemplaza por esta entrada (mantiene `prettier --write`, no lo elimina).

`docs/learning/docs-changelog-validation.md` pasa a ser la referencia canónica: task 4 lo actualiza para que documente EXACTAMENTE lo implementado (paths, scripts, job real, fases) — el doc no puede quedar describiendo `CHANGELOG.md` ni fases que ya no aplican.

## Risks / Trade-offs

- [Docs actuales incumplen MD013/MD047/etc. → el gate nuevo rompe PRs] → corregir el árbol antes de añadir `- docs-validation` al `needs` (orden en tasks: config → lint fix → gate), o nacer con `continue-on-error: true` y promover a gate en task 8.
- [vale sin binario en CI → job falla por "vale: command not found"] → instalar vale desde GitHub Releases (o `vale-action` como fallback) en el paso de setup; documentar en el doc (task 4).
- [Prettier vs markdownlint chocan en `.md`] → `proseWrap: preserve` + `MD013.tables: false` evita el clásico loop de fix/undo; verificado con `npm run format:check` tras la task 1.
- [`--fix` en CI enmascara errores] → CI corre `docs:check` (sin `--fix`); `--fix` vive solo en `docs:lint` local y en lint-staged.
- [MD033 `allowed_elements` amplio] → se limita a elementos usados en docs; sin `raw HTML` arbitrario en prosa.

## Migration Plan

1. Configs locales (tasks 1–3) + scripts (task 5) → `npm run docs:lint` repara lo fixable.
2. Limpiar resto del árbol y `docs/changelog.md` (task 4/8) hasta `npm run docs:check` en verde.
3. Activar lint-staged (task 6) → validación en cada commit.
4. Añadir job CI + `needs` (task 7) → gate en PR.
5. Rollback: quitar `- docs-validation` del agregador (un línea) desacopla el gate sin borrar configs.

## Open Questions

- Ninguno bloqueante. La promoción a gate (Fase 2 vs Fase 1 con `continue-on-error`) se resuelve en la task 7 con el resultado de `npm run docs:check` sobre el árbol limpio.
