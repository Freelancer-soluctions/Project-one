# Validación de Documentación y CHANGELOG (markdownlint / vale)

## 1. Contexto y estado actual

El proyecto `project-one` es un monorepo Node.js/Express + React, con `docs/learning/` que contiene 43 archivos `.md` en español (`prettier-configuration.md`, `eslint-configuration.md`, `knip-configuration.md`, etc.) y `docs/changelog.md` de 129 líneas en formato Keep-a-Changelog con tablas en Markdown. El CI (`.github/workflows/ci.yml`) opera con un substage 2B (`prebuild-quality-complete`) que agrega verificación de calidad (`knip`, `lint`, `format:check`), pero **no existe ningún job de validación de docs** (`docs-validation`). El `package.json` no declara `markdownlint-cli`, `vale`, ni scripts de validación. `lint-staged` (en `.husky/pre-commit`) solo formatea (`prettier --write`) y hace `eslint --fix`; no valida Markdown ni prosa. `dependency-cruiser` 18.2.0 existe, pero no es relevante para docs/CHANGELOG.

Referencia de contexto: `package.json` (devDeps: prettier 3.7.4, eslint 9.39.2, lint-staged 16.2.7, husky 9.1.7); `docs/changelog.md`; `.changeset/config.json`; `docs/CONTEXT-CICD.md` (§13.4 tabla de herramientas de calidad y estados de jobs CI); `docs/learning/knip-configuration.md`.

## 2. Por qué `markdownlint` + `vale`

`markdownlint-cli` (DavidAnson, v0.49.1, 2026-09-20) valida **estructura y formato** del Markdown (reglas MD001-MD060): encabezados, listas, tablas, bloques de código con lenguaje, longitud de líneas, espacios finales, espaciado en tablas, negrita/itálica. Es un linter de sintaxis Markdown puro — no analiza prosa ni ortografía.

`vale` (v3.22.0, 2026-09-17, docs.vale.sh) valida **prosa y escritura** en archivos de texto (Markdown, AsciiDoc, DITA): ortografía (`Vale.Spelling` con Hunspell), contracciones (`Google.Contractions` / `Microsoft.Contractions`), tono (`Vale.Prose`), secuencia (`Vale.Repetition`), consistencia (`Vale.Consistency`), métricas (`Vale.Metric`), capitalización (`Vale.Capitalization`). No valida estructura de Markdown; valida **calidad del lenguaje usado en docs**.

Ambos son **complementarios**, no redundantes: `markdownlint` garantiza que `docs/learning/import-boundaries.md` se renderiza correctamente en GitHub/GitLab; `vale` garantiza que la prosa en español (o inglés) sea consistente, sin errores de ortografía y con tono profesional.

Referencias oficiales:

- `https://github.com/DavidAnson/markdownlint-cli` (`markdownlint-cli`, docs `Rules.md` v0.49.1, CLI v2026-09-20, `.markdownlintignore` soportado) — referencia canónica; nota: `markdownlint-cli2` (v0.23.3) descartada por `.markdownlintignore` no soportado en cli2 (usa `ignores`).
- `https://docs.vale.sh/` (`topics/.vale.ini.md`, `topics/styles.md`, `topics/cli.md`, `topics/packages.md`)
- `https://github.com/vale-cli/vale-action`
- `https://github.com/vale-cli/packages`

## 3. Estado de herramientas (versionado y pin)

