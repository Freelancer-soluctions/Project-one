# Design

> Restore de una regresión de la migración TS (commit `bf3cf1f2`) + cierre del modo de fallo silencioso de
> `helmet.config.ts` + limpieza de la supresión en `knip.jsonc`. Sin cambios de política CSP.
> Gates por commit: `type-check`, `lint`, `test:unit`, `depcruise:server`, `knip`.

## Decisión 1 — Se restaura la línea, no se rediseña el middleware

Evidencia del estado original (`git show bf3cf1f2^:apps/server/src/app.js`): L8 importa `helmetConfig` y L16 lo monta
justo después de `const app = express()`. El restore es literal:

```ts
import { helmetConfig } from './utils/helmet/helmet.config.js';
// …
const app = express();
app.use(helmetConfig);
```

**Por qué la posición importa** (y no es un detalle cosmético): helmet debe ejecutarse antes de que cualquier otro
middleware pueda producir una respuesta. Con el orden actual (urlencoded → json → cookieParser → cors → rutas →
`errorHandler`), montarlo al final dejaría sin cabeceras precisamente las respuestas de error, que son las que más
información filtran. Al montarlo primero, incluso un 400 del body parser o un 404 del `errorHandler` salen con CSP,
nosniff y sin `X-Powered-By`.

**Descartado:** envolver `helmetConfig` en una factory, moverlo junto a `cors`, o reordenar el resto de la pipeline. El
non-goal es explícito: ningún otro middleware se mueve, renombra ni se elimina.

## Decisión 2 — El test vive en `src/app.unit.test.ts` (supertest in-process, sin DB)

Nivel elegido: **unit colocado**, `apps/server/src/app.unit.test.ts`, con `supertest` sobre la `app` exportada.

Motivos, en orden de peso:

1. **Es el gate que el change necesita.** `npm run test:unit --workspace=server-express` es `vitest run ".unit.test"` y
   `vitest.config.ts` incluye `src/**/*.unit.test.{js,ts}`. Un test en `tests/integration/**` sólo corre en
   `test:integration` (que exige PostgreSQL) y un `.smoke.test.ts` sólo en `vitest.smoke.config.ts`, que no forma parte
   del gate pedido. Poner el contrato en el nivel que no corre es cómo se perdió esta regresión la primera vez.
2. **No necesita base de datos.** Las cabeceras las pone el primer middleware: se piden a una ruta inexistente
   (`GET /api/v1/__nonexistent`), el `errorHandler` responde 404 y los headers ya están puestos. Cero dependencias
   externas, cero red, cero AWS.
3. **Reutiliza un patrón ya probado en el repo**: `tests/smoke/helpers/request.ts` importa `app` in-process con
   supertest; `supertest` y `@types/supertest` ya son devDependencies.

Aserciones (las tres del contrato observable, más las dos de refuerzo que ya emite la config actual):
`x-powered-by` ausente · `content-security-policy` contiene `default-src 'self'` y `frame-ancestors 'none'` ·
`x-content-type-options: nosniff` · `x-frame-options: DENY` · `referrer-policy: strict-origin-when-cross-origin`.

**Contra-prueba obligatoria (mutation check):** comentar `app.use(helmetConfig)`, correr `test:unit` y ver el rojo;
restaurar y ver el verde. Sin esa evidencia el test no prueba nada.

**Descartado:** integración con BD (más caro, mismo contrato), smoke (fuera del gate `test:unit`), y un test unitario
de `helmetConfig` aislado con un `res` falso (verifica el objeto de opciones, no el **montaje** — que es exactamente
lo que se rompió).

## Decisión 3 — `requireEnv` en `helmet.config.ts`: el throw es EAGER en la práctica

`requireEnv` es perezoso **por diseño** (lanza al acceder, no al importar `dotenv.ts`), pero eso no ayuda aquí:
`helmet.config.ts` construye `helmet({...})` en **module scope**, así que `requireEnv('FRONTEND_URL')` se ejecuta al
evaluar el módulo. Y el módulo se evalúa al importar `app.ts`.

| Momento                       | Qué ocurre                                                               |
| ----------------------------- | ------------------------------------------------------------------------ |
| Arranque (`src/bin/index.ts`) | `import app` → `helmet.config.ts` → `requireEnv` → throw si falta la key |
| Suite de tests                | `src/app.unit.test.ts` / smoke importan `app` → mismo throw              |
| Runtime de una request        | Nada: el módulo ya se evaluó (o ya reventó)                              |

Consecuencia operativa, y es la parte que puede romper el repo si se olvida: hoy **ningún entorno declara
`FRONTEND_URL`** — ni `.env.test` (solo tiene `NODE_ENV=test`), ni `.env.example`, ni el `.env` local. Por tanto este
change DEBE incluir en el **mismo commit**:

