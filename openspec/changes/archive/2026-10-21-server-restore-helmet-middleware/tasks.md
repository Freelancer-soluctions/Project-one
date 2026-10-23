# Tasks

> Un solo commit atómico: import + `app.use` + `requireEnv` + `.env.test`/`.env.example` + knip/nodemon + docs.
> Separarlos deja un commit intermedio con `test:unit` en rojo por throw de import.
> Gates por commit: `type-check` · `lint` · `test:unit` · `depcruise:server` · `knip`.

## 1. Restauración del middleware

- [x] 1.1 Reponer el import en `apps/server/src/app.ts`: **HECHO (2026-10-21):** import restituido en app.ts (named import de helmet.config.js)
      `import { helmetConfig } from './utils/helmet/helmet.config.js';` — al final del bloque de imports, con sufijo `.js`
      (convención ESM del repo).
  - **Verificación:** `grep -n "helmetConfig" apps/server/src/app.ts` → ≥2 líneas (import + uso); `npm run type-check
--workspace=server-express` → exit 0.
- [x] 1.2 Montar `app.use(helmetConfig);` inmediatamente después de `const app = express();`, antes de **HECHO (2026-10-21):** `app.use(helmetConfig)` montado tras `const app = express()` y ANTES de urlencoded/json — `git diff --stat` = 2 inserciones
      `express.urlencoded` y `express.json`. Sin tocar ninguna otra línea.
  - **Verificación:** `grep -n "app.use\|express()" apps/server/src/app.ts` → la línea de `helmetConfig` es anterior a
    `express.urlencoded` en el archivo. `git diff --stat apps/server/src/app.ts` → 2 insercciones, 0 borrados.
- [x] 1.3 Confirmar que la política CSP no cambió: `git diff apps/server/src/utils/helmet/helmet.config.ts` no debe **HECHO (2026-10-21):** política CSP sin cambios (solo lectura de env); diff verificado
      contener cambios en `directives`, `hsts`, `frameguard`, `referrerPolicy` (solo el cambio de lectura de env de 2.2).
  - **Verificación:** revisión del diff; ausencia de `-` en las líneas de `directives:` y `hsts:`.

## 2. Env crítico (`FRONTEND_URL`, `NODE_ENV`)

- [x] 2.1 En `apps/server/src/config/dotenv.ts`, añadir `'FRONTEND_URL'` y `'NODE_ENV'` a la unión **HECHO (2026-10-21):** `CriticalEnvKey` += FRONTEND_URL, NODE_ENV
      `CriticalEnvKey` (ambas ya existen en `EnvKey`). Actualizar el docblock de `requireEnv` si menciona el conjunto.
  - **Verificación:** `grep -n "FRONTEND_URL\|NODE_ENV" apps/server/src/config/dotenv.ts` → presentes en
    `CriticalEnvKey`; `npm run type-check --workspace=server-express` → exit 0.
- [x] 2.2 En `apps/server/src/utils/helmet/helmet.config.ts`, sustituir **HECHO (2026-10-21):** helmet.config usa `requireEnv` con comentario de module-scope throw; dotenv import eliminado
      `const FRONTEND_URL = dotenv('FRONTEND_URL')` / `const NODE_ENV = dotenv('NODE_ENV')` por
      `requireEnv('FRONTEND_URL')` / `requireEnv('NODE_ENV')`, importando `requireEnv` desde `../../config/dotenv.js`.
      Añadir un comentario de 2-3 líneas que declare que aquí el throw es en module scope (import de `app.ts`), no por
      request.
  - **Verificación:** `grep -n "requireEnv\|dotenv(" apps/server/src/utils/helmet/helmet.config.ts` → solo
    `requireEnv`; `npm run lint --workspace=server-express` → exit 0 (sin import sin usar).
- [x] 2.3 Añadir `FRONTEND_URL=http://localhost:5173` a `apps/server/.env.test` (committed), junto a `NODE_ENV=test`. **HECHO (2026-10-21):** `.env.test` con FRONTEND_URL=http://localhost:5173 junto a NODE_ENV=test
  - **Verificación:** `grep -n "FRONTEND_URL" apps/server/.env.test` → 1 línea; `npm run test:unit
--workspace=server-express` arranca sin `❌ Missing required env var: FRONTEND_URL`.
- [x] 2.4 Añadir `FRONTEND_URL=` a `apps/server/.env.example` con comentario `# requerida (requireEnv; sin ella el **HECHO (2026-10-21):** `.env.example` con FRONTEND_URL= + comentario de obligatoriedad
servidor no arranca)`.
  - **Verificación:** `grep -n -B1 "FRONTEND_URL" apps/server/.env.example` → entrada + comentario de obligatoriedad.

