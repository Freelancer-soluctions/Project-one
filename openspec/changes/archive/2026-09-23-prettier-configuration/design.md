# Design

## Context

El repo formatea con Prettier 3.7.4 (`devDependency` de la raíz), cableado vía lint-staged (`*.{js,jsx,ts,tsx,cjs,mjs,json,jsonc,md}: prettier --write`) y `npm run format`. Hasta hoy la configuración vivía en `.prettierrc` — JSON, por tanto **sin comentarios** — mientras la convención de documentación del proyecto (`documentation-canónica-es`) exige docs canónicas en español y autoexplicativas (`docs/learning/eslint-configuration.md`, `docs/learning/knip-configuration.md`). La migración a `.prettierrc.yaml` conserva cada valor pero convierte el archivo en la primera explicación del contrato de formato; `docs/learning/prettier-configuration.md` (ES, creado 2026-09-23, **verificado en el árbol en el retry**) es la referencia narrativa citada desde los tres artefactos. El config declara `$schema: 'https://json.schemastore.org/prettierrc'` (l. 5) para autocompletado/validación en editor.

El formato ya opera en **4 capas profesionales** redundantes: format-on-save en editor → lint-staged pre-commit (`package.json` l. 91-92) → CI `format:check` (jobs `client-format-check`/`server-format-check`, `ci.yml` l. 448/536) → `eslint-config-prettier` **al final** del array de `eslint.config.js` (l. 351) que desactiva reglas de estilo de ESLint para que no peleen con Prettier.

El contrato de fin de línea ya existe en dos capas: `.gitattributes` (`* text=auto eol=lf`, más `text eol=lf` explícito para `*.yaml`/`*.js`/`*.md`…) y Prettier; `endOfLine: 'lf'` es la capa formatter de ese mismo contrato.

## Goals / Non-Goals

**Goals:**

- Mantener `.prettierrc.yaml` como fuente única de verdad del formato, autoexplicativa en español (qué hace cada opción + por qué).
- Documentar cada opción relevante y su decisión en los tres artefactos del change, con punta a la doc canónica `docs/learning/prettier-configuration.md`.
- Cero cambio de valores: paridad total con el `.prettierrc` JSON anterior.
- Detectar y corregir las referencias literales a `.prettierrc` que quedan en la documentación.
- Dejar documentadas las 4 capas de aplicación profesional (format-on-save, lint-staged, CI format-check, prettier último en `eslint.config.js`) y el `$schema` de schemastore.

**Non-Goals:**

- Cambiar cualquier valor de formato (`printWidth`, `semi`, `endOfLine`, …) — este change documenta, no reformatea.
- Reintroducir `.prettierrc` JSON o mantener dos configs (rompería la fuente única).
- Reformatear el código existente (`npm run format` no debería producir diffs derivados de este change).
- Traducir la doc canónica al inglés.
- Añadir `eslint-plugin-prettier` (correr Prettier dentro de ESLint) — patrón descartado en D5.

## Decisions

### D1 — YAML comentado en español como capa de explicación inline

**Decision:** `.prettierrc.yaml` lleva, para cada opción, un comentario de descripción y una nota `Decisión:` en español; el JSON anterior se elimina.

**Rationale:** JSON no admite comentarios, así que la única forma de explicar el formato _en el archivo_ era migrar a YAML (formato soportado nativamente por Prettier). El español ya es la lengua de los comentarios de `eslint.config.js` y de `docs/learning/*`.

**Alternativas consideradas:**

- **Comentar solo en la doc** — deja el archivo mudo; quien abre `.prettierrc` no ve el porqué (la doc se lee menos que el código).
- **Mantener `.prettierrc` JSON + doc** — dos fuentes de verdad y cero explicación inline.

### D2 — Razonamiento por opción (valores intactos)

| Opción                                | Valor                                       | Decisión documentada                                                                                                                   |
| ------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `printWidth`                          | `80`                                        | Legibilidad en frontend React **y** backend: pantallas divididas y diffs de PR más estrechos; estándar histórico compatible con ESLint |
| `singleQuote`                         | `true`                                      | Consistencia con los string literals del monorepo (menos ruido visual que las dobles)                                                  |
| `semi`                                | `true`                                      | Evitar bugs de ASI (`return`, IIFE, `throw`) — estilo explícito en ambos lados                                                         |
| `trailingComma`                       | `'es5'`                                     | Compatibilidad ES5 + diffs más claros (las comas añadidas en multiline aparecen en el diff)                                            |
| `jsxSingleQuote`                      | `false`                                     | JSX usa comillas dobles (convención HTML/React); las simples quedan solo en props/cadenas simples del JS interno                       |
| `arrowParens`                         | `'always'`                                  | Consistencia en funciones flecha de un parámetro; evita churn al añadir tipos/parámetros                                               |
| `endOfLine`                           | `'lf'`                                      | Contrato de `.gitattributes` (`* text=auto eol=lf`); gate de la capa formatter frente a `auto`, que reintroduciría CRLF en Windows     |
| `bracketSpacing`                      | `true`                                      | Espaciado estándar `{ foo: bar }` en objetos e imports                                                                                 |
| `bracketSameLine`                     | `false`                                     | Cierre de tags JSX en línea separada de las props (componentes con props largas legibles)                                              |
| `tabWidth` / `useTabs` / `quoteProps` | `2` / `false` / `'as-needed'`               | Convención dominante JS/TS, sin tabs inconsistentes entre editores, sin comillas innecesarias                                          |
| `$schema`                             | `'https://json.schemastore.org/prettierrc'` | Esquema oficial schemastore: autocompletado y validación del config en el editor (ver D5)                                              |

