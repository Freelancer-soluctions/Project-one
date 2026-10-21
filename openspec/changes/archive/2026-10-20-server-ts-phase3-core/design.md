# Design

> Hereda decisiones 1-9 del padre y las de Fases 1-2. Decisiones propias del núcleo transversal y del switch de runtime.

## Decisión 1 — Orden interno: bottom-up por dependencias, bin al final

```
middleware (12) → socket (22) + docs (2) → utils (17) → app (1) → bin (1) + switch runtime
```

middleware primero (todos los lotes posteriores lo consumen para `req.user`); socket y docs en paralelo posible (independientes); utils después (middleware ya no depende de tipos incompletos); `app` compone todo lo tipado; `bin` ÚLTIMO porque su conversión ES el switch de runtime. Sub-lotes con gates tras cada uno.

## Decisión 2 — Tipado estructural: el valor real de Fase 3

- **`declare global`** (en `middleware/verifyToken.ts` o `types/express.d.ts` del server): `Request.user` con el tipo del payload JWT verificado. Contrato con Fase 2: los controllers que usaron cast local se migran al tipo global (task de limpieza incluida).
- **`RequestHandler` genérico** en errorHandler/handleCatchErrorAsync: firma `(err: unknown, req, res, next)` — pre-adapta `useUnknownInCatchVariables` (Fase 4) sin activarla.
- **socket.io**: `interface AuthenticatedSocket extends Socket { data: { user: JwtPayload } }` — patrón oficial socket.io v4 (datos tipados en `socket.data`, no en propiedades ad-hoc).
- **Sin `enum` runtime** (heredado de Fase 1 §3): niveles socket, estados, constantes → `as const` + unions.

## Decisión 3 — Switch de runtime a `tsx` (padre decisión 9)

| Punto                                   | Antes                             | Después                                                                          |
| --------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------- |
| `apps/server/package.json` script `dev` | `nodemon src/bin/index.js`        | `tsx watch src/bin/index.ts` (nodemon queda para configs si aplica, o se retira) |
| `ecosystem.config.json` (PM2)           | `script: 'src/bin/index.js'`      | `script: 'tsx', args: 'src/bin/index.ts'`                                        |
| Dockerfile CMD                          | `CMD ["node","src/bin/index.js"]` | `CMD ["tsx","src/bin/index.ts"]`                                                 |
| `tsx`                                   | —                                 | **`dependencies`** (no devDeps: el Dockerfile ejecuta `npm prune --omit=dev`)    |

**PM2 cluster vs fork** (riesgo conocido — task 4.1 del padre lo exige): verificación de arranque real con `pm2 start` en **cluster mode**; si `tsx` como script falla en cluster (comportamiento histórico frágil), migración EXPLÍCITA a `exec_mode: 'fork'` con instancias ajustadas y decisión documentada en tasks con su justificación. Nunca silencioso.

**Verificación de arranque (obligatoria antes de cerrar):** `pm2 start` real + smoke de health endpoint; Docker build si el daemon está disponible (si no, validación en CI del PR — limitación registrada desde Fase 0).

## Decisión 4 — `docs/schemas.js` como sub-lote mecánico aislado

2.868 LOC de definiciones OpenAPI: conversión mecánica (objeto literal → tipado con `Record<string, ...>`/interfaces mínimas), sub-lote propio sin mezclar con lógica. Riesgo bajo, volumen alto — no bloquea el resto.

## Decisión 5 — `req.user` y los accesos desde Fase 2

Evidencia verificada (2026-10-15): **95 accesos a `req.user` en 23 ficheros** de `src/` (controllers/services de Fase 2 y middleware), **0 casts `as any`** — el acceso es JS puro sin tipar. Por tanto el `declare global` de 1.1 tipifica automáticamente esos 95 accesos (no hay "casts locales que limpiar" — corrección de la premisa inicial). La tarea de verificación (5.2) comprueba que los 95 accesos type-chequean contra el tipo global y ajusta el tipo global a la evidencia del payload real del JWT — nunca al revés. Si algún acceso usa campos fuera del payload (`req.user?.campo` opcional), el tipo global los declara opcionales.

## Decisión 6 — Cierre de `src/` a 0 `.js`

Al cerrar: `git ls-files 'src/**/*.js' 'src/*.js'` → 0; contador del padre → `228/236`; los 8 restantes (configs/prisma/scripts) pertenecen a la Fase configs del padre (secciones 5.1-5.7), NO a este change. Gates de cierre: 4 gates + suite unit completa + (CI) integration/smoke + arranque PM2 real + validate `--strict`.

## Desviación registrada — protocolo de commits (post-review 2026-10-20)

El protocolo "un archivo = un commit" NO se cumplió en la implementación ejecutada por la sesión paralela: las 55 conversiones de Fase 3 se aplastaron en commits de Fase 2/3 (`bf3cf1f2`), perdiendo la trazabilidad task↔commit. La verificación @reviewer (2026-10-20) confirmó la implementación correcta por inspección del árbol (no por git). Además el Dockerfile quedó corrupto por un find/replace fallido (`b/` paths, workspace/schema incorrectos, `WORKDIR` eliminado) — restaurado y verificado END-TO-END: `docker build` exit 0 + contenedor arranca con tsx + docs 301 (ENV PATH=/app/node_modules/.bin añadido para el exec-form CMD). La excepción `any` de `prisma-model.ts` quedó documentada en código.