| Herramienta           | Versión actual                      | Comando / Instalación                                                                                                                                              | Notas de versión                                                                                                                                                                                                                                                                                                                                                        |
| --------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `markdownlint-cli`    | v0.49.1 (2026-09-20)                | `npm install --save-dev markdownlint-cli@0.49.1` (o `markdownlint-cli2` 0.23.3)                                                                                    | `markdownlint-cli` soporta `.markdownlintignore`; `cli2` usa `ignores` en `.markdownlint-cli2.jsonc`. Ambas validan contra esquema `Rules.md`. `markdownlint-cli` permite `--fix` para reglas fijables (MD004/005/007/009/010/011/012/014/018-022/030/031/032/047/049/050/055/056/058). Lección del upgrade 0.45.0 → 0.49.1 (regla MD060 + tablas rotas): **ver §3.1**. |
| `.markdownlintignore` | Solo `markdownlint-cli` (no `cli2`) | `node_modules/`, `dist/`, `build/`, `coverage/`, `storybook-static/`, `.github/styles/`                                                                            | Si se usa `cli2`, reemplazar por `ignores` en `.markdownlint-cli2.jsonc`. Decisión: usar `markdownlint-cli` por compatibilidad con `.markdownlintignore`.                                                                                                                                                                                                               |
| `vale`                | v3.22.0 (2026-09-17)                | Descargar desde GitHub Releases (NO usar `npm install vale`; el paquete npm está huérfano desde 2023). Usar `brew install vale` (macOS) o `.zip` de release en CI. | `vale sync` instala estilos desde `packages`. `vale --minAlertLevel=error` para CI; `suggestion` para adopción inicial (`onlyAnnotateModifiedLines` en `vale-action`).                                                                                                                                                                                                  |
| `.vale.ini`           | Formato INI, no JSON                | `StylesPath=.github/styles`, `Packages=Microsoft, write-good`, `[*.{md,mdx}]` con `BasedOnStyles = Vale, MiEstiloES`                                               | Configuración por workspace se hace con `[*.md]` y secciones específicas para `CHANGELOG.md` (ver abajo).                                                                                                                                                                                                                                                               |
| `.markdownlint.json`  | JSON                                | `default: true`, reglas individuales (`MD013`, `MD033`, etc.), `extends` (opcional), `ignore` o `overrides`                                                        | `MD013` line-length: `line_length: 120`, `heading_line_length: 120`, `code_block_line_length: 120`, `tables: false` (ej. para tablas de docs con muchas columnas como en `docs/learning/eslint-complexity-configuration.md`).                                                                                                                                           |

### 3.1 Lección de upgrade `markdownlint-cli` 0.45.0 → 0.49.1: regla MD060 y tablas rotas (verified 2026-09-27)

> Contexto: el bump se ejecutó durante el triage `npm audit` del change `sca-lockfile-compliance` (task 5.1b) —
> `markdownlint-cli@0.45.0` era vulnerable y la versión fijada por este doc (0.49.1) era el objetivo. Este doc
> investigaba 0.49.1 desde 2026-09-20, pero el repo seguía en 0.45.0: el upgrade activó comportamiento no
> documentado en la investigación inicial.

**Qué cambió entre versiones (medido repo-wide, `docs/**/_.md`+`docs/_.md`, config `.markdownlint.json` del repo):\*\*

| Métrica                                      | 0.45.0 (baseline) | 0.49.1 sin remediar | 0.49.1 tras remediación |
| -------------------------------------------- | ----------------- | ------------------- | ----------------------- |
| Total violaciones                            | 6557              | 8106                | **5643**                |
| MD060 `table-column-style` (regla **nueva**) | no existe         | 1500 (36 archivos)  | **0**                   |
| MD013                                        | 3887              | 3936                | 3891                    |
| Resto de reglas (MD034/040/032/031/022/…)    | —                 | **idénticas**       | idénticas               |

**Hallazgo principal — la regla nueva no era ruido, era un bug de render real:** ~18 tablas en 7 archivos interrumpían
un párrafo (`**Pros:**` con la primera fila pipe en la línea siguiente, sin línea en blanco). GFM **no** permite que
una tabla interrumpa un párrafo → **se renderizaban rotas en GitHub** (párrafo + pipes como texto plano). La
discrepancia que hizo visible el problema: markdownlint 0.49 las detecta como tabla (su tokenizador permite la
interrupción) y les aplica MD060, pero prettier/remark **no las parsean como tabla** y no las normalizan. El par
`prettier` (normalizar) + `markdownlint` (detectar) es complementario, no redundante.

**Remediación aplicada (2026-09-27):**

1. `prettier --write` sobre los 36 archivos con MD060 → normaliza a estilo espaciado (1500 → 94).
2. Inserción de línea en blanco antes de filas pipe pegadas a un párrafo (script respetando fences de código; 18
   inserciones en 7 archivos) → las pseudo-tablas se convierten en tablas reales y prettier ya puede alinearlas
   (94 → 4).
3. Fix manual 1:1 de la última pseudo-tabla (`docs/opencode/agent-architecture-analysis.md`, caso donde GFM **sí**
   permite la interrupción) → MD060: 0.
