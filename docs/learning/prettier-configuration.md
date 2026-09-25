# Configuración de Prettier en Project One

> Guía de aprendizaje: cómo está configurado Prettier en el monorepo, por qué se eligió YAML, qué prácticas profesionales lo rodean y cómo se integra con CI. Referencia canónica: `.prettierrc.yaml` (con comentarios en español por decisión).

## 1. Implementación actual (`.prettierrc.yaml`)

El fichero `.prettierrc.yaml` en la raíz del monorepo es la **única fuente de verdad** del formato. Prettier lo descubre automáticamente por resolución cosmiconfig (busca `.prettierrc*` desde el fichero a formatear hacia arriba), así que tanto `apps/client` (React/JSX) como `apps/server` (Express) comparten la misma configuración sin duplicarla.

Contiene **13 opciones** (incluyendo `$schema`), cada una con su comentario en español explicando la decisión:

| #   | Opción            | Valor                                       | Resumen de la decisión (ver comentario ES en el YAML)                             |
| --- | ----------------- | ------------------------------------------- | --------------------------------------------------------------------------------- |
| 1   | `$schema`         | `'https://json.schemastore.org/prettierrc'` | Autocompletado y validación en editores.                                          |
| 2   | `printWidth`      | `80`                                        | Legibilidad en pantallas divididas y diffs de PR estrechos.                       |
| 3   | `tabWidth`        | `2`                                         | Convención dominante en JS/TS; ahorra sangrado en JSX anidado.                    |
| 4   | `useTabs`         | `false`                                     | Espacios: render consistente entre editores y copiado de snippets.                |
| 5   | `semi`            | `true`                                      | Evita ambigüedades del ASI (`return`, IIFE, `throw`).                             |
| 6   | `singleQuote`     | `true`                                      | Menos ruido visual; coherente con el estilo del monorepo.                         |
| 7   | `quoteProps`      | `'as-needed'`                               | Solo cita claves cuando es necesario (guiones, reservadas).                       |
| 8   | `jsxSingleQuote`  | `false`                                     | JSX con comillas dobles (convención React/HTML); el JS interno sigue con simples. |
| 9   | `trailingComma`   | `'es5'`                                     | Comas finales en objetos/arrays (diffs limpios) sin romper entornos antiguos.     |
| 10  | `bracketSpacing`  | `true`                                      | `{ foo: bar }` con espacios: legibilidad de objetos e imports.                    |
| 11  | `bracketSameLine` | `false`                                     | Cierre de props largas en línea propia: lectura de componentes con muchas props.  |
| 12  | `arrowParens`     | `'always'`                                  | `(x) => x`: consistencia y cero churn al añadir tipos o parámetros.               |
| 13  | `endOfLine`       | `'lf'`                                      | Normaliza saltos Windows/macOS/Linux; evita ruido CRLF/LF en Git y CI.            |

Se mantiene **paridad total con el anterior `.prettierrc` JSON**: mismos valores, solo cambia el formato del fichero a YAML comentado.

Lectura recomendada: abrir `.prettierrc.yaml` y leer cada bloque de comentario — cada opción documenta su QUÉ y su POR QUÉ en español.

## 2. Por qué YAML (comentarios vs JSON)

JSON no admite comentarios. Un `.prettierrc` JSON es una caja negra: ves valores pero no sabes por qué se eligieron, y cada cambio de formato degenera en discusión repetida en PRs.

YAML sí admite comentarios (`# ...`), por eso se migró a `.prettierrc.yaml`:

- **Documenta la decisión junto al valor.** Cada opción lleva su justificación (ASI, diffs, JSX, CRLF…) en el mismo fichero. El contexto no vive en un wiki separado que se desincroniza.
- **Misma semántica, cero riesgo.** Prettier acepta YAML, JSON, JS o `package.json` indistintamente; los valores no cambiaron, solo el envoltorio. No hay que tocar ni una línea de código por la migración.
- **`$schema` valida el fichero.** La primera clave apunta al esquema oficial de schemastore, así VS Code autocompleta y marca errores de claves/valores al editar.
- **Onboarding más rápido.** Un desarrollador nuevo lee el YAML y entiende el estilo del repo en 2 minutos, sin perseguir hilos de Slack o PRs antiguos.