### D3 — La doc canónica es la referencia, no la duplicación

**Decision:** Los tres artefactos citan `docs/learning/prettier-configuration.md` (ES, 2026-09-23) como fuente del razonamiento ampliado; los comentarios del config explican cada opción sin reproducir la narrativa.

**Rationale:** Mismo patrón ya validado en `eslint-configuration` (doc canónica + comentarios cortos). El archivo es corto y debe seguir escaneable; la profundidad (enlaces oficiales, ejemplos, tabla de opciones) pertenece a la doc.

**Alternativas consideradas:**

- **Inline largo en el config** — ruido en un archivo de 53 líneas; los comentarios dejan de escanearse.
- **Doc sin cita desde los artefactos** — pierde el rastro de la fuente de verdad al archivar el change.

### D4 — Paridad total de valores

**Decision:** idénticos valores al `.prettierrc` JSON eliminado; solo cambia el formato y la anotación.

**Rationale:** cualquier desviación produciría diffs de formato masivos en el próximo `npm run format`/lint-staged y mezclaría "documentar" con "reformatear".

### D5 — `$schema` de schemastore + pipeline profesional de 4 capas

**Decision:** `$schema: 'https://json.schemastore.org/prettierrc'` en el config (l. 5); el formato se aplica en 4 capas: **(1) format-on-save** en el editor, **(2) lint-staged** pre-commit (`prettier --write` sobre staged), **(3) CI `format:check`** (jobs `client-format-check`/`server-format-check` en `ci.yml` l. 448/536, bloquean el PR), **(4) `eslint-config-prettier` al final** del array de `eslint.config.js` (l. 351).

**Rationale:** el `$schema` da IntelliSense y valida el YAML al editarlo — sin él, un typo silenciaría una opción sin que nadie lo notara hasta el próximo format. La capa 4 debe ir **siempre última** porque su "off" de reglas de estilo gana a cualquier bloque anterior (documentado en el propio `eslint.config.js` l. 341-350); invertir el orden reintroduciría conflictos ESLint vs Prettier. Las capas 1-3 se retroalimentan: editor arregla al guardar, hook atrapa lo no guardado, CI es el gate final — misma arquitectura descrita en `docs/learning/prettier-configuration.md` §3.2 y §5.

**Alternativas consideradas:**

- **Sin `$schema`** — YAML válido pero mudo en editor; errores de clave pasan desapercibidos hasta CI.
- **`eslint-plugin-prettier` (integración activa)** — corre Prettier dentro de ESLint (lento, doble ejecución); `eslint-config-prettier` (solo desactivar) + `format:check` en CI es el patrón recomendado actual.
- **Format-on-save como única capa** — depende de la config individual de cada editor/dev; CI sigue indispensable como gate.

## Risks / Trade-offs

| Risk                                                               | Impact                                                   | Mitigation                                                                                                       |
| ------------------------------------------------------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `docs/learning/prettier-configuration.md` ausente o desincronizada | Cita rota en los tres artefactos                         | **Resuelto en retry**: doc existe en el árbol y sus decisiones coinciden (task 2.1 cerrada con grep)             |
| Comentarios quedan obsoletos al cambiar un valor                   | Doc inline engañosa                                      | Task de sincronización config ↔ doc canónica en `documentation-canónica-es`                                      |
| Citas literales a `.prettierrc` en docs                            | Lectores siguen el nombre viejo                          | Task 3.1: `grep -rn "\.prettierrc\b" docs` → `.prettierrc.yaml`                                                  |
| `$schema` caído o cambiado (schemastore re-mapea)                  | Pierde autocompletado/validación en editor               | Task 4.1: leer l. 5 y confirmar URL exacta `https://json.schemastore.org/prettierrc`                             |
| `prettier` movido fuera del final de `eslint.config.js`            | Reglas de estilo de ESLint vuelven a pelear con Prettier | Task 4.2: confirmar `prettier,` como último elemento (l. 351) y comentario "(siempre al final)"                  |
| CI `format:check` desactivado u obsoleto                           | Pierde el gate final del formato                         | Task 4.3: grep de `format:check` en `ci.yml` (l. 448, 536)                                                       |
| `bracketSameLine: false` puede leerse al revés                     | Confusión sobre "línea separada"                         | Comentario aclara: el _cierre_ de props/tag va en línea propia, no la apertura                                   |
| YAML aceptado por Prettier pero no por algún tooling externo       | Ruptura de lint/format en CI                             | Prettier 3.7.4 lo resuelve nativamente; lint-staged no nombra el config; validar con `npm run format -- --check` |
