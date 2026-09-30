# Configuración de TypeScript Strict — Implementación Profesional

## 1. Contexto y estado actual

El monorepo `project-one` (React/Express) tiene `typescript: 5.9.3` en `dependencies` de raíz (`package.json` L858) y `apps/server/` adquiere `typescript-migration-server.md` como change activo. Actualmente `apps/server/` NO tiene `tsconfig.json`; `lint-staged` cubre `*.ts,tsx` solo para `prettier`; `eslint.config.js` no incluye `ts` en glob (`*.js`; falta `*.ts`); `server-typecheck` en `.github/workflows/ci.yml` (L538) tiene `if: false` y `|| echo "TypeCheck: no-op..."`; `package.json` raíz NO tiene script `type-check`; `lint-staged` raíz (l.91-94) cubre `*.{js,jsx,cjs,mjs}` pero NO `*.ts` para `eslint`.

Referencia: `docs/learning/typescript-migration-server.md` (219 líneas, creado 2026-09-23, verificado 2026-09-23); `package.json` (typescript L858); `.github/workflows/ci.yml` (L450 `client-typecheck`, L538 `server-typecheck`, L750 `needs`, L1099-1105 agregadores `prebuild-quality-complete`); `docs/CONTEXT-CICD.md` (§13.4, estados de CI).

## 2. Por qué `strict` y por qué gradual

`strict` (TypeScript 5.9.3 / 6.0+) activa la familia completa de chequeos de tipo: `noImplicitAny`, `strictNullChecks`, `strictBindCallApply`, `strictFunctionTypes`, `strictPropertyInitialization`. No es un solo flag; es un **paquete de comportamiento**. Según docs oficiales (`typescriptlang.org/tsconfig/strict`): `strict` habilita todos los de esa familia; versiones futuras pueden añadir más. El cambio a `strict: true` en un codebase existente sin `tsconfig.json` previno (como `apps/server/`) puede producir miles de errores (`TS7006`, `TS18048`, `TS2564`).

Por lo tanto, la implementación profesional requiere **gradualidad** (gradual adoption): un flag por PR (o por sub-grupo de archivos), con baseline (`tsc --noEmit 2>&1 | wc -l`) antes y después. Esto es consistente con la recomendación del handbook `tsconfig-json.html`: `tsconfig.json` es raíz de proyecto; `tsc --noEmit` valida sin emitir archivos; `-p apps/server` restringe al workspace.

Referencia: `https://www.typescriptlang.org/tsconfig/strict`, `https://www.typescriptlang.org/docs/handbook/tsconfig-json.html` (`tsconfig.json` root, `-p/--project`), `https://www.typescriptlang.org/docs/handbook/intro-to-js-ts.html` (escalera de strictness: inferencia JS → JSDoc → `@ts-check` → TypeScript → "TypeScript with strict").

## 3. Tabla de flags `strict` y opt-in

| Flag                                    | Familia `strict`?   | Default (`strict` on/off)         | Error típico                                                               | Costo estimado `apps/server`                                                                             | Orden recomendado                                      |
| --------------------------------------- | ------------------- | --------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `alwaysStrict`                          | Sí                  | `true`/`false`                    | Emite `"use strict"`                                                       | Bajo (deprecado `false` en TS 6.0)                                                                       | Fase 0 (si `false`, fijar `true`; si 6.0, obligatorio) |
| `noImplicitAny`                         | Sí                  | `true`/`false`                    | TS7006 (`Parameter 's' implicitly has 'any'`)                              | **ALTO** (~2.556 JSDoc anotaciones; mayor impacto en `apps/server/` con JSDoc-heavy)                     | Fase 1 (primero, mayor valor)                          |
| `strictNullChecks`                      | Sí                  | `true`/`Only if strict` / `false` | TS18048 (`'x' is possibly 'undefined'`)                                    | **ALTO** (DAOs Prisma `findFirst()` → `\| undefined`; `req.user`, `rows[0]`)                             | Fase 2 (después de `noImplicitAny`)                    |
| `strictBindCallApply`                   | Sí                  | `true`/`false`                    | Error en args `call`/`bind`/`apply`                                        | Medio (solo controllers con `bind`)                                                                      | Fase 2 (junto con `strictNullChecks`)                  |
| `strictFunctionTypes`                   | Sí                  | `true`/`false`                    | Contravariancia de parámetros                                              | **Bajo** (no aplica a sintaxis de método — exención documentada; poco efecto en controllers tipo objeto) | Fase 2                                                 |
| `strictPropertyInitialization`          | Sí                  | `true`/`false`                    | TS2564 (propiedad sin inicializar)                                         | Medio (`prisma` clients, clases de servicio)                                                             | Fase 2                                                 |
| `useUnknownInCatchVariables`            | Sí                  | `true`/`false`                    | `catch (err)` → `unknown`                                                  | **Bajo** (media en middleware de errores Express)                                                        | Fase 3 (último de la familia strict)                   |
| `strictBuiltinIteratorReturn`           | Sí (TS 5.6+)        | `true`/`false`                    | Iterador integrado                                                         | Bajo (si se usa `for...of`)                                                                              | Fase 3 (si aplica)                                     |
| `noImplicitReturns`                     | **No** (opt-in 1.8) | `false`                           | TS2366 (falta `return`)                                                    | **Muy bajo**                                                                                             | **Primero** — barato, sin riesgo                       |
| `noFallthroughCasesInSwitch`            | **No** (opt-in 1.8) | `false`                           | TS7029 (fallthrough)                                                       | **Muy bajo**                                                                                             | **Primero** — barato                                   |
| `noUncheckedIndexedAccess`              | **No** (opt-in 4.1) | `false`                           | `rows[0]` → `\| undefined`                                                 | **ALTO** (19 accesos directos `req.body[key]`, `process.env[KEY]`, DAOs)                                 | **Último** — más costoso                               |
| `exactOptionalPropertyTypes`            | **No** (opt-in 4.4) | `false`                           | Asignación `undefined` explícito a `colorThemeOverride?: "dark"` rechazada | Medio (`env` config, opciones)                                                                           | Último (`4.4`)                                         |
| `noPropertyAccessFromIndexSignature`    | **No**              | `false`                           | `obj[key]` → requiere `obj[key as string]`                                 | Medio                                                                                                    | Último                                                 |
| `noUnusedLocals` / `noUnusedParameters` | **No**              | `false`                           | Variables no usadas                                                        | Bajo                                                                                                     | Último (opcional)                                      |