Regla práctica: si alguna vez hay que cambiar un valor de formato, se cambia **el valor y su comentario** a la vez, explicando el nuevo porqué.

## 3. Prácticas profesionales alrededor de Prettier

Prettier solo formatea; la profesionalidad está en el ecosistema que lo rodea:

### 3.1 `format-on-save` en VS Code

El formateo debe ocurrir sin pensar, al guardar. Configuración recomendada en `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.formatOnPaste": false
}
```

- `defaultFormatter` fija Prettier como formateador para evitar que otro plugin (ESLint, Tailwind) compita por el mismo fichero.
- `formatOnSave` aplica `.prettierrc.yaml` automáticamente en cada guardado.
- No se commitea formato pendiente: lo que se ve en el editor es lo que verifica CI.

### 3.2 `format` vs `format:check` y jobs de CI

Cada workspace expone dos scripts (ver `apps/client/package.json` y `apps/server/package.json`):

- `npm run format` → `prettier --write ...` (reescribe ficheros; uso local).
- `npm run format:check` → `prettier --check ...` (solo verifica; uso en CI, no toca nada).

En CI existen jobs dedicados `client-format-check` y `server-format-check` (ver `.github/workflows/ci.yml`) que ejecutan `npm run format:check --workspace=apps/client` y `.../apps/server`. Si un fichero no cumple el estilo, el job falla y el PR se bloquea. Flujo correcto: ejecutar `npm run format` en local antes de pushear.

### 3.3 `lint-staged` en pre-commit (Husky)

El `package.json` raíz define:

```json
"lint-staged": {
  "*.{js,jsx,ts,tsx,cjs,mjs,json,jsonc,md}": "prettier --write",
  "*.{js,jsx,cjs,mjs}": "eslint --fix --max-warnings 0 --no-warn-ignored"
}
```

El hook pre-commit de Husky ejecuta `lint-staged`, que aplica `prettier --write` **solo a los ficheros staged**. Efecto: es imposible commitear código mal formateado aunque se olvide el `format-on-save`. El segundo patrón encadena ESLint con `--fix` sobre el JS ya formateado (orden intencionado: primero formato, luego lint).

### 3.4 Prettier + `eslint-config-prettier` (al final)

Prettier y ESLint solapan en reglas de estilo (`indent`, `quotes`, `semi`…). Para que no se contradigan:

- Prettier es el **único dueño del formato**.
- `eslint-config-prettier` **no formatea**: solo desactiva las reglas de estilo de ESLint que chocarían con Prettier.
- En `eslint.config.js` el import `prettier` de `eslint-config-prettier` se coloca **siempre al final del array** para que su "off" gane a cualquier bloque anterior.

```js
import prettier from 'eslint-config-prettier';

export default [
  js.configs.recommended,
  // ... bloques de server, client, storybook, complexity ...
  prettier, // SIEMPRE al final
];
```

Si se añade un nuevo bloque de ESLint, debe ir **antes** de `prettier`. División de responsabilidades: Prettier decide _cómo se ve_ el código; ESLint decide _si es correcto_.

## 4. Catálogo de opciones con ejemplos del repo

Ejemplos de cómo cada opción afecta al código real de `apps/client` (React) y `apps/server` (Express):

### `printWidth: 80`

```js
// Se parte en varias líneas al superar 80 columnas:
const { data: events } = await eventService.findByFilters({
  status,
  category,
});
```

Diffs de PR más estrechos y legibles en split-view.

### `tabWidth: 2` + `useTabs: false`