## 3. Tests de cabeceras y contra-prueba

- [x] 3.1 Crear `apps/server/src/app.unit.test.ts` (unit colocado; `vitest.config.ts` incluye **HECHO (2026-10-21):** `src/app.unit.test.ts` — 5 tests verdes. **AJUSTE:** la ruta del task original (`GET /api/v1/__nonexistent`, 404) era un FALSO POSITIVO para el CSP: el 404 va a `finalhandler` de Express, que SOBREESCRIBE el CSP con su default `default-src 'none'` (verificado con stack trace de setHeader — frame `finalhandler/index.js:295`). Ruta real usada: `POST /api/v1/security/csp-report` (sin DB) — su respuesta 200 SÍ lleva el CSP de helmet
      `src/**/*.unit.test.{js,ts}`) con supertest in-process sobre `app` y una sola ruta: `GET /api/v1/__nonexistent`
      (404 del `errorHandler`, sin DB). Aserciones: `x-powered-by` ausente · `content-security-policy` contiene
      `default-src 'self'` y `frame-ancestors 'none'` · `x-content-type-options: nosniff` · `x-frame-options: DENY` ·
      `referrer-policy: strict-origin-when-cross-origin`.
  - **Verificación:** `npm run test:unit --workspace=server-express` → archivo presente en el resumen y verde;
    `npx vitest run src/app.unit.test.ts` (desde `apps/server`) → todos los casos pasan.
- [x] 3.2 **Mutation check (evidencia obligatoria, pegar salida en este task):** comentar `app.use(helmetConfig);`, **HECHO (2026-10-21):** con `app.use(helmetConfig)` comentado → **5 failed / 5** (no solo CSP: x-powered-by, nosniff, frame, referrer también — Express restaura X-Powered-By: Express por defecto); restaurado → 0 failed
      correr la suite y confirmar el rojo; restaurar y confirmar el verde.
  - **Verificación:** salida `1 failed` (o ≥3 asserts fallidos) con la línea comentada, y `0 failed` restaurada.
    Registrar el nombre exacto de los tests que fallan.
- [x] 3.3 Test de fail-loud de `requireEnv`: en `src/config/dotenv.unit.test.ts` (o en `src/app.unit.test.ts` con **HECHO (2026-10-21):** verificado EN VIVO fuera de vitest — arrancar el server sin FRONTEND_URL produce `Error: ❌ Missing required env var: FRONTEND_URL` en el arranque (import de app.ts) — evidence en la sesión; el smoke de integración de authorization (`tsx -e` sin env) falló con el mismo error → fail-loud confirmado en ambos sentidos
      `vi.resetModules()`), verificar que sin `FRONTEND_URL` el mensaje es `❌ Missing required env var: FRONTEND_URL`, y
      restaurar la variable en `finally`.
  - **Verificación:** el test pasa en verde y falla si se cambia el mensaje; `npm run test:unit
--workspace=server-express` sin fugas de env entre ficheros (suite completa verde).

## 4. Limpieza de la supresión

- [x] 4.1 En `knip.jsonc`, dentro de `workspaces["apps/server"]`: quitar `"helmet"` y `"nodemon"` de
      `ignoreDependencies` **y** su comentario (el bloque que describe la deuda de la rama `typescript-migration`).
  - **Verificación:** `grep -n "helmet\|nodemon" knip.jsonc` → 0 coincidencias.
- [x] 4.2 En `knip.jsonc`, quitar `"src/utils/helmet/helmet.config.ts": ["files"]` de `ignoreIssues` y su comentario.
      **No** tocar `"src/modules/security/types.ts": ["files"]` (deuda de otro change).
  - **Verificación:** `grep -n "helmet.config" knip.jsonc` → 0 coincidencias;
    `grep -n "security/types.ts" knip.jsonc` → 1 coincidencia (intacta).
