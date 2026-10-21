# Proposal

> Regresión de seguridad viva, introducida por la Fase 2 de la migración TypeScript (commit `bf3cf1f2`).
> **Dependencia dura:** este change se implementa y archiva **antes** de archivar `sast-shift-left-hooks-parity`
> (ver §Impact → Dependencia).

## Why

El commit `bf3cf1f2` ("refactor(server): migrate modules to TypeScript (phase 2)") convirtió `apps/server/src/app.js`
en `app.ts` y **perdió dos líneas**: el `import { helmetConfig } from './utils/helmet/helmet.config.js'` y
`app.use(helmetConfig)`. Verificado el 2026-10-20:

| Evidencia                                                  | Resultado                                                           |
| ---------------------------------------------------------- | ------------------------------------------------------------------- |
| `git show bf3cf1f2^:apps/server/src/app.js \| grep helmet` | L8 `import { helmetConfig } …` + L16 `app.use(helmetConfig);`       |
| `git show bf3cf1f2:apps/server/src/app.ts \| grep helmet`  | sin coincidencias                                                   |
| `git show HEAD:apps/server/src/app.ts \| grep helmet`      | sin coincidencias                                                   |
| `grep -rn "helmetConfig" apps/server/src`                  | solo la definición en `utils/helmet/helmet.config.ts:21` (huérfano) |

Consecuencia: hoy **no se emiten** `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy`, ni se oculta `X-Powered-By` — una regresión OWASP A05 (Security Misconfiguration) que nadie vio
porque **ningún test cubría las cabeceras**. El endpoint de reportes CSP (`/api/v1/security/csp-report`) ya existe y
está montado (`apps/server/src/modules/security/routes.ts` → `apps/server/src/routes/v1/index.ts:48`): restaurar
helmet lo reconecta sin trabajo extra. Además la regresión está **silenciada**: `knip.jsonc` declara `helmet` y
`nodemon` como `ignoreDependencies` y `utils/helmet/helmet.config.ts` como `ignoreIssues: ["files"]`, de modo que el
gate de código muerto no la delata.

## What Changes

- **Restore fiel de helmet como primer middleware**: reponer el `import { helmetConfig }` y `app.use(helmetConfig)`
  inmediatamente después de `const app = express()`, **antes** de `express.urlencoded`/`express.json`, con las mismas
  opciones y **sin tocar la política CSP**.
- **Tests de cabeceras que faltaron**: nueva suite `src/app.unit.test.ts` con supertest in-process sobre la `app` real,
  sin base de datos, que fija el contrato observable: `x-powered-by` ausente, `content-security-policy` con
  `default-src 'self'` y `frame-ancestors 'none'`, `x-content-type-options: nosniff`.
- **`FRONTEND_URL` y `NODE_ENV` por `requireEnv`**: `helmet.config.ts` deja de usar `dotenv()` (que devuelve `''` y
  produce CSP con tokens vacíos) y pasa a `requireEnv` (`CriticalEnvKey` amplía la unión). Incluye declarar
  `FRONTEND_URL` en `.env.test` y `.env.example` **en el mismo commit**: el módulo se evalúa al importar `app.ts`.
- **Limpieza de la supresión**: retirar de `knip.jsonc` los ignores `helmet`/`nodemon` y
  `src/utils/helmet/helmet.config.ts` (con sus comentarios) y desinstalar `nodemon` de devDependencies (`dev` es
  `tsx watch` desde la Fase 2).
- **Cierre documental**: corregir `docs/server-bootstrap-env-vars.md` (`FRONTEND_URL` deja de ser "🟡 Condicional" con
  "CSP con `undefined`") y `docs/security/security-design.md` (hoy afirma que Helmet está implementado).

**Non-goals (fuera de alcance, no reabrir):** no se modifican directivas CSP; no se añade `trust proxy`; no se añade
`crossOriginResourcePolicy`; no se mueve ni renombra ningún otro middleware; no se toca `cors` ni `csrf`; **no se
promete `Permissions-Policy`** — `permissionsPolicy` y `reportingEndpoints` **no existen** en helmet 8.1.0 (verificado
por `grep` en `node_modules/helmet/index.cjs` y por probe de runtime: ambos headers salen ausentes), así que
`report-to 'csp-endpoint'` es una directiva muerta y solo `report-uri` funciona. Se documenta como limitación, no se
arregla aquí.