```jsx
// 2 espacios por nivel; el JSX anidado no se desborda a la derecha:
function EventCard({ event }) {
  return (
    <Card>
      <CardTitle>{event.title}</CardTitle>
    </Card>
  );
}
```

### `semi: true`

```js
// Punto y coma explícito; evita trampas del ASI:
const router = express.Router();
return result;
```

### `singleQuote: true` + `jsxSingleQuote: false`

```jsx
// JS con simples, atributos JSX con dobles (convención React/HTML):
import { Button } from '@/components/ui/button';
<Button variant="outline" onClick={() => onSelect('rsvp')}>
```

### `quoteProps: 'as-needed'`

```js
// Sin comillas salvo necesidad:
const payload = { title, 'content-type': type };
```

### `trailingComma: 'es5'`

```js
// Coma final en objetos/arrays → diff de una línea al añadir claves:
const filters = {
  status,
  category,
};
```

`es5` (no `all`) para no emitir comas en parámetros de función, compatibles solo con ES2017+.

### `bracketSpacing: true`

```js
import { Router } from 'express';
const { title } = event;
```

### `bracketSameLine: false`

```jsx
// Cierre de props multilínea en su propia línea:
<Button
  variant="outline"
  size="lg"
  onClick={handleConfirm}
>
```

### `arrowParens: 'always'`

```js
// Paréntesis siempre, incluso con un parámetro:
items.map((item) => item.id);
```

Evita churn al añadir un segundo parámetro o un tipo TypeScript.

### `endOfLine: 'lf'`

Invisible pero crítica: todos los ficheros usan LF aunque se editen en Windows. Sin ella, Git mostraría cada línea como modificada al alternar SOs.

## 5. Integración con CI (`npm run lint`, `lint-staged`, `format:check`)

Cadena completa de calidad de formato, de local a CI:

```text
editor (formatOnSave) → pre-commit (lint-staged) → CI (lint + format:check)
```

| Etapa               | Comando                                            | Dónde                                                     | Qué hace                                                                                                                    |
| ------------------- | -------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Edición             | guardado automático                                | `.vscode/settings.json`                                   | Prettier formatea al guardar según `.prettierrc.yaml`.                                                                      |
| Pre-commit          | `lint-staged` (hook Husky)                         | `package.json` raíz                                       | `prettier --write` sobre ficheros staged + `eslint --fix` sobre JS.                                                         |
| CI lint             | `npm run lint`                                     | raíz → propaga a workspaces (`--workspaces --if-present`) | ESLint con `--max-warnings 0`; incluye `complexity: max 20` y `eslint-config-prettier` al final (sin conflictos de estilo). |
| CI formato cliente  | `npm run format:check --workspace=apps/client`     | job `client-format-check` en `ci.yml`                     | `prettier --check "**/*.{js,jsx,json,md}"`; falla si algo difiere.                                                          |
| CI formato servidor | `npm run format:check --workspace=apps/server`     | job `server-format-check` en `ci.yml`                     | `prettier --check "**/*.{js,json,md}"`; falla si algo difiere.                                                              |
| Verificación manual | `npm test && npm run lint && npm run format:check` | raíz (`README.md` § contribución)                         | Triada de verificación antes de abrir PR.                                                                                   |

Comandos útiles del día a día:

```bash
npm run format              # Formatea todos los workspaces (local)
npm run format:check        # Verifica todos los workspaces (simula CI)
npm run lint                # Linta todos los workspaces
npx prettier --check <fichero>  # Verifica un fichero concreto
npx prettier --write <fichero>  # Formatea un fichero concreto
```

Regla de oro: si `format:check` falla en CI, la solución nunca es tocar la configuración en el PR; es ejecutar `npm run format` en local, commitear el resultado y volver a pushear. Los cambios a `.prettierrc.yaml` son decisiones de equipo y van en PRs dedicados con su justificación en el comentario ES correspondiente.