4. MD013: el tokenizador nuevo ya no absuelve blockquotes largos adyacentes a tablas → 141 líneas >120 expuestas en
   `docs/CONTEXT-CICD.md`; envueltas preservando el prefijo de cita (mayor-que + espacio) y la indentación de lista,
   con 2 artefactos reparados (una línea sin prefijo de cita y una continuación que empezaba con `+` y parseaba como
   ítem de lista). Sin tocar tablas/fences/headings/setext.

**Lecciones accionables para futuros bumps de markdownlint:**

- Comparar **por regla** (`grep -oE 'MD[0-9]+' | sort | uniq -c` antes/después), no solo el total: el delta total
  mezcla reglas nuevas con churn del tokenizador.
- Esperar churn de MD013 aunque ninguna línea cambie: el tokenizador decide qué líneas quedan fuera del contexto de
  tabla/blockquote.
- Violaciones de reglas nuevas sobre docs legacy suelen ser defectos reales de render — auditar una muestra con
  `sed -n` antes de desactivar la regla en `.markdownlint.json` (aquí no hizo falta ninguna excepción nueva).

## 4. Configuración profesional (`markdownlint-cli`) — `.markdownlint.json` / `.markdownlintignore`

### 4.1 `.markdownlint.json` sugerido (raíz)

```json
{
  "default": true,
  "MD013": {
    "line_length": 120,
    "heading_line_length": 120,
    "code_block_line_length": 120,
    "tables": false,
    "code_blocks": true,
    "headings": true,
    "strict": false,
    "stern": false
  },
  "MD033": {
    "allowed_elements": ["br", "img", "div", "span", "sub", "sup"]
  },
  "MD041": true,
  "MD047": true,
  "MD049": false,
  "MD014": false,
  "MD040": true,
  "MD001": true,
  "MD003": true,
  "MD004": { "style": "dash" },
  "MD007": { "indent": 2 },
  "MD009": true,
  "MD010": true,
  "MD011": true,
  "MD012": false,
  "MD018": true,
  "MD023": true,
  "MD024": false,
  "MD025": true,
  "MD031": true,
  "MD032": true,
  "MD036": false,
  "MD037": true,
  "MD043": true,
  "MD044": false,
  "MD045": true,
  "MD046": { "style": "fenced" },
  "MD051": true,
  "MD052": false,
  "MD053": true,
  "MD054": true,
  "MD055": true,
  "MD056": true,
  "MD057": true,
  "MD058": true,
  "MD059": true,
  "MD060": true,
  "MD061": true,
  "MD062": true
}
```

Notas de decisión (comentario en archivo de config o doc):

- `MD013` con `line_length: 120`: se permite hasta 120 para tablas de referencia y líneas largas con URLs; `tables: false` evita false-positives en tablas de `docs/learning/knip-configuration.md`, `eslint-complexity-configuration.md`, `import-boundaries.md`. `heading_line_length: 120`: permite encabezados extensos con descripción de regla.
- `MD033`: permite `img` (badges de CI), `div`/`span` (layout de tablas), `sub`/`sup` (notas técnicas), `br` (saltos controlados); desactiva `allowed_elements` no listados.
- `MD049` (`emphasis-style`): desactivado porque `docs/learning/` usa `**negrita**` y `*itálica*` mixto según contexto; activar si se fija a `consistent` (recomendado si todo el repo usa el mismo estilo).
- `MD014`: desactivado porque `docs/learning/prettier-configuration.md` y `import-boundaries.md` usan comandos con `>` que pueden ser interpretados como blockquotes; si se activa, usar `>` con espacio y configurar `MD014` para permitir `>` si es bloque de código o cita explicativa.
- `MD060`: tabla de reglas se alinea con `tables: true`; `MD055/MD058/MD059` validan pipes, espacios y estilo de columna.
- `MD041`: primer encabezado debe ser `# ` (título del documento); todos los docs `docs/learning/*.md` cumplen.
- `MD040`: bloque de código debe declarar lenguaje (ej. `yaml`, `json`); siempre obligatorio para snippets.
- `MD013` y Prettier: `proseWrap: preserve` (default en `.prettierrc.yaml`) significa que Prettier NO re-alinea párrafos; por lo tanto `MD013` es la única validación de longitud de líneas para párrafos largos. Si `proseWrap` se activa, habría conflicto (Prettier divide párrafos, `MD013` los rechaza si exceden 120); por eso `preserve` es la combinación correcta.