- `apps/server/.env.test` → `FRONTEND_URL=http://localhost:5173` (valor de test; el CSP no se valida contra él).
- `apps/server/.env.example` → `FRONTEND_URL=` documentada como **requerida** (el throw nombra la key).

Si se separa en commits, el commit intermedio deja `test:unit` en rojo por un throw de import, que es un fallo
confuso (no apunta al test que lo causó).

**Cómo se testea el fail-loud sin romper el resto del suite:** un test dedicado que aísla el módulo con
`vi.resetModules()`, borra `process.env.FRONTEND_URL`, hace `await import('./utils/helmet/helmet.config.js')` y espera
el mensaje `❌ Missing required env var: FRONTEND_URL`; en `finally` restaura el valor. Si el aislamiento resulta
inestable en Vitest 4 (módulos ya cacheados por otros ficheros), el fallback aceptado es cubrirlo en
`config/dotenv.unit.test.ts` con la key `FRONTEND_URL` sobre `requireEnv` directamente y dejar el escenario de
`helmet.config` verificado por el throw real del arranque. Se documenta la elección en el commit, no se deja implícita.

**Descartado:** leer las keys dentro de un middleware (`app.use((req,res,next) => …requireEnv…`), que convertiría un
error de configuración en un 500 por request); y dar un default silencioso a `FRONTEND_URL` (es exactamente el bug que
se está cerrando).

## Decisión 4 — La supresión de `knip.jsonc` se retira, no se re-comenta

Los tres ignores que hoy tapan la regresión son deuda declarada por otro change:

| Ubicación en `knip.jsonc`                                                     | Acción        | Motivo                                                            |
| ----------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------- |
| `apps/server.ignoreDependencies` → `"helmet"`                                 | **quitar**    | vuelve a tener consumidor (`app.ts`), knip lo resuelve solo       |
| `apps/server.ignoreDependencies` → `"nodemon"`                                | **quitar**    | se desinstala del manifest (`dev` es `tsx watch` desde la Fase 2) |
| comentario L175-182 (deuda de la rama TS)                                     | **quitar**    | describe un estado que este change cierra                         |
| `apps/server.ignoreIssues` → `"src/utils/helmet/helmet.config.ts": ["files"]` | **quitar**    | el archivo deja de ser huérfano                                   |
| comentario L217-220 (regresión de seguridad)                                  | **quitar**    | idem                                                              |
| `apps/server.ignoreIssues` → `"src/modules/security/types.ts": ["files"]`     | **conservar** | deuda de `server-ts-domain-interfaces`, ajena a este change       |

Criterio: `npm run knip` exit 0 **sin** añadir ignores nuevos. Si knip reporta algo más, se corrige el código o se
documenta la causa en el commit; no se amplía la supresión.

## Decisión 5 — Limitación de helmet 8.1.0: `Permissions-Policy` y `Reporting-Endpoints` no se emiten

Verificado por `grep` en `node_modules/helmet/index.cjs` (sin coincidencias para `permissionsPolicy` ni
`reportingEndpoints`) y por probe de runtime con las opciones reales del repo:

```
permissions-policy: <absent>
reporting-endpoints: <absent>
```

`helmet.config.ts` declara ambas opciones y las castea a `HelmetOptions` con un comentario que asume que "el runtime
solo lee las claves que conoce". Es cierto que no rompen, pero **tampoco hacen nada**: no hay header
`Permissions-Policy`, y `report-to 'csp-endpoint'` apunta a un grupo de endpoints que nunca se declara (el canal que
funciona es `report-uri`). **No se arregla en este change** (non-goal: no tocar directivas CSP ni añadir middleware) y
por eso **la spec de `server-security-headers` NO promete `Permissions-Policy`**. Queda como deuda para un change de
cabeceras específico.

## Decisión 6 — Dependencia de orden con `sast-shift-left-hooks-parity`

Ese change (4/4 artefactos, sin archivar) introduce en `knip.jsonc` los ignores que blanquean esta regresión y registra
en su task 9.4 que "requiere un change dedicado". Regla de secuencia:

1. `server-restore-helmet-middleware` se implementa, verifica y **archiva primero**.
2. Después se archiva `sast-shift-left-hooks-parity`, cuyos spec deltas ya no describirán un `knip.jsonc` con esas
   excepciones.

Invertir el orden archiva como permanente una supresión que este change elimina.

## Decisión 7 — Rollback y gate

Rollback = revertir el commit completo (un solo commit: import + `app.use` + requireEnv + `.env.test`/`.env.example` +
knip/nodemon + docs). No hay migración de datos ni cambio de contrato de API. Los gates de cierre son los cinco ya
usados en el repo (`type-check`, `lint`, `test:unit`, `depcruise:server`, `knip`) más `openspec validate --strict`.