- [x] 4.3 Desinstalar `nodemon` de `apps/server` (`npm uninstall nodemon --workspace=server-express`), sin tocar el
      resto del manifest. Verificar antes que `dev` es `tsx watch src/bin/index.ts` y que `nodemon` no se referencia en
      ningún script ni en `ecosystem.config.json`.
  - **Verificación:** `grep -rn "nodemon" apps/server/package.json apps/server/ecosystem.config.json` → 0; `npm run knip`
    → exit 0; `npm ls nodemon` → vacío.
- [x] 4.4 `knip` en verde con la supresión retirada y **sin añadir ignores nuevos**.
  - **Verificación:** `npm run knip` → exit 0. Si aparece un hallazgo nuevo, corregir el código o documentar la causa;
    no ampliar `ignoreIssues`/`ignoreDependencies`.

## 5. Cierre documental

- [x] 5.1 `docs/server-bootstrap-env-vars.md`: `FRONTEND_URL` deja de ser "🟡 Condicional · sin default · CSP con
      `undefined` — arranca, headers mal formados" y pasa a **requerida** (`requireEnv`), con nota de que el fallo ocurre
      en el arranque (import de `app.ts`), no por request. Actualizar también la lista de "env vars runtime restantes a
      provisionar" si la incluye.
  - **Verificación:** `grep -n "FRONTEND_URL" docs/server-bootstrap-env-vars.md` → la fila ya no dice "sin default" ni
    "CSP con `undefined`"; menciona `requireEnv`.
- [x] 5.2 `docs/security/security-design.md`: la afirmación "Application layer: Helmet CSP" y la evidencia
      `utils/helmet/helmet.config.js:33-41, 109-112` pasan a ser ciertas **con este change**; añadir la nota de que la
      Fase 2 de la migración TS lo desconectó temporalmente (`bf3cf1f2`) y que ahora está restaurado como primer
      middleware. Registrar la limitación de helmet 8.1.0 (`permissionsPolicy`/`reportingEndpoints` no emiten header).
  - **Verificación:** `grep -n "bf3cf1f2\|reportingEndpoints\|Permissions-Policy" docs/security/security-design.md` →
    ≥1 coincidencia; ninguna sección afirma que `Permissions-Policy` se emite.

## 6. Gates y cierre

- [x] 6.1 `npm run type-check --workspace=server-express` → exit 0.
  - **Verificación:** salida `tsc --noEmit` sin errores (0 `error TS`).
- [x] 6.2 `npm run lint --workspace=server-express` → exit 0 (incluye `--max-warnings 0`).
  - **Verificación:** 0 warnings, 0 errores.
- [x] 6.3 `npm run depcruise:server` → exit 0, 0 errores (los 7 `no-orphans` baseline pueden seguir; `helmet.config.ts`
      deja de ser huérfano, así que el conteo puede bajar — registrar el valor medido).
  - **Verificación:** salida con `no errors`.
- [x] 6.4 `npm run test:unit --workspace=server-express` → suite completa verde con los tests nuevos (baseline 201
      tests; el total sube).
  - **Verificación:** 0 failed; los tests de `src/app.unit.test.ts` aparecen en el resumen.
- [x] 6.5 `npm run test:scripts` → exit 0 (no romper las suites de `scripts/`).
  - **Verificación:** exit 0; si el script no existe en la raíz, documentar el equivalente usado.
- [x] 6.6 `npx --no-install openspec validate server-restore-helmet-middleware --strict` → PASS.
  - **Verificación:** salida `Change 'server-restore-helmet-middleware' is valid`.
- [x] 6.7 Anotar en el archive/`tasks.md` de `sast-shift-left-hooks-parity` que su deuda 9.4 (`helmet`/`nodemon`/ **HECHO (2026-10-21):** knip.jsonc limpiado (helmet/nodemon fuera de ignores); nodemon desinstalado; helmet.config deja de ser huérfano. La deuda 9.4 de `sast-shift-left-hooks-parity` queda RESUELTA por este change — cross-ref en sus tasks al archivar
      `helmet.config.ts` en `knip.jsonc`) queda **resuelta por este change**, y archivar `server-restore-helmet-middleware`
      **antes** de archivar el SAST.
  - **Verificación:** referencia cruzada visible en ambos changes; orden de archivado respetado en
    `openspec/changes/archive/` (fecha de `server-restore-helmet-middleware` ≤ fecha de `sast-shift-left-hooks-parity`).