### 4.2 `.markdownlintignore`

```gitignore
# .markdownlintignore (compatible SOLO con markdownlint-cli, NO cli2)
node_modules/
dist/
build/
coverage/
storybook-static/
package-lock.json
.env
*.log
archive/
```

Nota: `.markdownlintignore` no soporta `#` comentarios internos en todos los parseadores; usar líneas simples. Si se usa `cli2`, reemplazar por `ignores: ['node_modules/**', ...]` dentro de `.markdownlint-cli2.jsonc`. Decisión: usar `markdownlint-cli` por consistencia con `.markdownlintignore` y por `--fix`.

### 4.3 `CHANGELOG.md` / `docs/changelog.md` (Keep-a-Changelog)

Para `docs/changelog.md` (129 líneas: formato Keep-a-Changelog con tablas de versiones y cambios), la validación con `markdownlint` requiere consideración específica:

- `MD013`: tablas con muchos pipes pueden exceder 120; solución: usar `tables: false` para este archivo (override) o extender `line_length` solo para archivo.
- `MD033`: badges de CI (`![CI](...)`) permiten `img`; badges de GitHub permiten `img`; si hay `<sub>` para notas de versionado, permitir.
- `MD041`: primer encabezado debe ser `# Changelog` (o similar); `docs/changelog.md` cumple.
- `MD055/MD058/MD059/MD060`: tablas de versiones deben ser consistentes en número de columnas (`MD056`) y estilo (`MD055`); usar `| Version | Date | Changes |` con `---` underlines.
- `MD047`: debe terminar con `\n` (single trailing newline).
- `MD049`: `emphasis-style` debe ser consistente (`**` o `*`); en changelogs a veces se usa `**` para versiones.

Decoración: no usar `MD002` o `MD006` (eliminadas en v0.32.0); no usar `MD101/MD102` (no existen).

## 5. Configuración profesional (`vale`)

### 5.1 `.vale.ini` sugerido

```ini
StylesPath = .github/styles
MinAlertLevel = warning

[*]
BasedOnStyles = Vale

[*.{md,mdx}]
BasedOnStyles = Vale, MiEstiloES

[docs/learning/*.md]
BasedOnStyles = Vale, MiEstiloES

[CHANGELOG.md]
BasedOnStyles = Vale

[*.es.md]
BasedOnStyles = Vale, MiEstiloES
```

Nota: `MiEstiloES` es un estilo personalizado (creado en `.github/styles/MiEstiloES/`) que define reglas de ortografía, contracciones y tono para documentación técnica en español. `Vale` aporta `Vale.Spelling` (ortografía con Hunspell `en_US` por defecto; para español, usar diccionario `es` en `config/vocabularies/Base/` y `Vocab` con `accept.txt` / `reject.txt`).

### 5.2 `Vale.Spelling` y español

- Vale usa Huntspell por defecto (`en_US`); para docs en español de `docs/learning/`, se debe proporcionar diccionario `es` (`es_ES.dic`, `es_ES.aff`) o usar `Vocab` personalizado con palabras aceptadas (`docs/learning/knip-configuration.md` usa términos técnicos como `workspaces`, `prisma`, `dependency-cruiser`, `prettier`, `eslint`).
- `Vocab` se define con archivos `accept.txt` (palabras permitidas) y `reject.txt` (palabras rechazadas) en `<StylesPath>/config/vocabularies/Base/`.
- `Google` / `Microsoft` son paquetes en inglés (`Packages = Microsoft, write-good`); para español, desactivar `Google.Contractions`, `Microsoft.Contractions`, `write-good.Contractions`, `proselint` (todos anglocéntricos) y usar solo `Vale.Spelling` + `Vale.Prose` + `Vale.Repetition` + reglas custom.

### 5.3 Ejemplo `.vale.ini` para español profesional

```ini
StylesPath = .github/styles
Packages = Vale
MinAlertLevel = warning

[*]
BasedOnStyle = Vale

[CHANGELOG.md]
BasedOnStyle = Vale
```

Nota: `Vale.Spelling` requiere que `vale` encuentre los diccionarios. En Windows: `%LOCALAPPDATA%\vale\.vale.ini`; en Linux/macOS: `~/.vale.ini` o `~/.config/vale/.vale.ini`. En CI, usar `VALE_CONFIG_PATH=.` para asegurar que `.vale.ini` raíz se use.