Notas de implementación: `strict: true` activa todos los de la fila `Sí`. `noImplicitReturns` y `noFallthroughCasesInSwitch` (opt-in 1.8) deben activarse primero porque son baratos y dan valor inmediato. `noUncheckedIndexedAccess` (4.1) va al final porque afecta todos los accesos por índice (DAOs, `process.env`, `req.body`).

## 4. Impacto real en `apps/server/` (Express / Prisma / TypeScript)

### 4.1 `strictNullChecks` (TS 2.0+)

- **Prisma**: `prisma.user.findFirst({ where: { id } })` pasa de tipo `User` a `User | undefined`. Todos los controllers que hacen `const user = await prisma.user.findFirst(...)`; luego `user.email` fallan con `TS18048`. Solución: `if (!user) throw new NotFoundError()` antes de usar.
- **Express**: `req.user` (agregado por middleware de auth) pasa de `User` a `User | undefined`. `req.body` con `any` por defecto (sin `strictNullChecks` no cambia, pero con `noImplicitAny` sí).
- **Middleware de errores**: `catch (err)` pasa a `unknown` si `useUnknownInCatchVariables` activo; requiere `if (err instanceof Error) { ... }`.

Referencia: `typescriptlang.org/tsconfig/strict` (definición de `strictNullChecks`); `docs/CONTEXT-CICD.md` (pipeline de calidad).

### 4.2 `noUncheckedIndexedAccess` (TS 4.1)

- **DAOs Prisma**: `rows[0]` → `Row | undefined`; `rows[1]` → error si `rows` tiene menos de 2 elementos.
- **`process.env[KEY]`**: `process.env['NODE_ENV']` → `string | undefined`; requiere verificación explícita o `process.env.NODE_ENV!` (assertión, si se quiere).
- **`req.body['field']`**: `req.body['name']` → `string | undefined`; obliga a usar `req.body.name` (si está declarado en interface) o verificar existencia.
- **Costo estimado**: ~19 accesos por archivo típico de controller; con 50 controllers → ~950 cambios de tipo; recomendable usar `// @ts-ignore` temporal con `reason` solo para casos críticos (no como solución permanente).

Referencia: `typescriptlang.org/tsconfig/` (lista de flags, `noUncheckedIndexedAccess`); `docs/learning/typescript-migration-server.md` (§4.4 orden de flags).

### 4.3 `noImplicitAny` (TS 1.0+)

- **Impacto más grande**: cualquier parámetro sin tipo explícito en `.js` con `checkJs: true` o en `.ts` sin anotación se convierte en error. El repo tiene ~2.556 anotaciones JSDoc en `apps/server/`; si se activa antes de completar la conversión a `.ts`, los errores serán masivos.
- **Solución**: completar `typescript-migration-server.md` (crear `tsconfig.json`, ampliar regexes, convertir archivos `.js` → `.ts`) antes de activar `noImplicitAny`.

Referencia: `typescriptlang.org/tsconfig/strict` (`noImplicitAny`); `docs/learning/typescript-migration-server.md` (§3.1 tsconfig propuesto).

### 4.4 `strictBindCallApply` (TS 3.2+)

- Aplicable solo a `call()`/`bind()`/`apply()`; limitado a controllers/funciones que usan estas sintaxis. Poco impacto si no hay uso extensivo.

## 5. CI (`.github/workflows/ci.yml`) — Implementación profesional

### 5.1 Scripts `package.json`

```json
"type-check": "tsc --noEmit -p apps/server",
"type-check:client": "tsc --noEmit -p apps/client",
"type-check:ci": "tsc --noEmit --incremental -p apps/server --build"
```