## Capabilities

### New Capabilities

- `server-security-headers`: Helmet montado en la pipeline de Express como primer middleware, con las cabeceras de
  seguridad observables en toda respuesta (CSP con `default-src 'self'`/`frame-ancestors 'none'`, nosniff,
  `X-Frame-Options`, Referrer-Policy, `X-Powered-By` oculto), el reporte CSP reconectado al endpoint existente, y el
  test de regresión que hace fallar el build si la línea desaparece otra vez.

### Modified Capabilities

- `server-latent-defects`: el requirement "dotenv distinguishes critical keys via requireEnv" amplía `CriticalEnvKey`
  con `FRONTEND_URL` y `NODE_ENV`, migra `utils/helmet/helmet.config.ts` a `requireEnv`, y registra la **excepción
  documentada** al principio "no module-scope throw": en ese módulo el throw ocurre al importar `app.ts`, por lo que
  cualquier entorno ejecutable (incluido el suite de tests) debe declarar `FRONTEND_URL`.

## Impact

| Archivo                                         | Cambio                                                                              |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| `apps/server/src/app.ts`                        | + `import { helmetConfig }` y `app.use(helmetConfig)` como primer middleware        |
| `apps/server/src/app.unit.test.ts`              | **nuevo** — suite de cabeceras (supertest in-process, 404, sin DB)                  |
| `apps/server/src/utils/helmet/helmet.config.ts` | `dotenv` → `requireEnv` para `FRONTEND_URL` y `NODE_ENV`                            |
| `apps/server/src/config/dotenv.ts`              | `CriticalEnvKey` += `FRONTEND_URL`, `NODE_ENV`                                      |
| `apps/server/.env.test`                         | + `FRONTEND_URL` (sin él la suite entera revienta al importar `app.ts`)             |
| `apps/server/.env.example`                      | + `FRONTEND_URL` documentada como requerida                                         |
| `apps/server/package.json`                      | `nodemon` fuera de devDependencies                                                  |
| `knip.jsonc`                                    | retirados `helmet`, `nodemon` y `src/utils/helmet/helmet.config.ts` (+ comentarios) |
| `docs/server-bootstrap-env-vars.md`             | `FRONTEND_URL` pasa a requerida; el throw ocurre en el arranque                     |
| `docs/security/security-design.md`              | Helmet vuelve a estar implementado (deja de ser una afirmación falsa)               |

**Sin cambios deliberados:** `src/modules/security/types.ts` conserva su `ignoreIssues` en `knip.jsonc` (deuda de
`server-ts-domain-interfaces`, no de este change); `helmet` permanece como dependency (vuelve a tener consumidor);
`src/modules/security/routes.ts` y `src/routes/v1/index.ts` no se tocan.

**Dependencia dura — `sast-shift-left-hooks-parity`:** el diff de ese change introduce en `knip.jsonc` los ignores
(`helmet`, `nodemon`, `src/utils/helmet/helmet.config.ts`) que **blanquean esta regresión**, y su task 9.4 la registra
como deuda de la rama `typescript-migration` "a restaurar en un change dedicado". Por tanto **este change
(`server-restore-helmet-middleware`) se implementa y se archiva ANTES de archivar `sast-shift-left-hooks-parity`**. Si
el SAST se archivara primero, su spec sincronizada declararía como aceptable un `knip.jsonc` que ya no existe en esa
forma y la deuda quedaría cerrada sin estar resuelta.

**Riesgos:** (1) **arranque**: `requireEnv` en module scope hace que un `FRONTEND_URL` ausente tumbe el proceso en el
import de `app.ts` — es el comportamiento buscado (fail loud), pero exige provisionar la variable en todos los
entornos antes de mergear; (2) **CSP en dev**: la política no cambia, así que no hay riesgo funcional para Vite, pero
cualquier origen no listado en `FRONTEND_URL` empezará a ser bloqueado en cuanto helmet se emita (hoy no se bloquea
nada porque no hay CSP); (3) **`report-to` muerto**: `reportingEndpoints` no existe en helmet 8.1.0, el header
`Reporting-Endpoints` no se emite y esa directiva no reporta — la detección real depende de `report-uri`.