### 5.4 Pre-commit y CI con vale

- Pre-commit: usar hook `https://github.com/vale-cli/vale` con `rev: v3.22.0`; dos hooks: primero `args: [sync]` (`pass_filenames: false`) que instala estilos; luego `args: [--output=line, --minAlertLevel=warning, --glob='*.{md,mdx}']` que valida.
- CI (`docs-validation` dentro de `ci.yml` substage 2B): `npm run docs:lint` (o `npx vale --minAlertLevel=error --output=line .`). No usar `onlyAnnotateModifiedLines: true` en CI (es útil en `vale-action` para PRs, no en CI de repos completos). Usar `if: always()` para reporte y `if: failure()` para gate si `severity: error`.
- `vale sync --plain-progress` antes de lint: instala paquetes (`Microsoft`, `write-good`) si se usan; para español, `Packages = Vale` solo, no requiere `sync`.

## 6. Shifting-Left (Pre-commit / Lint-Staged / Husky)

### 6.1 Ampliación de `.husky/pre-commit`

Actual (`.husky/pre-commit` en repo): `npm exec lint-staged`; luego `semgrep` / `gitleaks`. Ampliar:

```bash
# .husky/pre-commit (añadir antes o después de lint-staged; orden: prettier → eslint → markdownlint → vale → semgrep/gitleaks)
npm exec lint-staged  # prettier + eslint + depcruise (si se activa)
# docs validation: solo si se instalan markdownlint-cli y vale (opcional para adopción incremental)
# npx markdownlint-cli2 --config .markdownlint.json --fix "*.md" "docs/**/*.md"  # o markdownlint-cli
# npx vale --minAlertLevel=warning --output=line --glob='*.{md,mdx}' .
```

Nota: `lint-staged` puede incluir entrada `"*.md": ["prettier --write", "markdownlint --fix", "vale --minAlertLevel=warning --output=line"]`. Esto proporciona validación de docs antes del push, sin esperar CI.

### 6.2 `lint-staged` en `package.json`

```json
"lint-staged": {
  "*.{js,jsx,cjs,mjs}": ["prettier --write", "eslint --fix --max-warnings 0 --no-warn-ignored"],
  "*.{md,mdx}": ["prettier --write", "markdownlint --fix", "vale --minAlertLevel=warning --output=line"]
}
```

Nota: `markdownlint --fix` (del CLI `markdownlint-cli`) arregla regras fixables (`MD004`, `MD007`, etc.). `vale --fix` NO existe (`vale` no arregla automáticamente); solo reporta.

### 6.3 Fase de adopción incremental (gradual)

- Fase 0 (actual): agregar `markdownlint-cli` como `devDep`, agregar `.markdownlint.json`; no modificar CI; correr `markdownlint .` localmente para ver errores; no bloquear PRs aún.
- Fase 1 (`suggestion` / `warn`): activar `vale --minAlertLevel=suggestion`; corregir errores de formato (`markdownlint --fix`); usar `onlyAnnotateModifiedLines: true` en `vale-action` para PRs; no agregar `docs-validation` como gate (`continue-on-error: true` o no incluir en `needs`).
- Fase 2 (`warning`): activar `vale --minAlertLevel=warning`; agregar `docs-validation` a CI como reporte (`if: always()`); usar `markdownlint` como gate con `continue-on-error: false` solo si todo el repo pasa (recomendado tras limpiar).
- Fase 3 (`error`): `vale --minAlertLevel=error`; `markdownlint` como gate bloqueante (`exit 1` = bloqueado); `docs-validation` en `needs:` de `prebuild-quality-complete`; `continue-on-error: false`; terminar `docs/learning/` y `CHANGELOG.md` limpios.

## 7. CI Job Draft (`docs-validation` dentro de `.github/workflows/ci.yml`)