Nota: `typescript: 5.9.3` está hoy en `dependencies` de raíz; si `type-check` se activa, es recomendable moverlo a `devDependencies` (o al menos tener `typescript` como `devDep` para evitar que se instale en producción). En `apps/server/package.json`: no hay `typescript` hoy; si se activa `type-check`, debe ser `devDependency`.

Referencia: `package.json` (L858 `typescript: 5.9.3`, tipo `dependencies`); `docs/CONTEXT-CICD.md` (§13.4, estado `pending` → `green` para `server-typecheck`).

### 5.2 `lint-staged` (pre-commit)

```json
"lint-staged": {
  "*.{js,jsx,cjs,mjs,ts,tsx}": [
    "prettier --write",
    "eslint --fix --max-warnings 0 --no-warn-ignored",
    "tsc --noEmit --incremental --noEmitOnError false -p apps/server"
  ]
}
```

Nota: `tsc --noEmit --incremental` sobre `*.ts` staged NO valida todo el proyecto (solo archivos modificados); más seguro usar `pre-push` para validación completa (`npm run type-check`) y `lint-staged` solo para `prettier` + `eslint`. Si se activa `lint-staged`, usar `--noEmitOnError false` para que no falle el commit si hay errores en archivos staged (solo advertencia), o usar `|| true` temporal en fase 1.

### 5.3 CI (`server-typecheck` y `client-typecheck`)

Hoy: `client-typecheck` (`L450`) y `server-typecheck` (`L538`) con `if: false` y `|| echo "TypeCheck: no-op until TS migration"`.

Propuesta de cambio (alineado con `github/workflows/ci.yml`, sin renombrar jobs, con `needs` y agregadores):

```yaml
# L538 (server-typecheck): quitar if: false y || echo; mantener working-directory: apps/server
- name: Type check server (strict migration)
  working-directory: apps/server
  run: npm run type-check # o `npx tsc --noEmit -p apps/server`

# L450 (client-typecheck): si se activa en futuro con tsconfig
- name: Type check client
  working-directory: apps/client
  run: npm run type-check:client # o `npx tsc --noEmit -p apps/client`
```

Nota: `needs: repo-discovery` debe mantenerse; `prebuild-quality-complete` debe incluir `server-typecheck` (si se activa) y `client-typecheck` (si se activa). En fase 0 (`strict: false`, cambio inicial), los errores serán mínimos; en fase 3 (`strict: true`) se esperan errores y deben manejarse con `continue-on-error: true` temporal o con `baseline` (similar a `dependency-cruiser`).

Referencia: `docs/CONTEXT-CICD.md`; `.github/workflows/ci.yml` (L450, L538, L750, L1099-1105).

## 6. Plan gradual verificado (`typescript-migration-server.md` alineado)

El doc existente `typescript-migration-server.md` (219 líneas) propone:

- Fase 1: `strict: false` + `allowJs` + `checkJs` + `noEmit` + `nodenext` (config propuesta en §3.1).
- Fase 3.4: orden `noImplicitAny` → `strictNullChecks` → `noUncheckedIndexedAccess` → `strict: true`.
- Riesgo: `strict` de golpe → miles de errores (`TS7006`, `TS18048`, etc.).

Este documento (`typescript-strict-check.md`) complementa ese orden con:

- **Tabla de flags** con errores típicos (`TS7006`, `TS18048`, `TS2366`, `TS7029`) y costo estimado en `apps/server/` (alta para `noImplicitAny` y `strictNullChecks`; baja para `alwaysStrict` y `noImplicitReturns`).
- **CI concreto** (`npm run type-check` + `lint-staged` + `tsc --noEmit --incremental` + `prebuild-quality-complete`).
  etr bounce использовании Паспорт
- **TS 6.0 advertencia** (`strict: true` por defecto; `noEmitOnError` cambiado; `module` default `esnext`; `rootDir` default `.`; `esModuleInterop` siempre habilitado; `alwaysStrict` deprecated `false`).
- **Referencia oficial** (`typescriptlang.org/tsconfig/strict` + `typescriptlang.org/tsconfig/` + `typescriptlang.org/docs/handbook/tsconfig-json.html` + `microsoft/TypeScript` repo + `json.schemastore.org/tsconfig`).

## 7. Referencias finales

- `https://www.typescriptlang.org/tsconfig/strict`
- `https://www.typescriptlang.org/tsconfig/`
- `https://www.typescriptlang.org/docs/handbook/tsconfig-json.html`
- `https://www.typescriptlang.org/docs/handbook/intro-to-js-ts.html`
- `https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html`
- `https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html`
- `https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html`
- `https://github.com/microsoft/TypeScript`
- `https://github.com/microsoft/TypeScript-Website/tree/v2/packages/tsconfig-reference`
- `https://json.schemastore.org/tsconfig`
- `file: docs/learning/typescript-migration-server.md`
- `file: openspec/changes/server-typescript-migration/proposal.md`
- `file: package.json`
- `file: .github/workflows/ci.yml`

Referencia de datos de investigación: hallazgos del `@researcher` sobre TypeScript `strict`, `tsconfig.json`, `noUncheckedIndexedAccess`, CI `server-typecheck`, `docs/learning/typescript-migration-server.md`, `typescript` 5.9.3 / 6.0.