```yaml
docs-validation:
  runs-on: ubuntu-latest
  needs: repo-discovery
  if: github.event_name == 'pull_request'
  steps:
    - uses: actions/checkout@v5
      with:
        fetch-depth: 0
    - uses: ./.github/actions/setup-monorepo
    - name: Install docs tools
      run: npm ci # instala markdownlint-cli + vale si se añaden a package.json devDeps
    - name: Validate docs (markdownlint + vale)
      run: |
        npx markdownlint-cli2 "docs/**/*.md" "CHANGELOG.md" --config .markdownlint.json --fix 2>&1 || true  # primero ver errores (no bloquear paso inicial si hay muchos antiguos)
        npm run docs:lint  # script definido en package.json: npx markdownlint-cli --config .markdownlint.json .
        npm run docs:vale  # script: npx vale --minAlertLevel=warning --output=line .
      # Phase 2/3: reemplazar `|| true` por exit real y quitar `|| true`
    - name: Upload docs validation report
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: docs-validation-report
        path: reports/docs-validation.html # generado por markdownlint-cli si se configura reporte html o por vale
```

Nota: `zombie-workflow-guard` prohíbe workflow suelto `docs-validation.yml`; debe ir dentro de `ci.yml`. `needs: repo-discovery` es consistente con `client-lint`, `client-format-check`.

Nota de job naming: no renombrar `client-import-bounds`; usar `docs-validation` como nombre nuevo (no colisiona).

## 8. Scripts `package.json` sugeridos

```json
"docs:lint": "markdownlint-cli --config .markdownlint.json 'docs/**/*.md' 'CHANGELOG.md' --fix",
"docs:check": "markdownlint-cli --config .markdownlint.json 'docs/**/*.md' 'CHANGELOG.md'",
"docs:vale": "vale --minAlertLevel=warning --output=line --glob='*.{md,mdx}' .",
"docs:sync": "vale sync --plain-progress",
"docs:report": "markdownlint-cli --config .markdownlint.json --format html --output reports/docs-validation.html 'docs/**/*.md' 'CHANGELOG.md' || true"
```

Nota: `markdownlint-cli` (v0.49.1) admite `--format html`; `markdownlint-cli2` admite `--report`. `|| true` en `docs:report` porque es reporte no-blocking (similar a `dependency-cruiser --output-type err-html`).

## 9. Comparación con herramientas existentes del proyecto

- `prettier` (`.prettierrc.yaml`): formato visual (espacios, comillas, indentación) de Markdown; `markdownlint` valida estructura de Markdown (encabezados, listas, tablas); `vale` valida prosa/ortografía. Los tres se complementan sin solapamiento (prettier no valida reglas de estructura; markdownlint no valida ortografía).
- `lint-staged`: ya cubre `prettier --write`; ampliar con `markdownlint --fix` y `vale --minAlertLevel=warning --output=line`. Esto mantiene `shift-left` (pre-commit antes del push).
- `knip.jsonc`: detecta archivos sin usar/exports sin usar; `docs/` pueden contener archivos sin referencias de código (ej. `docs/learning/` como referencia externa); `knip` no debe ignorarlos, pero `markdownlint` valida que los docs existentes sean correctos. No hay conflicto.
- `eslint.config.js` (`prettier` al final, `complexity` max 20): análisis de código JS; no valida Markdown.
- `dependency-cruiser` (`.dependency-cruiser.cjs`): grafo de imports; no valida docs.
- `docs/CONTEXT-CICD.md`: referencia `docs-validation` debe actualizarse en sección de calidad (§13.4) con el job y sus estados (`pending` → `green` tras fase 2).

## 10. Referencias finales

- `https://github.com/DavidAnson/markdownlint-cli2`
- `https://raw.githubusercontent.com/DavidAnson/markdownlint/main/doc/Rules.md`
- `https://docs.vale.sh/`
- `https://github.com/vale-cli/vale-action`
- `https://github.com/vale-cli/packages`
- `.github/workflows/ci.yml` (substage 2B, agregador `prebuild-quality-complete`)
- `docs/CONTEXT-CICD.md` (§13.4)
- `package.json` (`lint-staged` con `prettier --write` sobre `*.md`)
- `.prettierrc.yaml` (`proseWrap: preserve`, `printWidth: 80`)

Referencia a fuente de datos de investigación: hallazgos del `@researcher` sobre `markdownlint-cli` (v0.49.1, 2026-09-20), `vale` (v3.22.0, 2026-09-17), reglas MD001-MD060 con corrección MD002/MD006 eliminadas, `Vale.Spelling` (no `Vale.Prose.Spelling`), `.markdownlintignore` solo para cli, `CHANGELOG.md` 129 líneas Keep-a-Changelog.
